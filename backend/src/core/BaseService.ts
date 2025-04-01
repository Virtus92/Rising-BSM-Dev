import { IBaseService, ServiceOptions, PaginatedResult, FilterCriteria } from '../interfaces/IBaseService.js';
import { IBaseRepository } from '../interfaces/IBaseRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler, AppError } from '../interfaces/IErrorHandler.js';

/**
 * BaseService
 * 
 * Abstract base class implementing IBaseService.
 * Provides generic implementation of business operations that can be extended by specific services.
 * 
 * @template T - Entity type
 * @template C - Create DTO type
 * @template U - Update DTO type
 * @template R - Response DTO type
 * @template ID - Primary key type (default: number)
 */
export abstract class BaseService<T, C, U, R, ID = number> implements IBaseService<T, C, U, R, ID> {
  /**
   * Creates a new BaseService instance
   * 
   * @param repository - Repository for data access
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    protected readonly repository: IBaseRepository<T, ID>,
    protected readonly logger: ILoggingService,
    protected readonly validator: IValidationService,
    protected readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug(`Created ${this.constructor.name} instance`);
  }

  /**
   * Get all entities with pagination and filtering
   * 
   * @param options - Service options
   * @returns Promise with paginated results
   */
  async getAll(options?: ServiceOptions): Promise<PaginatedResult<R>> {
    try {
      // Map service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Get entities from repository
      const result = await this.repository.findAll(repoOptions);
      
      // Map entities to DTOs
      const data = result.data.map(entity => this.toDTO(entity));
      
      // Return paginated result
      return {
        data,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getAll`, error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get entity by ID
   * 
   * @param id - Entity ID
   * @param options - Service options
   * @returns Promise with entity DTO or null
   */
  async getById(id: ID, options?: ServiceOptions): Promise<R | null> {
    try {
      // Map service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Get entity from repository
      const entity = await this.repository.findById(id, repoOptions);
      
      // If entity not found, return null
      if (!entity) {
        return null;
      }
      
      // Map entity to DTO
      return this.toDTO(entity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.getById`, error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new entity
   * 
   * @param data - Create DTO
   * @param options - Service options
   * @returns Promise with created entity DTO
   */
  async create(data: C, options?: ServiceOptions): Promise<R> {
    try {
      // Validate input data
      await this.validate(data);
      
      // Add audit information if context is provided
      const auditedData = this.addAuditInfo(data, options?.context, 'create');
      
      // Perform business logic hooks
      await this.beforeCreate(auditedData, options);
      
      // Map DTO to entity
      const entityData = this.toEntity(auditedData);
      
      // Create entity in repository
      const entity = await this.repository.create(entityData);
      
      // Perform after-create hooks
      const processedEntity = await this.afterCreate(entity, auditedData, options);
      
      // Map entity to DTO
      return this.toDTO(processedEntity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.create`, error instanceof Error ? error : String(error), { data });
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing entity
   * 
   * @param id - Entity ID
   * @param data - Update DTO
   * @param options - Service options
   * @returns Promise with updated entity DTO
   */
  async update(id: ID, data: U, options?: ServiceOptions): Promise<R> {
    try {
      // Check if entity exists
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw this.errorHandler.createNotFoundError(
          `${this.getEntityName()} with ID ${String(id)} not found`
        );
      }
      
      // Validate input data with userId for email validation
      await this.validate(data, true, id as number);
      
      // Add audit information if context is provided
      const auditedData = this.addAuditInfo(data, options?.context, 'update');
      
      // Perform business logic hooks
      await this.beforeUpdate(id, auditedData, existing, options);
      
      // Map DTO to entity
      const entityData = this.toEntity(auditedData, existing);
      
      // Update entity in repository
      const entity = await this.repository.update(id, entityData);
      
      // Perform after-update hooks
      const processedEntity = await this.afterUpdate(entity, auditedData, existing, options);
      
      // Map entity to DTO
      return this.toDTO(processedEntity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.update`, error instanceof Error ? error : String(error), { id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Delete an entity
   * 
   * @param id - Entity ID
   * @param options - Service options
   * @returns Promise with success indicator
   */
  async delete(id: ID, options?: ServiceOptions): Promise<boolean> {
    try {
      // Check if entity exists
      const existing = await this.repository.findById(id);
      
      if (!existing) {
        throw this.errorHandler.createNotFoundError(
          `${this.getEntityName()} with ID ${String(id)} not found`
        );
      }
      
      // Perform business logic hooks
      await this.beforeDelete(id, existing, options);
      
      // Delete entity from repository
      const result = await this.repository.delete(id);
      
      // Perform after-delete hooks
      await this.afterDelete(id, existing, options);
      
      // Return success
      return result === true || !!result;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.delete`, error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Find entities by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Promise with entity DTOs
   */
  async findByCriteria(criteria: FilterCriteria, options?: ServiceOptions): Promise<R[]> {
    try {
      // Map service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Get entities from repository
      const entities = await this.repository.findByCriteria(criteria, repoOptions);
      
      // Map entities to DTOs
      return entities.map(entity => this.toDTO(entity));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByCriteria`, error instanceof Error ? error : String(error), { criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Validate entity data
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether validation is for update operation
   * @param userId - Optional user ID for update operations
   */
  async validate(data: C | U, isUpdate: boolean = false, userId?: number): Promise<void> {
    try {
      // Get validation schema based on operation
      const schema = isUpdate ? this.getUpdateValidationSchema() : this.getCreateValidationSchema();
      
      // Validate data against schema
      const { isValid, errors } = this.validator.validate(data, schema, { throwOnError: false });
      
      // If validation fails, throw validation error
      if (!isValid) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          errors
        );
      }
      
      // Perform additional validations if needed
      await this.validateBusinessRules(data, isUpdate, userId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.logger.error(`Error in ${this.constructor.name}.validate`, error instanceof Error ? error : String(error), { data, isUpdate });
      throw this.errorHandler.createValidationError(
        'Validation error',
        [error instanceof Error ? error.message : String(error)]
      );
    }
  }

  /**
   * Execute operations within a transaction
   * 
   * @param callback - Transaction callback
   * @returns Promise with result
   */
  async transaction<r>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<r>): Promise<r> {
    try {
      // Use repository to manage transaction
      return await this.repository.transaction(async () => {
        // Execute callback
        return await callback(this);
      });
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.transaction`, error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Map domain entity to response DTO
   * 
   * @param entity - Domain entity
   * @returns Response DTO
   */
  abstract toDTO(entity: T): R;

  /**
   * Map DTO to domain entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Domain entity
   */
  protected abstract toEntity(dto: C | U, existingEntity?: T): Partial<T>;

  /**
   * Get validation schema for create operation
   */
  protected abstract getCreateValidationSchema(): any;

  /**
   * Get validation schema for update operation
   */
  protected abstract getUpdateValidationSchema(): any;

  /**
   * Validate business rules
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether validation is for update operation
   * @param userId - Optional user ID for update operations
   */
  protected async validateBusinessRules(data: C | U, isUpdate: boolean, userId?: number): Promise<void> {
    // Default implementation does nothing
    // Override in subclasses for specific business rules
  }

  /**
   * Add audit information to data
   * 
   * @param data - Data to augment
   * @param context - Context information
   * @param operation - Operation type
   * @returns Augmented data
   */
  protected addAuditInfo(data: any, context?: any, operation?: string): any {
    // Clone data to avoid modifying original
    const result = { ...data };
    
    // Add audit fields if context contains user information
    // Always add audit information if userId is provided
    if (context?.userId) {
      if (operation === 'create') {
        result.createdBy = context.userId;
        result.updatedBy = context.userId; // Set both for creation
      }
      
      if (operation === 'update') {
        result.updatedBy = context.userId;
      }
      
      // Log the audit information being added
      this.logger.debug(`Adding audit info to ${operation} operation`, {
        entity: this.getEntityName(),
        userId: context.userId,
        operation
      });
    }
    
    return result;
  }

  /**
   * Pre-create hook
   * 
   * @param data - Create data
   * @param options - Service options
   */
  protected async beforeCreate(data: C, options?: ServiceOptions): Promise<void> {
    // Default implementation does nothing
    // Override in subclasses for specific logic
  }

  /**
   * Post-create hook
   * 
   * @param entity - Created entity
   * @param data - Create data
   * @param options - Service options
   * @returns Processed entity
   */
  protected async afterCreate(entity: T, data: C, options?: ServiceOptions): Promise<T> {
    // Default implementation returns entity as is
    // Override in subclasses for specific logic
    return entity;
  }

  /**
   * Pre-update hook
   * 
   * @param id - Entity ID
   * @param data - Update data
   * @param existingEntity - Existing entity
   * @param options - Service options
   */
  protected async beforeUpdate(
    id: ID,
    data: U,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<void> {
    // Default implementation does nothing
    // Override in subclasses for specific logic
  }

  /**
   * Post-update hook
   * 
   * @param entity - Updated entity
   * @param data - Update data
   * @param existingEntity - Previous entity state
   * @param options - Service options
   * @returns Processed entity
   */
  protected async afterUpdate(
    entity: T,
    data: U,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<T> {
    // Default implementation returns entity as is
    // Override in subclasses for specific logic
    return entity;
  }

  /**
   * Pre-delete hook
   * 
   * @param id - Entity ID
   * @param existingEntity - Entity to delete
   * @param options - Service options
   */
  protected async beforeDelete(
    id: ID,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<void> {
    // Default implementation does nothing
    // Override in subclasses for specific logic
  }

  /**
   * Post-delete hook
   * 
   * @param id - Entity ID
   * @param existingEntity - Deleted entity
   * @param options - Service options
   */
  protected async afterDelete(
    id: ID,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<void> {
    // Default implementation does nothing
    // Override in subclasses for specific logic
  }

  /**
   * Map service options to repository options
   * 
   * @param options - Service options
   * @returns Repository options
   */
  protected mapToRepositoryOptions(options?: ServiceOptions): any {
    if (!options) {
      return undefined;
    }
    
    // Extract common properties
    const { page, limit, select, relations, sort, withDeleted } = options;
    
    return {
      page,
      limit,
      select,
      relations,
      sort,
      withDeleted
    };
  }

  /**
   * Get entity name for error messages
   * 
   * @returns Entity name
   */
  protected getEntityName(): string {
    return this.constructor.name.replace('Service', '');
  }

  /**
   * Update multiple entities at once
   *
   * @param ids - Array of entity IDs to update
   * @param data - Update data to apply to all entities
   * @param options - Service options
   * @returns Promise with count of updated entities
   */
  async bulkUpdate(ids: ID[], data: U, options?: ServiceOptions): Promise<number> {
    try {
      // Validate input data
      await this.validate(data, true);
      
      // Add audit information if context is provided
      const auditedData = this.addAuditInfo(data, options?.context, 'update');
      
      // Prepare entity data
      const entityData = this.toEntity(auditedData);
      
      // Call repository to update entities
      const count = await this.repository.bulkUpdate(ids, entityData);
      
      return count;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.bulkUpdate`, error instanceof Error ? error : String(error), { ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Handle and transform errors
   * 
   * @param error - Original error
   * @returns Transformed error
   */
  protected handleError(error: unknown): Error {
    // If it's already an AppError, return it directly
    if (error instanceof AppError) {
      return error;
    }
    
    // For general errors, extract the message
    if (error instanceof Error) {
      return this.errorHandler.createError(
        error.message,
        500,
        'internal_error',
        { originalError: error }
      );
    }
    
    // For other types, convert to string
    return this.errorHandler.createError(
      String(error),
      500,
      'internal_error'
    );
  }
}