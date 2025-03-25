/**
 * IBaseRepository
 * 
 * Generic repository interface that provides a contract for basic CRUD operations.
 * Designed to work with any entity type and primary key type.
 * 
 * @template T - Entity type
 * @template ID - Primary key type (default: number)
 */
export interface IBaseRepository<T, ID = number> {
    /**
     * Find all entities, optionally with pagination
     * 
     * @param options - Query options like pagination, sorting, etc.
     * @returns Promise containing array of entities and pagination metadata
     */
    findAll(options?: QueryOptions): Promise<PaginatedResult<T>>;
    
    /**
     * Find an entity by its ID
     * 
     * @param id - The entity's unique identifier
     * @param options - Additional query options
     * @returns Promise containing the found entity or null if not found
     */
    findById(id: ID, options?: QueryOptions): Promise<T | null>;
    
    /**
     * Find entities based on specific criteria
     * 
     * @param criteria - Filter criteria
     * @param options - Additional query options
     * @returns Promise containing array of matching entities
     */
    findByCriteria(criteria: FilterCriteria, options?: QueryOptions): Promise<T[]>;
    
    /**
     * Find a single entity based on specific criteria
     * 
     * @param criteria - Filter criteria
     * @param options - Additional query options
     * @returns Promise containing the found entity or null if not found
     */
    findOneByCriteria(criteria: FilterCriteria, options?: QueryOptions): Promise<T | null>;
    
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
    count(criteria?: FilterCriteria): Promise<number>;
    
    /**
     * Executes operations within a transaction
     * 
     * @param callback - Transaction callback function
     * @returns Promise containing the result of the transaction
     */
    transaction<R>(callback: (repository: IBaseRepository<T, ID>) => Promise<R>): Promise<R>;
  }
  
  /**
   * Query options for repository operations
   */
  export interface QueryOptions {
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
     * Additional operation-specific options
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