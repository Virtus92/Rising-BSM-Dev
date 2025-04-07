import { IRepository, QueryOptions, PageResult } from '@/types/interfaces/IRepository';
import { ILoggingService } from '@/types/interfaces/ILoggingService';
import { IErrorHandler } from '@/types/interfaces/IErrorHandler';

/**
 * Abstract BaseRepository Class
 * Provides a foundation for all repository implementations
 * 
 * @template T - Domain entity type
 * @template ID - Entity ID type
 */
export abstract class BaseRepository<T, ID> implements IRepository<T, ID> {
  /**
   * Creates a new BaseRepository instance
   * 
   * @param model - ORM model/entity
   * @param logger - Logging service
   * @param errorHandler - Error handler
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
   * @returns Promise with entities
   */
  async findAll(options?: QueryOptions): Promise<T[]> {
    try {
      const queryOptions = this.buildQueryOptions(options);
      const results = await this.executeQuery('findAll', queryOptions);
      return Array.isArray(results) ? results.map(entity => this.mapToDomainEntity(entity)) : [];
    } catch (error) {
      this.logger.error('Error in findAll', error instanceof Error ? error : String(error));
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
      const result = await this.executeQuery('findById', id, this.buildQueryOptions(options));
      return result ? this.mapToDomainEntity(result) : null;
    } catch (error) {
      this.logger.error('Error in findById', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Find entities by criteria
   * 
   * @param criteria - Filter criteria
   * @param options - Query options
   * @returns Promise with matching entities
   */
  async findByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T[]> {
    try {
      const processedCriteria = this.processCriteria(criteria);
      const queryOptions = this.buildQueryOptions(options);
      const results = await this.executeQuery('findByCriteria', processedCriteria, queryOptions);
      return Array.isArray(results) ? results.map(entity => this.mapToDomainEntity(entity)) : [];
    } catch (error) {
      this.logger.error('Error in findByCriteria', error instanceof Error ? error : String(error), { criteria });
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
      this.logger.error('Error in findOneByCriteria', error instanceof Error ? error : String(error), { criteria });
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
      this.logger.error('Error in create', error instanceof Error ? error : String(error), { data });
      
      // Handle unique constraint violation
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
   * @param data - Updated entity data
   * @returns Promise with updated entity
   */
  async update(id: ID, data: Partial<T>): Promise<T> {
    try {
      const entityData = this.mapToORMEntity(data);
      const result = await this.executeQuery('update', id, entityData);
      return this.mapToDomainEntity(result);
    } catch (error) {
      this.logger.error('Error in update', error instanceof Error ? error : String(error), { id, data });
      
      // Handle unique constraint violation
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
   * @returns Promise indicating success
   */
  async delete(id: ID): Promise<boolean> {
    try {
      await this.executeQuery('delete', id);
      return true;
    } catch (error) {
      this.logger.error('Error in delete', error instanceof Error ? error : String(error), { id });
      
      // Handle foreign key constraint violation
      if (this.isForeignKeyConstraintError(error)) {
        throw this.errorHandler.createConflictError('Cannot delete entity due to existing references');
      }
      
      // Handle other errors
      throw this.handleError(error);
    }
  }

  /**
   * Count entities matching criteria
   * 
   * @param criteria - Filter criteria
   * @returns Promise with count
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    try {
      const processedCriteria = criteria ? this.processCriteria(criteria) : {};
      return await this.executeQuery('count', processedCriteria);
    } catch (error) {
      this.logger.error('Error in count', error instanceof Error ? error : String(error), { criteria });
      throw this.handleError(error);
    }
  }

  /**
   * Get paginated results
   * 
   * @param criteria - Filter criteria
   * @param options - Query options
   * @returns Promise with paginated results
   */
  async paginate(criteria: Record<string, any>, options?: QueryOptions): Promise<PageResult<T>> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      
      // Get total count
      const total = await this.count(criteria);
      
      // Get paginated data
      const data = await this.findByCriteria(criteria, {
        ...options,
        page,
        limit
      });
      
      // Calculate total pages
      const totalPages = Math.ceil(total / limit) || 1;
      
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
      this.logger.error('Error in paginate', error instanceof Error ? error : String(error), { criteria, options });
      throw this.handleError(error);
    }
  }

  /**
   * Execute operations in a transaction
   * 
   * @param operation - Operation to execute
   * @returns Promise with operation result
   */
  async withTransaction<R>(operation: () => Promise<R>): Promise<R> {
    try {
      // Begin transaction
      await this.beginTransaction();
      
      // Execute operation
      const result = await operation();
      
      // Commit transaction
      await this.commitTransaction();
      
      return result;
    } catch (error) {
      // Rollback transaction
      await this.rollbackTransaction();
      
      this.logger.error('Transaction error', error instanceof Error ? error : String(error));
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
   * Process criteria for ORM
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
   * @returns Whether error is a database error
   */
  protected isDatabaseError(error: any): boolean {
    // Default implementation - override in subclasses
    return error && typeof error === 'object' && 'code' in error;
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
}
