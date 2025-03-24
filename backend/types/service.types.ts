/**
 * Service Types
 * 
 * Type definitions for services and their operations.
 */
import { UserContext } from './common/types.js';

/**
 * Common options for service operations
 */
export interface ServiceOptions {
  /**
   * Whether to include soft-deleted records
   */
  includeDeleted?: boolean;
}

/**
 * Options for findAll operations
 */
export interface FindAllOptions extends ServiceOptions {
  /**
   * Current page (1-based)
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Field to order by
   */
  orderBy?: string;
  
  /**
   * Order direction
   */
  orderDirection?: 'asc' | 'desc';
  
  /**
   * Relations to include
   */
  include?: string[];
}

/**
 * Options for findOne operations
 */
export interface FindOneOptions extends ServiceOptions {
  /**
   * Whether to throw an error if the entity is not found
   */
  throwIfNotFound?: boolean;
  
  /**
   * Relations to include
   */
  include?: string[];
}

/**
 * Options for create operations
 */
export interface CreateOptions extends ServiceOptions {
  /**
   * User context for auditing
   */
  userContext?: UserContext;
  
  /**
   * Relations to include in the result
   */
  include?: string[];
  
  /**
   * ID of the user performing the operation
   * @deprecated Use userContext instead
   */
  userId?: number;
}

/**
 * Options for update operations
 */
export interface UpdateOptions extends ServiceOptions {
  /**
   * User context for auditing
   */
  userContext?: UserContext;
  
  /**
   * Whether to throw an error if the entity is not found
   */
  throwIfNotFound?: boolean;
  
  /**
   * Relations to include in the result
   */
  include?: string[];
  
  /**
   * ID of the user performing the operation
   * @deprecated Use userContext instead
   */
  userId?: number;
}

/**
 * Options for delete operations
 */
export interface DeleteOptions extends ServiceOptions {
  /**
   * User context for auditing
   */
  userContext?: UserContext;
  
  /**
   * Whether to throw an error if the entity is not found
   */
  throwIfNotFound?: boolean;
  
  /**
   * Whether to use soft delete instead of hard delete
   */
  softDelete?: boolean;
  
  /**
   * ID of the user performing the operation
   * @deprecated Use userContext instead
   */
  userId?: number;
}

/**
 * Options for batch operations
 */
export interface BatchOptions extends ServiceOptions {
  /**
   * User context for auditing
   */
  userContext?: UserContext;
  
  /**
   * Whether to use transactions for batch operations
   */
  useTransaction?: boolean;
  
  /**
   * Whether to continue on error
   */
  continueOnError?: boolean;
}

/**
 * Result of a batch operation
 */
export interface BatchResult<T> {
  /**
   * Number of successful operations
   */
  successCount: number;
  
  /**
   * Array of successfully processed items
   */
  successes: T[];
  
  /**
   * Number of failed operations
   */
  failureCount: number;
  
  /**
   * Array of errors for failed operations
   */
  failures: Array<{ 
    index: number; 
    error: Error; 
    item: any;
  }>;
}

/**
 * Base interface for services
 */
export interface IService<
  T, 
  TFilter = any,
  TCreateDTO = any,
  TUpdateDTO = any,
  TResponseDTO = any
> {
  /**
   * Find all entities with filtering and pagination
   */
  findAll(
    filters: TFilter, 
    options?: FindAllOptions
  ): Promise<{ data: TResponseDTO[]; pagination: any }>;
  
  /**
   * Find a single entity by ID
   */
  findById(
    id: number, 
    options?: FindOneOptions
  ): Promise<TResponseDTO | null>;
  
  /**
   * Create a new entity
   */
  create(
    data: TCreateDTO, 
    options?: CreateOptions
  ): Promise<TResponseDTO>;
  
  /**
   * Update an existing entity
   */
  update(
    id: number, 
    data: TUpdateDTO, 
    options?: UpdateOptions
  ): Promise<TResponseDTO>;
  
  /**
   * Delete an entity
   */
  delete(
    id: number, 
    options?: DeleteOptions
  ): Promise<TResponseDTO>;
}