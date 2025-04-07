/**
 * Base Repository Interface
 * Defines common data access operations for all repositories
 */
export interface IRepository<T, ID> {
  /**
   * Find all entities, optionally with query options
   */
  findAll(options?: QueryOptions): Promise<T[]>;
  
  /**
   * Find an entity by its ID
   */
  findById(id: ID, options?: QueryOptions): Promise<T | null>;
  
  /**
   * Find entities by specified criteria
   */
  findByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T[]>;
  
  /**
   * Find a single entity by criteria
   */
  findOneByCriteria(criteria: Record<string, any>, options?: QueryOptions): Promise<T | null>;
  
  /**
   * Create a new entity
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: ID, data: Partial<T>): Promise<T>;
  
  /**
   * Delete an entity
   */
  delete(id: ID): Promise<boolean>;
  
  /**
   * Count entities matching criteria
   */
  count(criteria?: Record<string, any>): Promise<number>;
  
  /**
   * Execute operations in a transaction
   */
  withTransaction<R>(operation: () => Promise<R>): Promise<R>;
}

/**
 * Query options for repository operations
 */
export interface QueryOptions {
  /**
   * Page number for pagination (1-based)
   */
  page?: number;
  
  /**
   * Number of items per page
   */
  limit?: number;
  
  /**
   * Fields to select
   */
  select?: string[];
  
  /**
   * Relations to include
   */
  relations?: string[];
  
  /**
   * Sorting options
   */
  sort?: {
    field: string;
    direction: 'ASC' | 'DESC';
  };
  
  /**
   * Additional cache options
   */
  cache?: {
    ttl: number;
    key?: string;
  };
}

/**
 * Page result interface for paginated queries
 */
export interface PageResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
