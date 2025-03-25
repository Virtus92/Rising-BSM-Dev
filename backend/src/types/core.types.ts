/**
 * Core Types
 * 
 * Shared type definitions used across the application
 */
import { SortDirection } from './common/types.js';

/**
 * Base options interface for all service operations
 */
export interface BaseOptions {
  includeDeleted?: boolean;
  userId?: number;
}

/**
 * Base pagination parameters
 */
export interface PaginationOptions {
  /**
   * Current page (1-based)
   */
  page?: number | string;
  
  /**
   * Items per page
   */
  limit?: number | string;
}

/**
 * Base sort options
 */
export interface SortOptions {
  /**
   * Field to sort by
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: SortDirection;
}

/**
 * Pagination result metadata
 */
export interface PaginationResult {
  /**
   * Current page (1-based)
   */
  current: number;
  
  /**
   * Items per page
   */
  limit: number;
  
  /**
   * Total number of pages
   */
  total: number;
  
  /**
   * Total number of records
   */
  totalRecords: number;
}

/**
 * Process pagination options and return formatted pagination result
 * @param params Pagination parameters from request
 * @param defaultLimit Default items per page
 * @param maxLimit Maximum items per page
 */
export function processPagination(
  params: PaginationOptions,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationResult {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(
    maxLimit, 
    Math.max(1, Number(params.limit) || defaultLimit)
  );
  
  return {
    current: page,
    limit,
    total: 0, // Will be filled later
    totalRecords: 0 // Will be filled later
  };
}

/**
 * Complete pagination result with total counts
 * @param pagination Pagination base result
 * @param totalRecords Total number of records
 */
export function completePagination(
  pagination: PaginationResult, 
  totalRecords: number
): PaginationResult {
  const totalPages = Math.ceil(totalRecords / pagination.limit);
  
  return {
    ...pagination,
    total: totalPages,
    totalRecords
  };
}
