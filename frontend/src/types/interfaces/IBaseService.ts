import { PaginatedResult, FilterCriteria, OperationOptions, ErrorDetails } from '@/types/core/shared';

/**
 * IBaseService
 * 
 * Generic service interface that provides a contract for common business operations.
 * Acts as an abstraction layer between controllers and repositories.
 * 
 * @template T - Entity type
 * @template C - Create DTO type
 * @template U - Update DTO type
 * @template R - Response DTO type
 * @template ID - Primary key type (default: number)
 * @template FilterType - Type for filter criteria
 */
export interface IBaseService<
  T, 
  C, 
  U, 
  R, 
  ID = number, 
  FilterType = Record<string, any>
> {
    /**
     * Get all entities with optional filtering and pagination
     * 
     * @param options - Service options including filters, pagination, etc.
     * @returns Promise containing array of response DTOs and pagination metadata
     */
    getAll(options?: OperationOptions): Promise<PaginatedResult<R>>;
    
    /**
     * Get an entity by its ID
     * 
     * @param id - The entity's unique identifier
     * @param options - Additional service options
     * @returns Promise containing the response DTO or null if not found
     */
    getById(id: ID, options?: OperationOptions): Promise<R | null>;
    
    /**
     * Create a new entity
     * 
     * @param data - Create DTO with entity data
     * @param options - Additional service options
     * @returns Promise containing the response DTO for the created entity
     */
    create(data: C, options?: OperationOptions): Promise<R>;
    
    /**
     * Update an existing entity
     * 
     * @param id - The entity's unique identifier
     * @param data - Update DTO with updated entity data
     * @param options - Additional service options
     * @returns Promise containing the response DTO for the updated entity
     */
    update(id: ID, data: U, options?: OperationOptions): Promise<R>;
    
    /**
     * Delete an entity
     * 
     * @param id - The entity's unique identifier
     * @param options - Additional service options
     * @returns Promise containing boolean indicating success
     */
    delete(id: ID, options?: OperationOptions): Promise<boolean>;
    
    /**
     * Find entities based on specific criteria
     * 
     * @param criteria - Filter criteria
     * @param options - Additional service options
     * @returns Promise containing array of matching response DTOs
     */
    findByCriteria(criteria: FilterCriteria<FilterType>, options?: OperationOptions): Promise<R[]>;
    
    /**
     * Validate entity data before persistence
     * 
     * @param data - Data to validate
     * @param isUpdate - Whether this is for an update operation
     * @param userId - Optional user ID for update operations
     * @returns Promise that resolves if validation passes, or throws with validation errors
     * @throws {ErrorDetails} Validation error details
     */
    validate(data: C | U, isUpdate?: boolean, userId?: number): Promise<void>;
    
    /**
     * Transform entity to response DTO
     * 
     * @param entity - Entity to transform
     * @returns Response DTO
     */
    toDTO(entity: T): R;
    
    /**
     * Execute an operation within a transaction
     * 
     * @param callback - Transaction callback function
     * @returns Promise containing the result of the transaction
     */
    transaction<r>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<r>): Promise<r>;

    /**
     * Update multiple entities at once
     * 
     * @param ids - Array of entity IDs to update
     * @param data - Update data to apply to all selected entities
     * @param options - Additional service options
     * @returns Promise containing the number of updated entities
     */
    bulkUpdate(ids: ID[], data: U, options?: OperationOptions): Promise<number>;
}
