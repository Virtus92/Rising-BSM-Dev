/**
 * Base Service
 * 
 * Generic base service providing standardized business logic operations for all domain entities.
 * Implements consistent error handling, validation, and transaction management.
 */
import { NotFoundError, AppError } from './errors.js';
import { 
  FindAllOptions, 
  FindOneOptions, 
  CreateOptions,
  UpdateOptions,
  DeleteOptions 
} from '../types/service.types.js';
import { PaginationResult } from '../types/controller.types.js';
import logger from './logger.js';

/**
 * Abstract base service providing common business logic operations
 * @template T - Entity type
 * @template R - Repository type
 * @template TFilter - Filter criteria type 
 * @template TCreateDTO - Create DTO type
 * @template TUpdateDTO - Update DTO type
 * @template TResponseDTO - Response DTO type
 */
export abstract class BaseService<
  T, 
  R, 
  TFilter = any,
  TCreateDTO = any,
  TUpdateDTO = any,
  TResponseDTO = any
> {
  /**
   * Creates a new service instance
   * @param repository - Repository instance
   */
  constructor(protected readonly repository: R) {}

  /**
   * Find all entities with filtering and pagination
   * @param filters - Filter criteria
   * @param options - Query options
   * @returns Paginated list of entities with metadata
   */
  async findAll(
    filters: TFilter, 
    options: FindAllOptions = {}
  ): Promise<{ data: TResponseDTO[]; pagination: PaginationResult }> {
    try {
      // Extract repository method from the repository instance
      const repoMethod = (this.repository as any).findAll.bind(this.repository);
      
      // Get data from repository
      const result = await repoMethod(filters, options);
      
      // Map to response DTOs
      const mappedData = Array.isArray(result.data)
        ? result.data.map((item: any) => this.mapEntityToDTO(item))
        : [];
      
      return {
        data: mappedData,
        pagination: result.pagination
      };
    } catch (error) {
      this.handleError(error, 'Error finding entities', { filters, options });
    }
  }

  /**
   * Find a single entity by ID
   * @param id - Entity ID
   * @param options - Query options
   * @returns Entity or null if not found
   */
  async findById(
    id: number, 
    options: FindOneOptions = {}
  ): Promise<TResponseDTO | null> {
    try {
      // Extract repository method from the repository instance
      const repoMethod = (this.repository as any).findById.bind(this.repository);
      
      // Get data from repository
      const entity = await repoMethod(id, options);
      
      // Return null if entity not found and throwIfNotFound is false
      if (!entity && !options.throwIfNotFound) {
        return null;
      }
      
      // Throw error if entity not found and throwIfNotFound is true
      if (!entity && options.throwIfNotFound) {
        throw new NotFoundError(
          `Entity with ID ${id} not found`,
          { entityId: id, entityType: this.getEntityName() }
        );
      }
      
      // Map to response DTO
      return this.mapEntityToDTO(entity) as TResponseDTO;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error finding entity with ID ${id}`, { id, options });
    }
  }

  /**
   * Create a new entity
   * @param data - Create DTO
   * @param options - Creation options
   * @returns Created entity
   */
  async create(
    data: TCreateDTO, 
    options: CreateOptions = {}
  ): Promise<TResponseDTO> {
    try {
      // Validate input data
      await this.validateCreate(data);
      
      // Map DTO to entity
      const entityData = this.mapToEntity(data);
      
      // Extract repository method from the repository instance
      const repoMethod = (this.repository as any).create.bind(this.repository);
      
      // Create entity
      const created = await repoMethod(entityData, options);
      
      // Execute any post-creation hooks
      await this.afterCreate(created, data, options);
      
      // Map to response DTO
      return this.mapEntityToDTO(created);
    } catch (error) {
      this.handleError(error, 'Error creating entity', { data, options });
    }
  }

  /**
   * Update an existing entity
   * @param id - Entity ID
   * @param data - Update DTO
   * @param options - Update options
   * @returns Updated entity
   */
  async update(
    id: number, 
    data: TUpdateDTO, 
    options: UpdateOptions = {}
  ): Promise<TResponseDTO> {
    try {
      // Validate input data
      await this.validateUpdate(id, data);
      
      // Map DTO to entity
      const entityData = this.mapToEntity(data, true);
      
      // Extract repository method from the repository instance
      const repoMethod = (this.repository as any).update.bind(this.repository);
      
      // Update entity
      const updated = await repoMethod(id, entityData, options);
      
      // Execute any post-update hooks
      await this.afterUpdate(updated, data, options);
      
      // Map to response DTO
      return this.mapEntityToDTO(updated);
    } catch (error) {
      this.handleError(error, `Error updating entity with ID ${id}`, { id, data, options });
    }
  }

  /**
   * Delete an entity
   * @param id - Entity ID
   * @param options - Delete options
   * @returns Deleted entity
   */
  async delete(
    id: number, 
    options: DeleteOptions = {}
  ): Promise<TResponseDTO> {
    try {
      // Extract repository method from the repository instance
      const repoMethod = options.softDelete 
        ? (this.repository as any).softDelete.bind(this.repository)
        : (this.repository as any).delete.bind(this.repository);
      
      // Delete entity
      const deleted = await repoMethod(id, options);
      
      // Execute any post-deletion hooks
      await this.afterDelete(deleted, options);
      
      // Map to response DTO
      return this.mapEntityToDTO(deleted);
    } catch (error) {
      this.handleError(error, `Error deleting entity with ID ${id}`, { id, options });
    }
  }

  /**
   * Map entity/entities to response DTO(s)
   * @param entity - Entity or entities to map
   * @returns Mapped DTO(s)
   */
  protected mapToDTO(entity: T | T[]): TResponseDTO | TResponseDTO[] {
    if (Array.isArray(entity)) {
      return entity.map(item => this.mapEntityToDTO(item));
    }
    return this.mapEntityToDTO(entity);
  }

  /**
   * Map single entity to response DTO
   * Must be implemented by each service subclass
   * @param entity - Entity to map
   * @returns Mapped DTO
   */
  protected abstract mapEntityToDTO(entity: T): TResponseDTO;

  /**
   * Map DTO to entity
   * @param dto - DTO to map
   * @param isUpdate - Whether this is for an update operation
   * @returns Mapped entity
   */
  protected mapToEntity(dto: TCreateDTO | TUpdateDTO, isUpdate: boolean = false): Partial<T> {
    // Default implementation returns DTO as is
    // Subclasses should override this method to provide proper mapping
    return dto as unknown as Partial<T>;
  }

  /**
   * Validate create DTO
   * @param data - Create DTO to validate
   * @throws ValidationError if validation fails
   */
  protected async validateCreate(data: TCreateDTO): Promise<void> {
    // Default implementation does no validation
    // Subclasses should override this method to provide proper validation
  }

  /**
   * Validate update DTO
   * @param id - Entity ID
   * @param data - Update DTO to validate
   * @throws ValidationError if validation fails
   */
  protected async validateUpdate(id: number, data: TUpdateDTO): Promise<void> {
    // Default implementation does no validation
    // Subclasses should override this method to provide proper validation
  }

  /**
   * Execute logic after entity creation
   * @param created - Created entity
   * @param dto - Create DTO
   * @param options - Creation options
   */
  protected async afterCreate(created: T, dto: TCreateDTO, options: CreateOptions): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override this method to provide post-creation logic
  }

  /**
   * Execute logic after entity update
   * @param updated - Updated entity
   * @param dto - Update DTO
   * @param options - Update options
   */
  protected async afterUpdate(updated: T, dto: TUpdateDTO, options: UpdateOptions): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override this method to provide post-update logic
  }

  /**
   * Execute logic after entity deletion
   * @param deleted - Deleted entity
   * @param options - Delete options
   */
  protected async afterDelete(deleted: T, options: DeleteOptions): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override this method to provide post-deletion logic
  }

  /**
   * Get entity name for error messages
   * @returns Entity name
   */
  protected getEntityName(): string {
    // By default, try to extract entity name from repository constructor name
    const repoConstructor = (this.repository as any).constructor;
    const repoName = repoConstructor ? repoConstructor.name : 'Unknown';
    return repoName.replace('Repository', '');
  }

  /**
   * Handle and rethrow errors
   * @param error - Original error
   * @param message - Error message
   * @param context - Error context
   * @throws AppError
   */
  protected handleError(error: any, message: string, context: any = {}): never {
    // If it's already an AppError, rethrow it
    if (error instanceof AppError) {
      throw error;
    }

    // Log the error
    logger.error(message, { error, context });

    // Convert to AppError and throw
    throw new AppError(
      message,
      500,
      { originalError: error, ...context }
    );
  }
}