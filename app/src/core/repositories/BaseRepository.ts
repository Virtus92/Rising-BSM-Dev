import { 
  IBaseRepository, 
  PaginationResult, 
  QueryOptions, 
  SortOptions
} from '@/domain/repositories/IBaseRepository';
import { ILoggingService } from '@/core/logging/ILoggingService';
import { IErrorHandler } from '@/core/errors/';

/**
 * Abstract base repository class
 * 
 * Provides a foundation for all repository implementations.
 * 
 * @template T - Entity type
 * @template ID - Primary key type
 */
export abstract class BaseRepository<T, ID = number> implements IBaseRepository<T, ID> {
  /**
   * Constructor
   * 
   * @param model - ORM model/entity
   * @param logger - Logging service
   * @param errorHandler - Error handling service
   */
  constructor(
    protected readonly model: any,
    protected readonly logger: ILoggingService,
    protected readonly errorHandler: IErrorHandler
  ) {}

  /**
   * Find all entities
   * 
   * @param options - Query options
   * @returns Promise with entities and pagination
   */
  async findAll(options?: QueryOptions): Promise<PaginationResult<T>> {
    try {
      const queryOptions = this.buildQueryOptions(options);
      
      // Make sure we have proper sorting for appointments
      if (this.getDisplayName()?.toLowerCase().includes('appointment')) {
        if (!queryOptions.orderBy) {
          queryOptions.orderBy = { appointmentDate: 'asc' };
          this.logger.debug('Adding default appointment date sorting for appointments');
        }
      }
      
      // Count the total
      const total = await this.count();
      
      // Get the data
      const results = await this.executeQuery('findAll', queryOptions);
      
      // Calculate pagination
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const totalPages = Math.ceil(total / limit) || 1;
      
      // Convert to domain entities
      const data = Array.isArray(results) ? results.map(entity => this.mapToDomainEntity(entity)) : [];
      
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
      this.logger.error('Error in findAll', { error, options });
      throw this.handleError(error);
    }
  }

  /**
   * Find an entity by its ID
   * 
   * @param id - Entity ID
   * @param options - Query options
   * @returns Promise with entity or null
   */
  async findById(id: ID, options?: QueryOptions): Promise<T | null> {
    try {
      const result = await this.executeQuery('findById', id, this.buildQueryOptions(options));
      return result ? this.mapToDomainEntity(result) : null;
    } catch (error) {
      this.logger.error('Error in findById', { error, id, options });
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
  async findByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T[]> {
    try {
      const processedCriteria = this.processCriteria(criteria);
      const queryOptions = this.buildQueryOptions(options);
      const results = await this.executeQuery('findByCriteria', processedCriteria, queryOptions);
      return Array.isArray(results) ? results.map(entity => this.mapToDomainEntity(entity)) : [];
    } catch (error) {
      this.logger.error('Error in findByCriteria', { error, criteria, options });
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
  async findOneByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T | null> {
    try {
      const processedCriteria = this.processCriteria(criteria);
      const queryOptions = this.buildQueryOptions(options);
      const result = await this.executeQuery('findOneByCriteria', processedCriteria, queryOptions);
      return result ? this.mapToDomainEntity(result) : null;
    } catch (error) {
      this.logger.error('Error in findOneByCriteria', { error, criteria, options });
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
      const entityData = this.mapToORMEntity(data);
      const result = await this.executeQuery('create', entityData);
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error('Error in create', { error, data });
      
      // Handle uniqueness violation
      if (this.isUniqueConstraintError(error)) {
        throw this.errorHandler.createConflictError('Entity with this identifier already exists');
      }
      
      // Handle other errors
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing entity
   * 
   * @param id - Entity ID
   * @param data - Updated data
   * @returns Promise with updated entity
   */
  async update(id: ID, data: Partial<T>): Promise<T> {
    try {
      const entityData = this.mapToORMEntity(data);
      const result = await this.executeQuery('update', id, entityData);
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error('Error in update', { error, id, data });
      
      // Handle uniqueness violation
      if (this.isUniqueConstraintError(error)) {
        throw this.errorHandler.createConflictError('Entity with this identifier already exists');
      }
      
      // Handle other errors
      throw this.handleError(error);
    }
  }

  /**
   * Delete an entity
   * 
   * @param id - Entity ID
   * @returns Promise with operation success
   */
  async delete(id: ID): Promise<boolean> {
    try {
      await this.executeQuery('delete', id);
      return true;
    } catch (error) {
      this.logger.error('Error in delete', { error, id });
      
      // Handle foreign key constraint violation
      if (this.isForeignKeyConstraintError(error)) {
        throw this.errorHandler.createConflictError('Cannot delete entity due to existing references');
      }
      
      // Handle other errors
      throw this.handleError(error);
    }
  }

  /**
   * Count entities by criteria
   * 
   * @param criteria - Filter criteria
   * @returns Promise with count
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    try {
      const processedCriteria = criteria ? this.processCriteria(criteria) : {};
      return await this.executeQuery('count', processedCriteria);
    } catch (error) {
      this.logger.error('Error in count', { error, criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Perform a bulk update
   * 
   * @param ids - Entity IDs
   * @param data - Updated data
   * @returns Promise with count of updated entities
   */
  async bulkUpdate(ids: ID[], data: Partial<T>): Promise<number> {
    try {
      if (!ids.length) {
        return 0;
      }
      
      const entityData = this.mapToORMEntity(data);
      const result = await this.executeQuery('bulkUpdate', ids, entityData);
      return typeof result === 'number' ? result : (result as any).count || 0;
    } catch (error) {
      this.logger.error('Error in bulkUpdate', { error, ids, data });
      throw this.handleError(error);
    }
  }

  /**
   * Log an activity
   * 
   * @param userId - User ID
   * @param actionType - Action type
   * @param details - Details
   * @param ipAddress - IP address
   * @returns Promise with log result
   */
  async logActivity(userId: number, actionType: string, details?: string, ipAddress?: string): Promise<any> {
    try {
      return await this.executeQuery('logActivity', userId, actionType, details, ipAddress);
    } catch (error) {
      this.logger.error('Error in logActivity', { error, userId, actionType, details });
      return null; // Activity logging should not cause abort
    }
  }

  /**
   * Execute a transaction
   * 
   * @param callback - Callback function that accepts a repository instance
   * @returns Promise with transaction result
   */
  async transaction<R>(callback: (repo: any) => Promise<R>): Promise<R> {
    try {
      // Begin transaction
      await this.beginTransaction();
      
      // Execute operation - pass this repository instance to the callback
      const result = await callback(this);
      
      // Commit transaction
      await this.commitTransaction();
      
      return result;
    } catch (error) {
      // Rollback transaction
      await this.rollbackTransaction();
      
      this.logger.error('Transaction error', { error });
      throw this.handleError(error);
    }
  }

  /**
   * Handle repository errors
   * 
   * @param error - Error to handle
   * @returns Mapped error
   */
  protected handleError(error: any): Error {
    // Return error if already handled
    if (error instanceof Error && 'statusCode' in error) {
      return error;
    }
    
    // Handle database-specific errors
    if (this.isDatabaseError(error)) {
      return this.errorHandler.handleDatabaseError(error);
    }
    
    // Handle other errors
    return this.errorHandler.mapError(error);
  }

  /**
   * Begin a database transaction
   */
  protected abstract beginTransaction(): Promise<void>;

  /**
   * Commit a database transaction
   */
  protected abstract commitTransaction(): Promise<void>;

  /**
   * Rollback a database transaction
   */
  protected abstract rollbackTransaction(): Promise<void>;

  /**
   * Execute a database query
   * 
   * @param operation - Operation name
   * @param args - Query arguments
   * @returns Promise with query result
   */
  protected abstract executeQuery(operation: string, ...args: any[]): Promise<any>;

  /**
   * Build ORM-specific query options
   * 
   * @param options - Query options
   * @returns ORM-specific options
   */
  protected abstract buildQueryOptions(options?: QueryOptions): any;

  /**
   * Process criteria for the ORM
   * 
   * @param criteria - Filter criteria
   * @returns ORM-specific criteria
   */
  protected abstract processCriteria(criteria: Record<string, any>): any;

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
   * Check if an error is a database error
   * 
   * @param error - Error to check
   * @returns Whether the error is a database error
   */
  protected isDatabaseError(error: any): boolean {
    // Standard implementation - override in subclasses
    return error && typeof error === 'object' && 'code' in error;
  }

  /**
   * Check if an error violates a uniqueness constraint
   * 
   * @param error - Error to check
   * @returns Whether the error violates a uniqueness constraint
   */
  protected abstract isUniqueConstraintError(error: any): boolean;

  /**
   * Check if an error violates a foreign key constraint
   * 
   * @param error - Error to check
   * @returns Whether the error violates a foreign key constraint
   */
  protected abstract isForeignKeyConstraintError(error: any): boolean;
  
  /**
   * Get the display name of the repository
   * 
   * @returns Display name for logging
   */
  protected getDisplayName(): string {
    return this.constructor.name;
  }
}