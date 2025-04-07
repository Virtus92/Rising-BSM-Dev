import { PaginatedResult, FilterCriteria, OperationOptions, SortOptions } from '@/types/core/shared';

/**
 * IBaseRepository
 * 
 * Generic repository interface that provides a contract for basic CRUD operations.
 * Designed to work with any entity type and primary key type.
 * 
 * @template T - Entity type
 * @template ID - Primary key type (default: number)
 * @template FilterType - Type for filter criteria
 */
export interface IBaseRepository<T, ID = number, FilterType = Record<string, any>> {
    /**
     * Bulk update multiple entities
     * 
     * @param ids - Array of entity IDs
     * @param data - Update data
     * @returns Promise with count of updated entities
     */
    bulkUpdate(ids: ID[], data: Partial<T>): Promise<number>;

    /**
     * Log activity for auditing purposes
     * 
     * @param userId - User ID performing the action
     * @param actionType - Type of action performed
     * @param details - Additional details about the action
     * @param ipAddress - IP address of the client
     * @returns Promise with created activity record
     */
    logActivity(
      userId: number, 
      actionType: string, 
      details?: string,
      ipAddress?: string
    ): Promise<any>;
  
    /**
     * Find all entities, optionally with pagination
     * 
     * @param options - Query options like pagination, sorting, etc.
     * @returns Promise containing array of entities and pagination metadata
     */
    findAll(options?: OperationOptions): Promise<PaginatedResult<T>>;
    
    /**
     * Find an entity by its ID
     * 
     * @param id - The entity's unique identifier
     * @param options - Additional query options
     * @returns Promise containing the found entity or null if not found
     */
    findById(id: ID, options?: OperationOptions): Promise<T | null>;
    
    /**
     * Find entities based on specific criteria
     * 
     * @param criteria - Filter criteria
     * @param options - Additional query options
     * @returns Promise containing array of matching entities
     */
    findByCriteria(criteria: FilterCriteria<FilterType>, options?: OperationOptions): Promise<T[]>;
    
    /**
     * Find a single entity based on specific criteria
     * 
     * @param criteria - Filter criteria
     * @param options - Additional query options
     * @returns Promise containing the found entity or null if not found
     */
    findOneByCriteria(criteria: FilterCriteria<FilterType>, options?: OperationOptions): Promise<T | null>;
    
    /**
     * Create a new entity
     * 
     * @param data - Entity data
     * @returns Promise containing the created entity
     */
    create(data: Partial<T>): Promise<T>;
    
    /**
     * Update an existing entity
     * 
     * @param id - The entity's unique identifier
     * @param data - Updated entity data
     * @returns Promise containing the updated entity
     */
    update(id: ID, data: Partial<T>): Promise<T>;
    
    /**
     * Delete an entity
     * 
     * @param id - The entity's unique identifier
     * @returns Promise containing the deleted entity or boolean indicating success
     */
    delete(id: ID): Promise<T | boolean>;
    
    /**
     * Count entities matching the given criteria
     * 
     * @param criteria - Filter criteria
     * @returns Promise containing the count
     */
    count(criteria?: FilterCriteria<FilterType>): Promise<number>;
    
    /**
     * Executes operations within a transaction
     * 
     * @param callback - Transaction callback function
     * @returns Promise containing the result of the transaction
     */
    transaction<R>(callback: (repository: IBaseRepository<T, ID>) => Promise<R>): Promise<R>;
}
