'use client';

import { 
  useReducer, 
  useCallback, 
  useEffect, 
  useRef, 
  useState 
} from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BaseFilterParamsDto } from '@/domain/dtos/BaseDto';

// ----- STATE TYPES -----

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BaseListState<T, F extends BaseFilterParamsDto> {
  items: T[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: F;
  // Track last request to avoid race conditions
  lastRequestId: number;
}

// ----- ACTION TYPES -----

type BaseListAction<T, F extends BaseFilterParamsDto> =
  | { type: 'INITIALIZE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'FETCH_SUCCESS'; payload: { items: T[]; pagination: PaginationMeta; requestId: number } }
  | { type: 'FETCH_ERROR'; payload: { error: string; requestId: number } }
  | { type: 'UPDATE_FILTERS'; payload: { filters: Partial<F>; resetPage?: boolean } }
  | { type: 'SET_FILTERS'; payload: F }
  | { type: 'RESET_FILTERS'; payload?: Partial<F> };

// ----- PROPS & RESULT TYPES -----

export interface UseBaseListProps<T, F extends BaseFilterParamsDto> {
  // Service function that fetches data
  fetchFunction: (filters: F) => Promise<any>;
  // Initial filters to apply
  initialFilters?: Partial<F>;
  // Extract items and pagination from API response
  responseAdapter?: (response: any) => { items: T[]; pagination: PaginationMeta };
  // Whether to sync filters with URL
  syncWithUrl?: boolean;
  // URL parameter configuration for type conversion
  urlFilterConfig?: {
    numeric?: Array<keyof F>;
    boolean?: Array<keyof F>;
    enum?: Partial<Record<keyof F, any[]>>;
  };
  // Default pagination settings
  defaultPage?: number;
  defaultLimit?: number;
  defaultSortField?: keyof F | string;
  defaultSortDirection?: 'asc' | 'desc';
  // Options
  resetPageOnFilterChange?: boolean;
  autoFetch?: boolean;
}

export interface UseBaseListResult<T, F extends BaseFilterParamsDto> {
  // Data and state
  items: T[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: F;
  
  // Actions
  updateFilters: (newFilters: Partial<F>) => void;
  setFilters: (filters: F) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
  setSort: (field: keyof F | string, direction: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  
  // Filter helpers
  setFilter: <K extends keyof F>(key: K, value: F[K] | undefined) => void;
  clearFilter: <K extends keyof F>(key: K) => void;
  clearAllFilters: () => void;
  
  // Item management
  setItems: (items: T[]) => void;
  
  // Access to dispatch for internal use
  dispatch: React.Dispatch<BaseListAction<T, F>>;
}

// ----- UTILITY FUNCTIONS -----

/**
 * Extracts items from API response
 */
function extractItems<T>(data: any): T[] {
  if (!data) return [];
  
  // If data is already an array
  if (Array.isArray(data)) {
    return data as T[];
  }
  
  // Common API response patterns
  if (data.data && Array.isArray(data.data)) {
    return data.data as T[];
  }
  
  if (data.items && Array.isArray(data.items)) {
    return data.items as T[];
  }
  
  if (data.results && Array.isArray(data.results)) {
    return data.results as T[];
  }
  
  // Try to find any array property at the top level
  const arrayProperty = Object.entries(data)
    .find(([_, value]) => Array.isArray(value));
    
  if (arrayProperty) {
    return arrayProperty[1] as T[];
  }
  
  return [];
}

/**
 * Extracts pagination metadata from API response
 */
function extractPaginationMeta(
  data: any,
  defaultPage: number = 1,
  defaultLimit: number = 10
): PaginationMeta {
  const defaultPagination: PaginationMeta = {
    page: defaultPage,
    limit: defaultLimit,
    total: 0,
    totalPages: 0
  };
  
  // Handle null, undefined or invalid data
  if (!data || typeof data !== 'object') return defaultPagination;
  
  // Direct pagination object
  if (data.pagination) {
    return {
      page: data.pagination.page ?? defaultPage,
      limit: data.pagination.limit ?? defaultLimit,
      total: data.pagination.total ?? 0,
      totalPages: data.pagination.totalPages ?? 
        Math.ceil((data.pagination.total ?? 0) / (data.pagination.limit ?? defaultLimit))
    };
  }
  
  // Pagination in meta
  if (data.meta?.pagination) {
    return {
      page: data.meta.pagination.page ?? defaultPage,
      limit: data.meta.pagination.limit ?? defaultLimit,
      total: data.meta.pagination.total ?? 0,
      totalPages: data.meta.pagination.totalPages ?? 
        Math.ceil((data.meta.pagination.total ?? 0) / (data.meta.pagination.limit ?? defaultLimit))
    };
  }
  
  // If data is array, create pagination
  if (Array.isArray(data)) {
    return {
      page: defaultPage,
      limit: defaultLimit,
      total: data.length,
      totalPages: Math.ceil(data.length / defaultLimit)
    };
  }
  
  return defaultPagination;
}

/**
 * Builds URL search parameters from filter object
 */
function buildQueryParams(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length > 0) {
        value.forEach(item => {
          if (item !== undefined && item !== null) {
            params.append(key, String(item));
          }
        });
      }
      return;
    }
    
    // Handle date objects
    if (value instanceof Date) {
      params.append(key, value.toISOString());
      return;
    }
    
    // Handle objects
    if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
      return;
    }
    
    // Handle primitives
    params.append(key, String(value));
  });
  
  return params;
}

/**
 * Extracts filter parameters from URL
 */
function getFiltersFromUrl<F extends BaseFilterParamsDto>(
  searchParams: URLSearchParams,
  config: {
    numeric?: Array<keyof F>;
    boolean?: Array<keyof F>;
    enum?: Partial<Record<keyof F, any[]>>;
  } = {}
): Partial<F> {
  const filters: Record<string, any> = {};
  
  // Process each parameter
  searchParams.forEach((value, key) => {
    if (!value) return;
    
    // Convert numeric values
    if (config.numeric?.includes(key as keyof F)) {
      const num = Number(value);
      if (!isNaN(num)) {
        filters[key] = num;
      }
      return;
    }
    
    // Convert boolean values
    if (config.boolean?.includes(key as keyof F)) {
      filters[key] = value === 'true';
      return;
    }
    
    // Validate enum values
    if (config.enum && key in config.enum) {
      const enumValues = config.enum[key as keyof F] as any[];
      if (enumValues.includes(value)) {
        filters[key] = value;
      }
      return;
    }
    
    // Default handling
    filters[key] = value;
  });
  
  return filters as Partial<F>;
}

/**
 * Deep equality comparison for checking if objects are equal
 */
function isEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return obj1 === obj2;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}

/**
 * Reducer function for list state management
 */
function baseListReducer<T, F extends BaseFilterParamsDto>(
  state: BaseListState<T, F>,
  action: BaseListAction<T, F>,
  options: {
    defaultPage: number;
    defaultLimit: number;
    defaultSortField?: keyof F | string;
    defaultSortDirection?: 'asc' | 'desc';
    initialFilters: F;
  }
): BaseListState<T, F> {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isInitialized: true
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'FETCH_SUCCESS': {
      // Ignore outdated responses
      if (action.payload.requestId < state.lastRequestId) {
        return state;
      }
      
      return {
        ...state,
        items: action.payload.items,
        pagination: action.payload.pagination,
        isLoading: false,
        error: null,
        lastRequestId: action.payload.requestId
      };
    }
    
    case 'FETCH_ERROR': {
      // Ignore outdated responses
      if (action.payload.requestId < state.lastRequestId) {
        return state;
      }
      
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
        lastRequestId: action.payload.requestId
      };
    }
    
    case 'UPDATE_FILTERS': {
      const { filters: newPartialFilters, resetPage = true } = action.payload;
      const updatedFilters = { ...state.filters, ...newPartialFilters };
      
      // Reset page to 1 if needed and not explicitly set in new filters
      if (resetPage && !('page' in newPartialFilters) && Object.keys(newPartialFilters).length > 0) {
        updatedFilters.page = 1 as any;
      }
      
      // If new filters are identical to current filters, don't update
      if (isEqual(updatedFilters, state.filters)) {
        return state;
      }
      
      return {
        ...state,
        filters: updatedFilters,
        lastRequestId: state.lastRequestId + 1
      };
    }
    
    case 'SET_FILTERS': {
      // Skip update if filters are identical
      if (isEqual(action.payload, state.filters)) {
        return state;
      }
      
      return {
        ...state,
        filters: action.payload,
        lastRequestId: state.lastRequestId + 1
      };
    }
    
    case 'RESET_FILTERS': {
      const baseResetFilters = {
        ...options.initialFilters,
        page: options.defaultPage as any,
        limit: options.defaultLimit as any,
        sortBy: options.defaultSortField as any,
        sortDirection: options.defaultSortDirection as any
      };
      
      // Override with any specified values
      const resetFilters = action.payload
        ? { ...baseResetFilters, ...action.payload }
        : baseResetFilters;
      
      // Skip update if filters are identical
      if (isEqual(resetFilters, state.filters)) {
        return state;
      }
      
      return {
        ...state,
        filters: resetFilters as F,
        lastRequestId: state.lastRequestId + 1
      };
    }
    
    default:
      return state;
  }
}

// Set a global variable to track redirect attempts and prevent infinite loops
// This is outside the hook to ensure it persists across hook instances
let GLOBAL_REDIRECT_ATTEMPTS = 0;
const MAX_REDIRECT_ATTEMPTS = 3;
const REDIRECT_ATTEMPT_TIMEOUT = 30000; // 30 seconds
let LAST_REDIRECT_TIME = 0;

/**
 * Hook for managing lists with filtering, sorting, and pagination
 */
export function useBaseList<T, F extends BaseFilterParamsDto>({
  fetchFunction,
  initialFilters = {} as Partial<F>,
  responseAdapter,
  syncWithUrl = true,
  urlFilterConfig,
  defaultPage = 1,
  defaultLimit = 10,
  defaultSortField,
  defaultSortDirection = 'asc',
  resetPageOnFilterChange = true,
  autoFetch = true
}: UseBaseListProps<T, F>): UseBaseListResult<T, F> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Merge default values into initial filters
  const completeInitialFilters = {
    page: defaultPage,
    limit: defaultLimit,
    sortBy: defaultSortField,
    sortDirection: defaultSortDirection,
    ...initialFilters
  } as F;
  
  // Extract URL filters if syncing with URL
  const urlFilters = syncWithUrl && searchParams
    ? getFiltersFromUrl<F>(searchParams, urlFilterConfig)
    : {};
    
  // Merge URL filters with initial filters, URL takes precedence
  const mergedInitialFilters = {
    ...completeInitialFilters,
    ...urlFilters
  } as F;
  
  // Create initial state
  const initialState: BaseListState<T, F> = {
    items: [],
    isLoading: autoFetch,
    isInitialized: false,
    error: null,
    pagination: {
      page: mergedInitialFilters.page || defaultPage,
      limit: mergedInitialFilters.limit || defaultLimit,
      total: 0,
      totalPages: 0
    },
    filters: mergedInitialFilters,
    lastRequestId: 0
  };
  
  // Create reducer with options
  const reducer = (state: BaseListState<T, F>, action: BaseListAction<T, F>) => 
    baseListReducer(state, action, {
      defaultPage,
      defaultLimit,
      defaultSortField,
      defaultSortDirection,
      initialFilters: completeInitialFilters
    });
  
  // Initialize state with reducer
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Track if a URL update is in progress to prevent loops
  const isUrlUpdateInProgress = useRef(false);
  
  // Track the fetch timeout for debouncing
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track request retries to prevent infinite loops  
  const fetchAttemptsRef = useRef(0);
  const MAX_FETCH_ATTEMPTS = 5;
  
  // Track the API client initialization
  const [isApiInitialized, setIsApiInitialized] = useState(false);
  
  // Store previous filters to detect changes
  const prevFiltersRef = useRef(state.filters);
  
  // Debounced fetch counter reset
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      fetchAttemptsRef.current = 0;
    }, 10000);
    
    return () => clearTimeout(resetTimer);
  }, []);
  
  // Check API initialization
  useEffect(() => {
    // Immediately initialize without waiting for a global flag
    if (!isApiInitialized) {
      setIsApiInitialized(true);
      dispatch({ type: 'INITIALIZE' });
    }
  }, []);
  
  // Fetch data with the current filters
  const fetchData = useCallback(async () => {
    // Skip if not initialized
    if (!state.isInitialized || !isApiInitialized) {
      return;
    }
    
    // Clear any pending fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    // Check if we've had too many consecutive errors
    if (fetchAttemptsRef.current >= MAX_FETCH_ATTEMPTS) {
      console.warn(`Too many fetch attempts (${fetchAttemptsRef.current}), stopping retries`);
      
      // Check if we should attempt redirect to login
      const now = Date.now();
      if (now - LAST_REDIRECT_TIME > REDIRECT_ATTEMPT_TIMEOUT) {
        GLOBAL_REDIRECT_ATTEMPTS++;
        LAST_REDIRECT_TIME = now;
        
        if (GLOBAL_REDIRECT_ATTEMPTS <= MAX_REDIRECT_ATTEMPTS && 
            typeof window !== 'undefined' && 
            window.location.pathname !== '/auth/login') {
          console.warn(`Redirecting to login after ${GLOBAL_REDIRECT_ATTEMPTS} redirect attempts`);
          
          // Reset counters
          fetchAttemptsRef.current = 0;
          
          // Small delay before redirect
          setTimeout(() => {
            window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
          }, 500);
        } else {
          console.warn('Maximum redirect attempts reached, stopping redirects');
        }
      }
      
      return;
    }
    
    // Check for network connectivity to prevent fetch loops
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      dispatch({
        type: 'FETCH_ERROR',
        payload: { 
          error: 'Network connection unavailable. Please check your internet connection.', 
          requestId: state.lastRequestId + 1 
        }
      });
      return;
    }
    
    // Create a request ID to track this request
    const requestId = state.lastRequestId + 1;
    
    try {
      // Increment fetch attempt counter
      fetchAttemptsRef.current++;
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetchFunction(state.filters);
      
      // Reset fetch attempt counter on success
      fetchAttemptsRef.current = 0;
      
      // Parse the response
      let items: T[];
      let pagination: PaginationMeta;
      
      if (responseAdapter) {
        // Use custom adapter if provided
        const adaptedResponse = responseAdapter(response);
        items = adaptedResponse.items;
        pagination = adaptedResponse.pagination;
      } else {
        // Use default extraction
        const data = response.data || response;
        items = extractItems<T>(data);
        pagination = extractPaginationMeta(
          data,
          state.filters.page || defaultPage,
          state.filters.limit || defaultLimit
        );
      }
      
      // Update state with the results
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: { items, pagination, requestId }
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An error occurred while fetching data';
        
      dispatch({
        type: 'FETCH_ERROR',
        payload: { error: errorMessage, requestId }
      });
    }
  }, [
    fetchFunction, 
    state.filters, 
    state.lastRequestId, 
    state.isInitialized,
    isApiInitialized,
    defaultPage, 
    defaultLimit, 
    responseAdapter
  ]);
  
  // Sync URL with current filters
  const syncFiltersToUrl = useCallback(() => {
    if (!syncWithUrl || !pathname || !router || isUrlUpdateInProgress.current) {
      return;
    }
    
    // Compare with previous filters to avoid unnecessary updates
    if (isEqual(state.filters, prevFiltersRef.current)) {
      return;
    }
    
    // Update previous filters reference
    prevFiltersRef.current = state.filters;
    
    // Mark URL update as in progress
    isUrlUpdateInProgress.current = true;
    
    // Clean filters - remove undefined, null and empty strings
    const cleanFilters = Object.fromEntries(
      Object.entries(state.filters)
        .filter(([_, value]) => {
          if (value === undefined || value === null || value === '') {
            return false;
          }
          
          // Keep arrays with values
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          
          return true;
        })
    );
    
    // Create the new URL
    const params = buildQueryParams(cleanFilters);
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    // Update URL without triggering a navigation
    router.replace(url, { scroll: false });
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isUrlUpdateInProgress.current = false;
    }, 300); // Increased delay to prevent race conditions
  }, [pathname, router, state.filters, syncWithUrl]);
  
  // Fetch when filters change
  useEffect(() => {
    // Skip if initialization is not complete
    if (!state.isInitialized || !isApiInitialized) {
      return;
    }
    
    // Deep comparison for filters to avoid unnecessary fetches
    // This is critical to prevent infinite loops
    if (isEqual(state.filters, prevFiltersRef.current)) {
      return;
    }
    
    // Update previous filters reference with a deep copy to ensure full separation
    prevFiltersRef.current = JSON.parse(JSON.stringify(state.filters));
    
    // Track request ID to avoid race conditions
    const currentRequestId = state.lastRequestId;
    
    // Sync with URL first - but only if it's a user-initiated change
    // We'll use a timer to delay this operation to avoid UI jank
    syncFiltersToUrl();
    
    // Cancel existing fetch timeout to prevent duplicate requests
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    
    // Debounce the fetch to prevent multiple rapid calls
    fetchTimeoutRef.current = setTimeout(() => {
      // Verify the request is still valid before executing
      if (currentRequestId === state.lastRequestId && !isUrlUpdateInProgress.current) {
        fetchData();
      }
      fetchTimeoutRef.current = null;
    }, 750); // Longer delay to prevent race conditions
    
    // Cleanup on unmount
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [state.filters, state.isInitialized, isApiInitialized, fetchData, syncFiltersToUrl, state.lastRequestId]);
  
  // Limit how often we update from URL to avoid loops
  const lastUrlUpdateTimeRef = useRef(0);
  const URL_UPDATE_THROTTLE = 1000; // 1 second minimum between URL-based updates
  
  // Sync from URL when searchParams change
  useEffect(() => {
    // Skip if we're already updating URL or not syncing
    if (!syncWithUrl || isUrlUpdateInProgress.current || !searchParams) {
      return;
    }
    
    // Throttle URL-based updates
    const now = Date.now();
    if (now - lastUrlUpdateTimeRef.current < URL_UPDATE_THROTTLE) {
      return;
    }
    
    const urlFilters = getFiltersFromUrl<F>(searchParams, urlFilterConfig);
    
    // Deep comparison to avoid false positives
    let hasSignificantChanges = false;
    
    for (const [key, value] of Object.entries(urlFilters)) {
      const currentValue = state.filters[key as keyof F];
      // Skip comparison for complex objects like Date
      if (value instanceof Date || currentValue instanceof Date) {
        continue;
      }
      // Don't consider null/undefined/empty differences as significant
      if ((value === null || value === undefined || value === '') &&
          (currentValue === null || currentValue === undefined || currentValue === '')) {
        continue;
      }
      // Check for actual different values
      if (!isEqual(currentValue, value)) {
        hasSignificantChanges = true;
        break;
      }
    }
    
    // Only update if there are URL filters that differ from current state
    if (Object.keys(urlFilters).length > 0 && hasSignificantChanges) {
      // Update timestamp
      lastUrlUpdateTimeRef.current = now;
      
      // Update previous filters to avoid immediate fetch in the filters changed effect
      prevFiltersRef.current = { ...state.filters, ...urlFilters } as F;
      
      dispatch({
        type: 'UPDATE_FILTERS',
        payload: { filters: urlFilters, resetPage: false }
      });
    }
  }, [searchParams, syncWithUrl, urlFilterConfig, state.filters]);
  
  // Initial fetch when component mounts - but only once with error handling
  const initialFetchRef = useRef(false);
  const initialFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Prevent multiple initial fetches and check if we should fetch
    if (initialFetchRef.current || !autoFetch || !state.isInitialized || !isApiInitialized) {
      return;
    }
    
    // Mark as fetched immediately to prevent duplicate fetches
    initialFetchRef.current = true;
    
    // Use a timeout to avoid immediate fetch that might clash with other effects
    initialFetchTimeoutRef.current = setTimeout(() => {
      // Wrap in try/catch to prevent fetch errors from breaking the app
      try {
        fetchData();
      } catch (error) {
        console.error('Error during initial fetch:', error as Error);
        // Reset isLoading on error
        dispatch({ 
          type: 'FETCH_ERROR', 
          payload: { 
            error: error instanceof Error ? error.message : 'Failed to fetch data', 
            requestId: state.lastRequestId + 1 
          } 
        });
      }
      initialFetchTimeoutRef.current = null;
    }, 200);
    
    // Clean up timeout on unmount
    return () => {
      if (initialFetchTimeoutRef.current) {
        clearTimeout(initialFetchTimeoutRef.current);
        initialFetchTimeoutRef.current = null;
      }
    };
  }, [autoFetch, state.isInitialized, isApiInitialized, fetchData, state.lastRequestId, dispatch]);
  
  // Action creators with deep equality check
  const updateFilters = useCallback((newFilters: Partial<F>) => {
    // Immediate check to avoid dispatch if filters haven't changed
    if (Object.entries(newFilters).every(([key, value]) => {
      const currentValue = state.filters[key as keyof F];
      return isEqual(currentValue, value);
    })) {
      return;
    }
    
    dispatch({
      type: 'UPDATE_FILTERS',
      payload: { filters: newFilters, resetPage: resetPageOnFilterChange }
    });
  }, [resetPageOnFilterChange, state.filters]);
  
  const setFilters = useCallback((filters: F) => {
    // Skip if filters are identical
    if (isEqual(filters, state.filters)) {
      return;
    }
    
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, [state.filters]);
  
  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);
  
  const refetch = useCallback(async () => {
    // Reset fetch attempt counter on manual refetch
    fetchAttemptsRef.current = 0;
    await fetchData();
  }, [fetchData]);
  
  // Convenience methods
  const setPage = useCallback((page: number) => {
    // Skip if page hasn't changed
    if (page === state.filters.page) {
      return;
    }
    
    updateFilters({ page: page } as Partial<F>);
  }, [updateFilters, state.filters.page]);
  
  const setLimit = useCallback((limit: number) => {
    // Skip if limit hasn't changed
    if (limit === state.filters.limit) {
      return;
    }
    
    updateFilters({ limit: limit, page: 1 } as Partial<F>);
  }, [updateFilters, state.filters.limit]);
  
  const setSort = useCallback((field: keyof F | string, direction: 'asc' | 'desc') => {
    // Skip if sort hasn't changed
    if (field === state.filters.sortBy && direction === state.filters.sortDirection) {
      return;
    }
    
    updateFilters({
      sortBy: field as any,
      sortDirection: direction as any,
      page: 1
    } as Partial<F>);
  }, [updateFilters, state.filters.sortBy, state.filters.sortDirection]);
  
  const setSearch = useCallback((search: string) => {
    // Skip if search hasn't changed
    if ((search || '') === (state.filters.search || '')) {
      return;
    }
    
    updateFilters({
      search: search || undefined,
      page: 1
    } as Partial<F>);
  }, [updateFilters, state.filters.search]);
  
  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K] | undefined) => {
    // Skip if filter hasn't changed
    if (isEqual(state.filters[key], value)) {
      return;
    }
    
    updateFilters({ [key]: value } as Partial<F>);
  }, [updateFilters, state.filters]);
  
  const clearFilter = useCallback(<K extends keyof F>(key: K) => {
    // Skip if filter already cleared
    if (state.filters[key] === undefined) {
      return;
    }
    
    updateFilters({ [key]: undefined } as Partial<F>);
  }, [updateFilters, state.filters]);
  
  const clearAllFilters = useCallback(() => {
    // Preserve pagination and sorting
    const preservedFields = {
      page: state.filters.page,
      limit: state.filters.limit,
      sortBy: state.filters.sortBy,
      sortDirection: state.filters.sortDirection
    };
    
    // Check if any filters need clearing
    const hasFiltersToReset = Object.entries(state.filters).some(([key, value]) => {
      return !['page', 'limit', 'sortBy', 'sortDirection'].includes(key) && 
             value !== undefined;
    });
    
    if (!hasFiltersToReset) {
      return;
    }
    
    dispatch({ 
      type: 'RESET_FILTERS', 
      payload: preservedFields as Partial<F>
    });
  }, [state.filters]);
  
  // Create a method to update items directly
  const setItems = useCallback((newItems: T[]) => {
    dispatch({
      type: 'FETCH_SUCCESS',
      payload: { 
        items: newItems, 
        pagination: state.pagination,
        requestId: state.lastRequestId + 1 
      }
    });
  }, [state.pagination, state.lastRequestId]);

  return {
    // State
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    pagination: state.pagination,
    filters: state.filters,
    
    // Core actions
    updateFilters,
    setFilters,
    resetFilters,
    refetch,
    
    // Convenience methods
    setPage,
    setLimit,
    setSort,
    setSearch,
    
    // Filter helpers
    setFilter,
    clearFilter,
    clearAllFilters,
    
    // Item management
    setItems,
    
    // Internal
    dispatch
  };
}