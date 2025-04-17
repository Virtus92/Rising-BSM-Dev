/**
 * @deprecated This file is deprecated. Use the new unified list utilities from '@/shared/utils/list' instead.
 * The new implementation provides better TypeScript support, more consistent handling of API responses,
 * and integration with URL state management.
 */

import { BaseFilterParamsDto } from '@/domain/dtos/BaseDto';
import { SortOptions, PaginationResult } from '@/domain/repositories/IBaseRepository';

/**
 * Common interface representing pagination metadata
 * @deprecated Use the PaginationMeta interface from '@/shared/utils/list' instead
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standardized list state interface for components that display data in lists
 * @deprecated Use the UseBaseListResult from '@/shared/utils/list' instead
 */
export interface ListState<T, F extends BaseFilterParamsDto = BaseFilterParamsDto> {
  items: T[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: F;
}

/**
 * Extracts pagination metadata from various API response formats
 * @deprecated Use extractPaginationMeta from '@/shared/utils/list' instead
 * 
 * Handles inconsistencies in API response structures by attempting to extract 
 * pagination information from different possible formats.
 * 
 * @param data Response data from API
 * @param fallbackPage Current page to use if not found in response
 * @param fallbackLimit Items per page to use if not found in response
 * @returns Normalized pagination metadata
 */
export function extractPaginationMeta(
  data: any, 
  fallbackPage: number = 1, 
  fallbackLimit: number = 10
): PaginationMeta {
  // If data has a standard pagination structure
  if (data?.pagination) {
    return {
      page: data.pagination.page || fallbackPage,
      limit: data.pagination.limit || fallbackLimit,
      total: data.pagination.total || 0,
      totalPages: data.pagination.totalPages || 0
    };
  }
  
  // If data is an array, create pagination meta with array length
  if (Array.isArray(data)) {
    return {
      page: fallbackPage,
      limit: fallbackLimit,
      total: data.length,
      totalPages: Math.ceil(data.length / fallbackLimit)
    };
  }
  
  // If data contains an array property, try to find it
  const arrayProps = Object.entries(data || {})
    .find(([_, value]) => Array.isArray(value));
    
  if (arrayProps) {
    const [_, arrayData] = arrayProps;
    return {
      page: fallbackPage,
      limit: fallbackLimit,
      total: (arrayData as any[]).length,
      totalPages: Math.ceil((arrayData as any[]).length / fallbackLimit)
    };
  }
  
  // Fallback pagination with empty data
  return {
    page: fallbackPage,
    limit: fallbackLimit,
    total: 0,
    totalPages: 0
  };
}

/**
 * Extracts items from different API response formats
 * @deprecated Use extractItems from '@/shared/utils/list' instead
 * 
 * @param data Response data from API
 * @returns Array of items
 */
export function extractItems<T>(data: any): T[] {
  // If data is an array, return it directly
  if (Array.isArray(data)) {
    return data as T[];
  }
  
  // If data has a data property that's an array, return that
  if (data?.data && Array.isArray(data.data)) {
    return data.data as T[];
  }
  
  // Try to find any array property
  for (const key in data) {
    if (Array.isArray(data[key])) {
      return data[key] as T[];
    }
  }
  
  // Fallback to empty array
  return [] as T[];
}

/**
 * Builds URL search parameters from filter object
 * @deprecated Use buildQueryParams from '@/shared/utils/list' instead
 * 
 * @param filters Filter parameters
 * @returns URLSearchParams object with filter parameters
 */
export function buildQueryParams(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Handle date objects
      if (value instanceof Date) {
        params.append(key, value.toISOString());
      }
      // Handle boolean values
      else if (typeof value === 'boolean') {
        params.append(key, value ? 'true' : 'false');
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== undefined && item !== null) {
            params.append(key, String(item));
          }
        });
      }
      // Handle everything else
      else {
        params.append(key, String(value));
      }
    }
  });
  
  return params;
}

/**
 * Merges current filters with new filter values
 * @deprecated Use mergeFilters from '@/shared/utils/list' instead
 * 
 * @param currentFilters Current filter state 
 * @param newFilters New filter values to apply
 * @param resetPage Whether to reset page to 1 when filters change
 * @returns Updated filter object
 */
export function mergeFilters<F extends BaseFilterParamsDto>(
  currentFilters: F, 
  newFilters: Partial<F>,
  resetPage: boolean = true
): F {
  const updatedFilters = { ...currentFilters };
  
  // Update with new values
  Object.keys(newFilters).forEach(key => {
    const typedKey = key as keyof F;
    const newValue = newFilters[typedKey];
    
    // Only update if value is not undefined (allows clearing by passing null)
    if (newValue !== undefined) {
      updatedFilters[typedKey] = newValue as any;
    }
  });
  
  // Reset to page 1 if filters changed (but don't override explicitly passed page)
  if (resetPage && !('page' in newFilters) && Object.keys(newFilters).length > 0) {
    updatedFilters.page = 1 as any;
  }
  
  return updatedFilters;
}

/**
 * Convert table sorting to API-compatible sort options
 * @deprecated Use convertTableSortToApiSort from '@/shared/utils/list' instead
 * 
 * @param tableSortState Sort state from table component 
 * @returns Sort options compatible with API
 */
export function convertTableSortToApiSort(tableSortState: Array<{ id: string; desc: boolean }>): SortOptions | undefined {
  if (!tableSortState.length) return undefined;
  
  const [firstSort] = tableSortState;
  
  return {
    field: firstSort.id,
    direction: firstSort.desc ? 'desc' : 'asc'
  };
}

/**
 * Processes an API response to normalize data structure
 * @deprecated Use processApiResponse from '@/shared/utils/list' instead
 * 
 * @param response API response object
 * @param fallbackPage Fallback page number
 * @param fallbackLimit Fallback items per page
 * @returns Normalized result with items and pagination
 */
export function processApiResponse<T>(
  response: any,
  fallbackPage: number = 1,
  fallbackLimit: number = 10
): { items: T[]; pagination: PaginationMeta } {
  // Extract actual data from response
  const responseData = response.data || response;
  
  // Extract items
  const items = extractItems<T>(responseData);
  
  // Extract pagination metadata
  const pagination = extractPaginationMeta(responseData, fallbackPage, fallbackLimit);
  
  return { items, pagination };
}

/**
 * Creates empty pagination result
 * @deprecated Use emptyPaginationResult from '@/shared/utils/list' instead
 * 
 * @param page Current page
 * @param limit Items per page
 * @returns Empty pagination result
 */
export function emptyPaginationResult<T>(page: number = 1, limit: number = 10): PaginationResult<T> {
  return {
    data: [] as T[],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0
    }
  };
}