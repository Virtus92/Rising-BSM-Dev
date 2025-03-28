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
 */
export interface IBaseService<T, C, U, R, ID = number> {
    /**
     * Get all entities with optional filtering and pagination
     * 
     * @param options - Service options including filters, pagination, etc.
     * @returns Promise containing array of response DTOs and pagination metadata
     */
    getAll(options?: ServiceOptions): Promise<PaginatedResult<R>>;
    
    /**
     * Get an entity by its ID
     * 
     * @param id - The entity's unique identifier
     * @param options - Additional service options
     * @returns Promise containing the response DTO or null if not found
     */
    getById(id: ID, options?: ServiceOptions): Promise<R | null>;
    
    /**
     * Create a new entity
     * 
     * @param data - Create DTO with entity data
     * @param options - Additional service options
     * @returns Promise containing the response DTO for the created entity
     */
    create(data: C, options?: ServiceOptions): Promise<R>;
    
    /**
     * Update an existing entity
     * 
     * @param id - The entity's unique identifier
     * @param data - Update DTO with updated entity data
     * @param options - Additional service options
     * @returns Promise containing the response DTO for the updated entity
     */
    update(id: ID, data: U, options?: ServiceOptions): Promise<R>;
    
    /**
     * Delete an entity
     * 
     * @param id - The entity's unique identifier
     * @param options - Additional service options
     * @returns Promise containing boolean indicating success
     */
    delete(id: ID, options?: ServiceOptions): Promise<boolean>;
    
    /**
     * Find entities based on specific criteria
     * 
     * @param criteria - Filter criteria
     * @param options - Additional service options
     * @returns Promise containing array of matching response DTOs
     */
    findByCriteria(criteria: FilterCriteria, options?: ServiceOptions): Promise<R[]>;
    
    /**
     * Validate entity data before persistence
     * 
     * @param data - Data to validate
     * @param isUpdate - Whether this is for an update operation
     * @param userId - Optional user ID for update operations
     * @returns Promise that resolves if validation passes, or rejects with validation errors
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
    transaction<Result>(callback: (service: IBaseService<T, C, U, R, ID>) => Promise<Result>): Promise<Result>;
  }
  
  /**
   * Service options for service operations
   */
  export interface ServiceOptions {
    /**
     * Page number (1-indexed)
     */
    page?: number;
    
    /**
     * Number of items per page
     */
    limit?: number;
    
    /**
     * Fields to select/include
     */
    select?: string[];
    
    /**
     * Related entities to include
     */
    relations?: string[];
    
    /**
     * Sorting options
     */
    sort?: SortOptions;
    
    /**
     * Whether to include soft-deleted items
     */
    withDeleted?: boolean;
    
    /**
     * Context information (like authenticated user)
     */
    context?: ContextInfo;
    
    /**
     * Additional operation-specific options
     */
    [key: string]: any;
  }
  
  /**
   * Context information for service operations
   */
  export interface ContextInfo {
    /**
     * ID of the authenticated user
     */
    userId?: number;
    
    /**
     * Role of the authenticated user
     */
    userRole?: string;
    
    /**
     * IP address of the client
     */
    ipAddress?: string;
    
    /**
     * Additional context properties
     */
    [key: string]: any;
  }
  
  /**
   * Sorting options
   */
  export interface SortOptions {
    /**
     * Field to sort by
     */
    field: string;
    
    /**
     * Sort direction
     */
    direction: 'ASC' | 'DESC';
  }
  
  /**
   * Pagination result
   */
  export interface PaginatedResult<T> {
    /**
     * Array of items
     */
    data: T[];
    
    /**
     * Pagination metadata
     */
    pagination: {
      /**
       * Current page
       */
      page: number;
      
      /**
       * Items per page
       */
      limit: number;
      
      /**
       * Total number of items
       */
      total: number;
      
      /**
       * Total number of pages
       */
      totalPages: number;
    };
  }
  
  /**
   * Filter criteria type for queries
   */
  export type FilterCriteria = Record<string, any>;