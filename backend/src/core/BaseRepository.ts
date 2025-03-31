import { IBaseRepository, QueryOptions, PaginatedResult, FilterCriteria } from '../interfaces/IBaseRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler, AppError } from '../interfaces/IErrorHandler.js';

/**
 * BaseRepository
 * 
 * Abstract base class implementing IBaseRepository.
 * Provides generic implementation of CRUD operations that can be extended by specific repositories.
 * 
 * @template T - Entity type
 * @template ID - Primary key type (default: number)
 * @template M - ORM model type
 */
export abstract class BaseRepository<T, ID = number, M = any> implements IBaseRepository<T, ID> {
  /**
   * Creates a new BaseRepository instance
   * 
   * @param model - ORM model or data source
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    protected readonly model: M,
    protected readonly logger: ILoggingService,
    protected readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug(`Created ${this.constructor.name} instance`);
  }

  /**
   * Find all entities with pagination
   * 
   * @param options - Query options
   * @returns Promise with paginated result
   */
  async findAll(options?: QueryOptions): Promise<PaginatedResult<T>> {
    try {
      // Extract pagination parameters
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;
      
      // Build query options - include skip in options
      const queryOptions = this.buildQueryOptions({...options, skip});
      
      // Execute count query
      const total = await this.count();
      
      // Execute main query
      const entities = await this.executeQuery('findAll', queryOptions);
      
      // Map to domain entities if necessary
      const data = entities.map((entity: any) => this.mapToDomainEntity(entity));
      
      // Calculate total pages
      const totalPages = Math.ceil(total / limit);
      
      // Return paginated result
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findAll`, error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Find entity by ID
   * 
   * @param id - Entity ID
   * @param options - Query options
   * @returns Promise with entity or null
   */
  async findById(id: ID, options?: QueryOptions): Promise<T | null> {
    try {
      // Build query options
      const queryOptions = this.buildQueryOptions(options);
      
      // Execute query
      const entity = await this.executeQuery('findById', id, queryOptions);
      
      // If entity not found, return null
      if (!entity) {
        return null;
      }
      
      // Map to domain entity if necessary
      return this.mapToDomainEntity(entity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findById`, error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Find entities by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Query options
   * @returns Promise with entities
   */
  async findByCriteria(criteria: FilterCriteria, options?: QueryOptions): Promise<T[]> {
    try {
      // Build query options
      const queryOptions = this.buildQueryOptions(options);
      
      // Process criteria for ORM
      const processedCriteria = this.processCriteria(criteria);
      
      // Execute query
      const entities = await this.executeQuery('findByCriteria', processedCriteria, queryOptions);
      
      // Map to domain entities if necessary
      return entities.map((entity: any) => this.mapToDomainEntity(entity));
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findByCriteria`, error instanceof Error ? error : String(error), { criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Find one entity by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Query options
   * @returns Promise with entity or null
   */
  async findOneByCriteria(criteria: FilterCriteria, options?: QueryOptions): Promise<T | null> {
    try {
      // Build query options
      const queryOptions = this.buildQueryOptions(options);
      
      // Process criteria for ORM
      const processedCriteria = this.processCriteria(criteria);
      
      // Execute query
      const entity = await this.executeQuery('findOneByCriteria', processedCriteria, queryOptions);
      
      // If entity not found, return null
      if (!entity) {
        return null;
      }
      
      // Map to domain entity if necessary
      return this.mapToDomainEntity(entity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.findOneByCriteria`, error instanceof Error ? error : String(error), { criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new entity
   * 
   * @param data - Entity data
   * @returns Promise with created entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      // Map to ORM entity if necessary
      const ormData = this.mapToORMEntity(data);
      
      // Execute query
      const entity = await this.executeQuery('create', ormData);
      
      // Map to domain entity if necessary
      return this.mapToDomainEntity(entity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.create`, error instanceof Error ? error : String(error), { data });
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing entity
   * 
   * @param id - Entity ID
   * @param data - Updated entity data
   * @returns Promise with updated entity
   */
  async update(id: ID, data: Partial<T>): Promise<T> {
    try {
      // Check if entity exists
      const exists = await this.findById(id);
      
      if (!exists) {
        throw this.errorHandler.createNotFoundError(
          `Entity with ID ${String(id)} not found`, 
          this.getEntityName()
        );
      }
      
      // Map to ORM entity if necessary
      const ormData = this.mapToORMEntity(data);
      
      // Execute query
      const entity = await this.executeQuery('update', id, ormData);
      
      // Map to domain entity if necessary
      return this.mapToDomainEntity(entity);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.update`, error instanceof Error ? error : String(error), { id, data });
      throw this.handleError(error);
    }
  }

  /**
   * Delete an entity
   * 
   * @param id - Entity ID
   * @returns Promise with deleted entity or success indicator
   */
  async delete(id: ID): Promise<T | boolean> {
    try {
      // Check if entity exists
      const exists = await this.findById(id);
      
      if (!exists) {
        throw this.errorHandler.createNotFoundError(
          `Entity with ID ${String(id)} not found`, 
          this.getEntityName()
        );
      }
      
      // Execute query
      const result = await this.executeQuery('delete', id);
      
      // If result is a boolean, return it
      if (typeof result === 'boolean') {
        return result;
      }
      
      // Map to domain entity if necessary
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.delete`, error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Log activity for auditing purposes
   * 
   * @param userId - User ID performing the action
   * @param actionType - Type of action performed
   * @param details - Additional details about the action
   * @param ipAddress - IP address of the client
   * @returns Promise with created activity record
   */
  async logActivity(
    userId: number, 
    actionType: string, 
    details?: string,
    ipAddress?: string
  ): Promise<any> {
    try {
      // Always log to application logs
      this.logger.info(`User activity: ${actionType}`, {
        userId,
        actionType,
        details,
        ipAddress,
        entity: this.getEntityName()
      });
      
      // Safe access to prisma client
      let prisma = null;
      
      // Try to detect prisma client from the model
      if (this.model && typeof this.model === 'object') {
        // Check for a common prisma function
        if ('$connect' in this.model || '$transaction' in this.model) {
          prisma = this.model;
        } else if ('$queryRaw' in this.model) {
          // The model itself is a table model, try to access the client
          prisma = (this.model as any).$queryRaw?.['_client'] || null;
        }
      }
      
      // Create activity log if prisma client is available and has the userActivity model
      if (prisma && 'userActivity' in prisma) {
        return await prisma.userActivity.create({
          data: {
            userId,
            activity: actionType, // Field name in schema is 'activity' not 'type'
            details: details || '',
            timestamp: new Date(),
            ipAddress: ipAddress || null
          }
        });
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error logging activity', error instanceof Error ? error : String(error), { 
        userId, 
        actionType 
      });
      return null; // Don't throw on logging errors
    }
  }

  /**
   * Count entities
   * 
   * @param criteria - Filter criteria
   * @returns Promise with count
   */
  async count(criteria?: FilterCriteria): Promise<number> {
    try {
      // Process criteria for ORM
      const processedCriteria = criteria ? this.processCriteria(criteria) : undefined;
      
      // Execute query
      return await this.executeQuery('count', processedCriteria);
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.count`, error instanceof Error ? error : String(error), { criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Execute operations within a transaction
   * 
   * @param callback - Transaction callback
   * @returns Promise with result
   */
  async transaction<R>(callback: (repository: IBaseRepository<T, ID>) => Promise<R>): Promise<R> {
    try {
      // Begin transaction
      await this.beginTransaction();
      
      try {
        // Execute callback
        const result = await callback(this);
        
        // Commit transaction
        await this.commitTransaction();
        
        return result;
      } catch (error) {
        // Rollback transaction
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error in ${this.constructor.name}.transaction`, error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Bulk update multiple entities
   * 
   * @param ids - Array of entity IDs
   * @param data - Update data
   * @returns Promise with count of updated entities
   */
  async bulkUpdate(ids: ID[], data: Partial<T>): Promise<number> {
    try {
      // Use executeQuery to perform the bulk update operation
      const ormData = this.mapToORMEntity(data);
      const result = await this.executeQuery('bulkUpdate', ids, ormData);
      
      // Handle different result types that might be returned
      return typeof result === 'number' ? result : (result?.count || 0);
    } catch (error) {
      this.logger.error('Error in bulkUpdate', error instanceof Error ? error : String(error), { ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Begin a transaction
   */
  protected abstract beginTransaction(): Promise<void>;

  /**
   * Commit a transaction
   */
  protected abstract commitTransaction(): Promise<void>;

  /**
   * Rollback a transaction
   */
  protected abstract rollbackTransaction(): Promise<void>;

  /**
   * Execute a query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Promise with query result
   */
  protected abstract executeQuery(operation: string, ...args: any[]): Promise<any>;

  /**
   * Build query options for ORM
   * 
   * @param options - Query options
   * @returns ORM-specific query options
   */
  protected abstract buildQueryOptions(options?: QueryOptions): any;

  /**
   * Process criteria for ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected abstract processCriteria(criteria: FilterCriteria): any;

  /**
   * Map ORM entity to domain entity
   * 
   * @param ormEntity - ORM entity
   * @returns Domain entity
   */
  protected abstract mapToDomainEntity(ormEntity: any): T;

  /**
   * Map domain entity to ORM entity
   * 
   * @param domainEntity - Domain entity
   * @returns ORM entity
   */
  protected abstract mapToORMEntity(domainEntity: Partial<T>): any;

  /**
   * Get entity name for error messages
   * 
   * @returns Entity name
   */
  protected getEntityName(): string {
    return this.constructor.name.replace('Repository', '');
  }

  /**
   * Handle and transform errors
   * 
   * @param error - Original error
   * @returns Transformed error
   */
  protected handleError(error: any): Error {
    // If error is already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }
    
    // Check for common ORM errors and transform them
    if (this.isUniqueConstraintError(error)) {
      return this.errorHandler.createError(
        'A record with these details already exists', 
        409, 
        'unique_constraint_violation'
      );
    }
    
    if (this.isForeignKeyConstraintError(error)) {
      return this.errorHandler.createError(
        'Referenced record does not exist',
        400,
        'foreign_key_constraint_violation'
      );
    }
    
    // Default to internal server error
    return this.errorHandler.createError(
      'Database operation failed',
      500,
      'database_error',
      { originalError: error.message }
    );
  }

  /**
   * Check if error is a unique constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a unique constraint violation
   */
  protected abstract isUniqueConstraintError(error: any): boolean;

  /**
   * Check if error is a foreign key constraint violation
   * 
   * @param error - Error to check
   * @returns Whether error is a foreign key constraint violation
   */
  protected abstract isForeignKeyConstraintError(error: any): boolean;
  
  /**
   * Helper method to convert snake_case to camelCase for database field names
   * 
   * @param field - Field name possibly in snake_case
   * @returns Field name in camelCase
   */
  protected convertToCamelCase(field: string): string {
    // Common field mappings
    const fieldMap: Record<string, string> = {
      'created_at': 'createdAt',
      'updated_at': 'updatedAt',
      'processor_id': 'processorId',
      'ip_address': 'ipAddress',
      'customer_id': 'customerId',
      'service_id': 'serviceId',
      'user_id': 'userId',
      'user_name': 'userName',
      'postal_code': 'postalCode',
      'appointment_date': 'appointmentDate'
    };
    
    // Return from map if exists
    if (fieldMap[field]) {
      return fieldMap[field];
    }
    
    // Otherwise convert dynamically
    if (field.includes('_')) {
      return field.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }
    
    return field;
  }
}