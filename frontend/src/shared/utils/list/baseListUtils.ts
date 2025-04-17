/**
 * Enhanced base list utilities for consistent list management across the application
 */
import { BaseFilterParamsDto, PaginationMetaDto } from '@/domain/dtos/BaseDto';
import { useBaseList } from '@/shared/hooks/useBaseList';

/**
 * Enhanced pagination metadata with filter information
 */
export interface EnhancedPaginationMeta extends PaginationMetaDto {
  filters?: Record<string, any>;
}

/**
 * Configuration for creating a base list utility
 */
export interface CreateBaseListUtilityConfig<T, F extends BaseFilterParamsDto> {
  // Service function that fetches data
  fetchFunction: (filters: F) => Promise<any>;
  
  // Initial filters to apply
  initialFilters?: Partial<F>;
  
  // Extract items and pagination from API response
  responseAdapter?: (response: any) => { 
    items: T[]; 
    pagination: EnhancedPaginationMeta;
  };
  
  // Whether to sync filters with URL
  syncWithUrl?: boolean;
  
  // URL parameter configuration for type conversion
  urlFilterConfig?: {
    numeric?: Array<keyof F>;
    boolean?: Array<keyof F>;
    enum?: Partial<Record<keyof F, any[]>>;
  };
  
  // Default sort configuration
  defaultSortField?: keyof F | string;
  defaultSortDirection?: 'asc' | 'desc';
  
  // Function to map sort fields (from UI to API fields)
  mapSortField?: (field: string) => string;
  
  // Options
  resetPageOnFilterChange?: boolean;
  autoFetch?: boolean;
}

/**
 * Base list utility interface with common functionality
 */
export interface BaseListUtility<T, F extends BaseFilterParamsDto> {
  // Data
  data: T[];
  items: T[]; // Alias for better compatibility
  isLoading: boolean;
  error: string | null;
  pagination: EnhancedPaginationMeta;
  filters: F;
  
  // Actions
  updateFilters: (newFilters: Partial<F>, resetPage?: boolean) => void;
  setFilters: (filters: F) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: (partialFilters?: Partial<F>) => void;
  refetch: () => Promise<void>;
  setSort: (field: string, direction: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  
  // Filter helpers
  setFilter: <K extends keyof F>(key: K, value: F[K] | undefined) => void;
  clearFilter: <K extends keyof F>(key: K) => void;
  clearAllFilters: () => void;
  
  // Item management
  setItems: (items: T[]) => void; // Method to update items directly
}

/**
 * Standard filter type for active filter display
 */
export interface ActiveFilterInfo {
  label: string;
  value: string;
  onRemove: () => void;
}

/**
 * Default adapter function to extract data from API responses
 */
function defaultResponseAdapter<T>(response: any): { 
  items: T[]; 
  pagination: EnhancedPaginationMeta;
} {
  // Handle null or undefined response
  if (!response) {
    return {
      items: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
  }

  const data = response.data || response;
  
  // Extract items
  let items: T[] = [];
  
  // Handle items in 'data' property (common API pattern)
  if (data && data.data && Array.isArray(data.data)) {
    items = data.data;
  } 
  // Handle items in 'items' property
  else if (data && data.items && Array.isArray(data.items)) {
    items = data.items;
  }
  // Handle items in 'results' property
  else if (data && data.results && Array.isArray(data.results)) {
    items = data.results;
  }
  // Handle when data itself is an array
  else if (Array.isArray(data)) {
    items = data;
  }
  
  // Extract pagination
  let pagination: EnhancedPaginationMeta = {
    page: 1,
    limit: 10,
    total: items.length,
    totalPages: Math.ceil(items.length / 10)
  };
  
  // Check for pagination in data
  if (data && data.pagination) {
    pagination = {
      ...pagination,
      ...data.pagination
    };
  }
  // Check for pagination in meta
  else if (data && data.meta && data.meta.pagination) {
    pagination = {
      ...pagination,
      ...data.meta.pagination
    };
  }
  
  // Ensure filters are attached to pagination
  if (data && !pagination.filters && data.filters) {
    pagination.filters = data.filters;
  }
  
  return { items, pagination };
}

/**
 * Creates a base list utility with standardized interface
 */
export function createBaseListUtility<T, F extends BaseFilterParamsDto>(
  config: CreateBaseListUtilityConfig<T, F>
): BaseListUtility<T, F> {
  // Extract configuration with defaults
  const { 
    fetchFunction, 
    initialFilters = {} as Partial<F>,
    responseAdapter = defaultResponseAdapter,
    mapSortField,
    ...restConfig 
  } = config;
  
  // Create a wrapped fetch function that handles response mapping
  const wrappedFetchFunction = async (filters: F): Promise<any> => {
    // Map sort field if needed
    const mappedFilters = { ...filters };
    if (mapSortField && filters.sortBy) {
      mappedFilters.sortBy = mapSortField(filters.sortBy) as any;
    }
    
    const response = await fetchFunction(mappedFilters);
    return response;
  };
  
  // Use the base list hook
  const baseList = useBaseList<T, F>({
    fetchFunction: wrappedFetchFunction,
    responseAdapter,
    initialFilters: initialFilters as Partial<F>,
    ...restConfig
  });
  
  // Return an enhanced version of the base list
  return {
    ...baseList,
    // Data aliases for better compatibility
    data: baseList.items,
    pagination: {
      ...baseList.pagination,
      filters: baseList.filters as any
    },
    // Include the setItems method
    setItems: baseList.setItems
  };
}

/**
 * Utility to create active filters array for display in UI
 */
export function createActiveFilters<F extends BaseFilterParamsDto>(
  filters: F,
  filterConfig: Array<{ 
    key: keyof F; 
    label: string;
    format?: (value: any) => string;
  }>,
  clearFilter: <K extends keyof F>(key: K) => void
): ActiveFilterInfo[] {
  return filterConfig
    .filter(({ key }) => {
      // Check if the filter has a value
      const value = filters[key];
      if (value === undefined || value === null || value === '') {
        return false;
      }
      
      // Handle arrays
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      
      return true;
    })
    .map(({ key, label, format }) => {
      const value = filters[key];
      const formattedValue = format 
        ? format(value)
        : Array.isArray(value) 
          ? value.join(', ') 
          : String(value);
          
      return {
        label,
        value: formattedValue,
        onRemove: () => clearFilter(key)
      };
    });
}

/**
 * Helper to determine if there are any active filters (excluding pagination and sorting)
 */
export function hasActiveFilters<F extends BaseFilterParamsDto>(
  filters: F,
  exclude: Array<keyof F> = ['page', 'limit', 'sortBy', 'sortDirection']
): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (exclude.includes(key as keyof F)) {
      return false;
    }
    
    // Check for undefined, null or empty string
    if (value === undefined || value === null || value === '') {
      return false;
    }
    
    // Check for empty arrays
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    
    return true;
  });
}

/**
 * Helper to extract standard pagination props for BaseListComponent
 */
export function getPaginationProps(pagination: EnhancedPaginationMeta) {
  return {
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    totalItems: pagination.total,
    pageSize: pagination.limit
  };
}
