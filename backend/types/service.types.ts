/**
 * Service Types
 * 
 * Type definitions for service layer operations
 */
import { BaseOptions, PaginationOptions, SortOptions } from './core.types.js';

/**
 * Options for service operations
 */
export interface ServiceOptions extends BaseOptions {
  // Additional service-specific options can be added here
}

/**
 * Options for retrieving multiple records
 */
export interface FindAllOptions extends ServiceOptions, PaginationOptions, SortOptions {
  // Fields moved to core types but preserved here for backward compatibility
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Options for retrieving a single record
 */
export interface FindOneOptions extends ServiceOptions {
  throwIfNotFound?: boolean;
}

/**
 * Options for creating records
 */
export interface CreateOptions extends ServiceOptions {
  // UserID moved to BaseOptions
}

/**
 * Options for updating records
 */
export interface UpdateOptions extends ServiceOptions {
  throwIfNotFound?: boolean;
}

/**
 * Options for deleting records
 */
export interface DeleteOptions extends ServiceOptions {
  throwIfNotFound?: boolean;
  softDelete?: boolean;
}