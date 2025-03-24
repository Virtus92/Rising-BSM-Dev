/**
 * Repository Types
 * 
 * Type definitions for repositories and their operations.
 */
import { SortDirection } from './common/types.js';
import { TransactionClient } from '@prisma/client';

/**
 * Common options for repository operations
 */
export interface RepositoryOptions {
  /**
   * Whether to include soft-deleted records
   */
  includeDeleted?: boolean;
}

/**
 * Options for find operations
 */
export interface FindOptions extends RepositoryOptions {
  /**
   * Relations/models to include
   */
  include?: Record<string, boolean | object>;
  
  /**
   * Fields to select
   */
  select?: Record<string, boolean>;

  /**
   * Order by criteria
   */
  orderBy?: Record<string, SortDirection> | Array<Record<string, SortDirection>>;
}

/**
 * Options for findMany operations
 */
export interface FindManyOptions extends FindOptions {
  /**
   * Current page (1-based)
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Number of items to skip
   */
  skip?: number;
  
  /**
   * Number of items to take
   */
  take?: number;
}

/**
 * Options for create operations
 */
export interface CreateOptions extends RepositoryOptions {
  /**
   * Relations/models to include in the result
   */
  include?: Record<string, boolean | object>;
  
  /**
   * Fields to select in the result
   */
  select?: Record<string, boolean>;
}

/**
 * Options for update operations
 */
export interface UpdateOptions extends RepositoryOptions {
  /**
   * Relations/models to include in the result
   */
  include?: Record<string, boolean | object>;
  
  /**
   * Fields to select in the result
   */
  select?: Record<string, boolean>;
  
  /**
   * Whether to check if the entity exists before updating
   */
  checkExists?: boolean;
}

/**
 * Options for delete operations
 */
export interface DeleteOptions extends RepositoryOptions {
  /**
   * Whether to check if the entity exists before deleting
   */
  checkExists?: boolean;
}

/**
 * Options for count operations
 */
export interface CountOptions extends RepositoryOptions {
  /**
   * Whether to use distinct count
   */
  distinct?: string | string[];
}

/**
 * Options for transaction operations
 */
export interface TransactionOptions {
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Isolation level
   */
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
}

/** 
 * Filter criteria for database queries.
 * Key-value pairs that map to entity fields.
 * Example: `{ userId: 5, status: 'active' }`
 */
export interface FilterCriteria {
  [key: string]: any;
}

/**
 * Base interface for repositories
 */
export interface IRepository<T, TFilter = FilterCriteria> {
  /**
   * Find all entities with filtering and pagination
   */
  findAll(filters: TFilter, options?: FindManyOptions): Promise<{ data: T[]; pagination: any }>;
  
  /**
   * Find a single entity by ID
   */
  findById(id: number, options?: FindOptions): Promise<T | null>;
  
  /**
   * Find a single entity by ID or throw an error if not found
   */
  findByIdOrThrow(id: number, options?: FindOptions): Promise<T>;
  
  /**
   * Find a single entity by custom criteria
   */
  findOne(where: any, options?: FindOptions): Promise<T | null>;
  
  /**
   * Create a new entity
   */
  create(data: Partial<T>, options?: CreateOptions): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: number, data: Partial<T>, options?: UpdateOptions): Promise<T>;
  
  /**
   * Delete an entity
   */
  delete(id: number, options?: DeleteOptions): Promise<T>;
  
  /**
   * Count entities with filtering
   */
  count(filters?: TFilter, options?: CountOptions): Promise<number>;
  
  /**
   * Execute operations within a transaction
   */
  transaction<R>(callback: (tx: TransactionClient) => Promise<R>, options?: TransactionOptions): Promise<R>;
}