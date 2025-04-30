import { 
  IBaseService, 
  ServiceOptions 
} from '@/domain/services/IBaseService';
import { IBaseRepository, PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IValidationService } from '@/core/validation/IValidationService';
import { IErrorHandler, AppError, ValidationError } from '@/core/errors/';
import { ValidationResult, ValidationErrorType } from '@/domain/enums/ValidationResults';
import { ValidationResultDto } from '@/domain/dtos/ValidationDto';

/**
 * Base Service Class
 * 
 * Implements the IBaseService interface and provides common functionality
 * for all service classes.
 * 
 * @template T - Entity type
 * @template C - Create DTO type
 * @template U - Update DTO type
 * @template R - Response DTO type
 * @template ID - Primary key type
 */
export abstract class BaseService<T, C extends Record<string, any>, U extends Record<string, any>, R, ID = number> implements IBaseService<T, C, U, R, ID> {
  /**
   * Constructor
   * 
   * @param repository - Repository for data access
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handling service
   */
  constructor(
    protected readonly repository: IBaseRepository<T, ID>,
    protected readonly logger: ILoggingService,
    protected readonly validator: IValidationService,
    protected readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug(`Created ${this.constructor.name}`);
  }
  
  /**
   * Gets the repository instance
   * This allows direct repository access when needed for specific operations
   * 
   * @returns The repository instance
   */
  public getRepository(): IBaseRepository<T, ID> {
    return this.repository;
  }

  /**
   * Get all entities
   * 
   * @param options - Service options
   * @returns Paginated list of entities
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<R>> {
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
      this.logger.error(`Error in ${this.constructor.name}.getAll`, { error, options });
      throw this.handleError(error);
    }
  }

  /**
   * Get an entity by its ID
   * 
   * @param id - Entity ID
   * @param options - Service options
   * @returns Entity or null if not found
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
      this.logger.error(`Error in ${this.constructor.name}.getById`, { error, id, options });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new entity
   * 
   * @param data - Creation data
   * @param options - Service options
   * @returns Created entity
   */
  async create(data: C, options?: ServiceOptions): Promise<R> {
    try {
      // Validate input data
      const validationResult = await this.validate(data);
      
      // Check for validation errors
      if (validationResult.result === ValidationResult.ERROR) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          validationResult.errors?.map(e => e.message) || []
        );
      }
      
      // Add audit information if context is available
      const auditedData = this.addAuditInfo(data, options?.context, 'create');
      
      // Execute business logic hooks
      await this.beforeCreate(auditedData, options);
      
      // Map DTO to entity
      const entityData = this.toEntity(auditedData);
      
      // Create entity in repository
      const entity = await this.repository.create(entityData);
      
      // Execute after-create hooks
      const processedEntity = await this.afterCreate(entity, auditedData, options);
      
      // Map entity to DTO
      return this.toDTO(processedEntity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.create`, { error, data });
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing entity
   * 
   * @param id - Entity ID
   * @param data - Update data
   * @param options - Service options
   * @returns Updated entity
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
      
      // Validate input data
      const validationResult = await this.validate(data, true, id as any);
      
      // Check for validation errors
      if (validationResult.result === ValidationResult.ERROR) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          validationResult.errors?.map(e => e.message) || []
        );
      }
      
      // Add audit information if context is available
      const auditedData = this.addAuditInfo(data, options?.context, 'update');
      
      // Execute business logic hooks
      await this.beforeUpdate(id, auditedData, existing, options);
      
      // Map DTO to entity
      const entityData = this.toEntity(auditedData, existing);
      
      // Update entity in repository
      const entity = await this.repository.update(id, entityData);
      
      // Execute after-update hooks
      const processedEntity = await this.afterUpdate(entity, auditedData, existing, options);
      
      // Map entity to DTO
      return this.toDTO(processedEntity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.update`, { error, id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Delete an entity
   * 
   * @param id - Entity ID
   * @param options - Service options
   * @returns Whether the deletion was successful
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
      
      // Execute business logic hooks
      await this.beforeDelete(id, existing, options);
      
      // Delete entity in repository
      const result = await this.repository.delete(id);
      
      // Execute after-delete hooks
      await this.afterDelete(id, existing, options);
      
      // Return success
      return result === true || !!result;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.delete`, { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Find entities by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Found entities
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<R[]> {
    try {
      // Map service options to repository options
      const repoOptions = this.mapToRepositoryOptions(options);
      
      // Get entities from repository
      const entities = await this.repository.findByCriteria(criteria, repoOptions);
      
      // Map entities to DTOs
      return entities.map(entity => this.toDTO(entity));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByCriteria`, { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Validate data
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether this is an update operation
   * @param entityId - Entity ID (for updates)
   * @returns Validation result
   */
  async validate(data: C | U, isUpdate: boolean = false, entityId?: number): Promise<ValidationResultDto> {
    try {
      // Get validation schema based on operation
      const schema = isUpdate ? this.getUpdateValidationSchema() : this.getCreateValidationSchema();
      
      // Validate data against schema - fixed to use 2 parameters instead of 3
      const { isValid, errors } = this.validator.validate(data, schema);
      
      // If validation fails, throw validation error
      if (!isValid) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          errors
        );
      }
      
      // Execute additional validations if required
      await this.validateBusinessRules(data, isUpdate, entityId);
      
      // Return successful validation result
      return {
        result: ValidationResult.SUCCESS,
        data: data
      };
    } catch (error) {
      if (error instanceof AppError) {
        // Create validation errors in domain format
        const errorDtos = error instanceof ValidationError ? 
          // Handle different formats of validation errors
          (error.details?.errors ? 
            // If errors are in details.errors
            (Array.isArray(error.details.errors) ? 
              error.details.errors.map((e: string | any) => ({
                type: ValidationErrorType.FORMAT,
                field: typeof e === 'string' ? e.split(':')[0]?.trim() || 'unknown' : 'unknown',
                message: typeof e === 'string' ? e : String(e)
              })) :
              // Handle object with field keys
              Object.entries(error.details.errors).flatMap(([field, msgs]) => 
                (Array.isArray(msgs) ? msgs : [String(msgs)]).map(msg => ({
                  type: ValidationErrorType.FORMAT,
                  field,
                  message: msg
                }))
              )
            ) :
            // Fallback to single error message
            [{
              type: ValidationErrorType.FORMAT,
              field: 'general',
              message: error.message
            }]
          ) : 
          // Non-validation AppError
          [{
            type: ValidationErrorType.OTHER,
            field: 'general',
            message: error.message
          }];

        return {
          result: ValidationResult.ERROR,
          errors: errorDtos
        };
      }
      
      this.logger.error(`Error in ${this.constructor.name}.validate`, { error, data, isUpdate });
      
      // Create general validation error
      return {
        result: ValidationResult.ERROR,
        errors: [{
          type: ValidationErrorType.OTHER,
          field: 'general',
          message: error instanceof Error ? error.message : String(error)
        }]
      };
    }
  }

  /**
   * Counts entities based on criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Service options
   * @returns Number of entities
   */
  async count(criteria?: Record<string, any>, options?: ServiceOptions): Promise<number> {
    try {
      // Repository count method only accepts criteria parameter
      return await this.repository.count(criteria);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.count`, { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Finds all entities (alias for getAll)
   * 
   * @param options - Service options
   * @returns Paginated result of entities
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<R>> {
    return this.getAll(options);
  }

  async transaction<r>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<r>, context?: any): Promise<r> {
    try {
      // Use repository to manage transaction
      return await this.repository.transaction(async () => {
        // Execute callback
        return await callback(this);
      });
    } catch (error: any) {
      this.logger.error(`Error in ${this.constructor.name}.transaction`, { error });
      throw this.handleError(error);
    }
  }

  /**
   * Perform a bulk update
   * 
   * @param ids - Entity IDs
   * @param data - Update data
   * @param options - Service options
   * @returns Number of updated entities
   */
  async bulkUpdate(ids: ID[], data: U, options?: ServiceOptions): Promise<number> {
    try {
      // Validate data
      const validationResult = await this.validate(data, true);
      
      // Check for validation errors
      if (validationResult.result === ValidationResult.ERROR) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          validationResult.errors?.map(e => e.message) || []
        );
      }
      
      // Add audit information if context is available
      const auditedData = this.addAuditInfo(data, options?.context, 'update');
      
      // Prepare entity data
      const entityData = this.toEntity(auditedData);
      
      // Call repository to update entities
      const count = await this.repository.bulkUpdate(ids, entityData);
      
      return count;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.bulkUpdate`, { error, ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Perform an advanced search
   * 
   * @param searchText - Search text
   * @param options - Service options
   * @returns Found entities
   */
  async search(searchText: string, options?: ServiceOptions): Promise<R[]> {
    // Default implementation uses findByCriteria with name and other commonly searched fields
    // Should be overridden in subclasses for specific search logic
    try {
      const criteria: Record<string, any> = {};
      
      if (searchText && searchText.trim() !== '') {
        // Add basic search criteria (should be adapted in subclasses)
        criteria.name = searchText; // Assumption: Most entities have a "name" field
      }
      
      return await this.findByCriteria(criteria, options);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.search`, { error, searchText });
      throw this.handleError(error);
    }
  }

  /**
   * Check if an entity exists
   * 
   * @param id - Entity ID
   * @param options - Service options
   * @returns Whether the entity exists
   */
  async exists(id: ID, options?: ServiceOptions): Promise<boolean> {
    try {
      // Check via repository if entity exists
      const entity = await this.repository.findById(id, this.mapToRepositoryOptions(options));
      return !!entity;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.exists`, { error, id });
      throw this.handleError(error);
    }
  }

  /**
   * Check if entities matching criteria exist
   * 
   * @param criteria - Search criteria
   * @param options - Service options
   * @returns Whether matching entities exist
   */
  async existsByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<boolean> {
    try {
      // Check if at least one entity matching the criteria exists
      const entities = await this.repository.findByCriteria(criteria, { limit: 1 });
      return entities.length > 0;
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.existsByCriteria`, { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Map an entity to a response DTO
   * 
   * @param entity - Entity to map
   * @returns Response DTO
   */
  abstract toDTO(entity: T): R;

  /**
   * Convert a DTO to an entity
   * 
   * @param dto - DTO
   * @returns Entity
   */
  fromDTO(dto: C | U): Partial<T> {
    return this.toEntity(dto);
  }

  /**
   * Map a DTO to an entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected abstract toEntity(dto: C | U, existingEntity?: T): Partial<T>;

  /**
   * Get validation schema for creation
   */
  protected abstract getCreateValidationSchema(): any;

  /**
   * Get validation schema for updates
   */
  protected abstract getUpdateValidationSchema(): any;

  /**
   * Validate business rules
   * 
   * @param data - Data to validate
   * @param isUpdate - Whether this is an update operation
   * @param entityId - Entity ID (for updates)
   */
  protected async validateBusinessRules(data: C | U, isUpdate: boolean, entityId?: number): Promise<void> {
    // Default implementation does nothing
    // Override in subclasses for specific business rules
  }

  /**
   * Add audit information to data
   * 
   * @param data - Data to extend
   * @param context - Context information
   * @param operation - Operation type
   * @returns Extended data
   */
  protected addAuditInfo(data: any, context?: any, operation?: string): any {
    // Clone data to avoid modifying the original
    const result = { ...data };
    
    // Add audit fields if context contains user information
    if (context?.userId) {
      if (operation === 'create') {
        result.createdBy = context.userId;
        result.updatedBy = context.userId; // Set both for creations
      }
      
      if (operation === 'update') {
        result.updatedBy = context.userId;
      }
      
      // Log the added audit information
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
   * @param data - Creation data
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
   * @param data - Creation data
   * @param options - Service options
   * @returns Processed entity
   */
  protected async afterCreate(entity: T, data: C, options?: ServiceOptions): Promise<T> {
    // Default implementation returns entity unchanged
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
   * @param existingEntity - Previous entity
   * @param options - Service options
   * @returns Processed entity
   */
  protected async afterUpdate(
    entity: T,
    data: U,
    existingEntity: T,
    options?: ServiceOptions
  ): Promise<T> {
    // Default implementation returns entity unchanged
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
    const { relations, withDeleted } = options;
    
    // Type assertion for pagination options that might be passed from older code
    const serviceOptions = options as any;
    
    // Add sort options if they exist
    const sortOptions = options.sort ? {
      sort: {
        field: options.sort.field,
        direction: options.sort.direction || 'asc'
      }
    } : {};
    
    this.logger.debug(`Mapping service options to repository options with sort:`, sortOptions);
    
    return {
      page: serviceOptions.page,
      limit: serviceOptions.limit,
      relations,
      withDeleted,
      ...sortOptions
    };
  }

  /**
   * Get the entity name for error messages
   * 
   * @returns Entity name
   */
  protected getEntityName(): string {
    return this.constructor.name.replace('Service', '');
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