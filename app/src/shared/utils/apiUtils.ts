/**
 * Utility functions for API interactions
 */
import { ApiResponse } from '@/infrastructure/clients/ApiClient';

/**
 * Process API response to extract data and handle errors consistently
 * @param responsePromise Promise returning an API response
 * @param options Processing options
 * @returns Processed data from the API response
 */
export async function processApiResponse<T>(
  responsePromise: Promise<ApiResponse<T>>,
  options: { context?: string } = {}
): Promise<T> {
  try {
    const response = await responsePromise;
    
    if (!response.success) {
      // Handle specific error types
      const error = new Error(response.message || 'API request failed');
      (error as any).statusCode = response.statusCode;
      (error as any).errors = response.errors;
      (error as any).errorType = response.errorType;
      (error as any).context = options.context;
      throw error;
    }
    
    // For successful responses, ensure we have data
    if (response.data === undefined || response.data === null) {
      console.warn(`API response missing data for ${options.context || 'unknown context'}`);
      
      // Return appropriate empty values based on context
      if (options.context?.includes('count')) {
        return 0 as unknown as T;
      } else if (options.context?.includes('stats')) {
        return [] as unknown as T;
      }
      
      // Default empty response based on expected type
      return (Array.isArray(response.data) ? [] : {}) as unknown as T;
    }
    
    return response.data;
  } catch (error) {
    console.error(`API error in ${options.context || 'unknown context'}:`, error);
    throw error;
  }
}

/**
 * Safe fetch utility that handles errors and returns fallback data when needed
 * @param url The URL to fetch
 * @param options Fetch options
 * @param fallbackData Default data to return on error
 * @returns A promise resolving to the response data or fallback
 */
export async function safeFetch<T>(
  url: string, 
  options?: RequestInit,
  fallbackData?: T
): Promise<T> {
  try {
    // Add basic headers and credentials
    const fetchOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        ...options?.headers,
      }
    };
    
    // Add auth token from localStorage as a backup if available
    if (typeof localStorage !== 'undefined') {
      const authToken = localStorage.getItem('auth_token_backup');
      if (authToken) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${authToken}`
        };
      }
    }
    
    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle successful responses
    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    }
    
    // Handle 404 errors with empty arrays or objects
    if (response.status === 404) {
      console.warn(`API endpoint not found: ${url}`);
      if (Array.isArray(fallbackData)) {
        return [] as unknown as T;
      } else if (fallbackData !== undefined) {
        return fallbackData;
      } else {
        return {} as T;
      }
    }
    
    // Handle 401/403 errors - user might need to relogin
    if (response.status === 401 || response.status === 403) {
      console.error(`Authentication error (${response.status}): ${url}`);
      // You might want to redirect to login or refresh token here
      // For now, just return fallback data
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      
      throw new Error(`Authentication error: ${response.status}`);
    }
    
    // Handle other errors
    console.error(`API error (${response.status}): ${url}`);
    const errorText = await response.text();
    console.error('Response:', errorText);
    
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    
    throw new Error(`API error (${response.status}): ${errorText}`);
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    
    throw error;
  }
}

/**
 * Create a safe API hook that handles errors and provides fallback data
 * @param fetchFn The fetch function to wrap
 * @param fallbackData Default data to return on error
 * @returns A function that safely fetches data
 */
export function createSafeApiFetcher<T, A extends any[]>(
  fetchFn: (...args: A) => Promise<T>,
  fallbackData: T
) {
  return async (...args: A): Promise<T> => {
    try {
      return await fetchFn(...args);
    } catch (error) {
      console.error('API fetch error:', error);
      return fallbackData;
    }
  };
}

/**
 * Safely parse a count from an API response
 * @param data The data returned from an API
 * @param fallback Fallback count if data is invalid
 * @returns A number representing the count
 */
export function safeParseCount(data: any, fallback = 0): number {
  if (!data) return fallback;
  
  if (typeof data === 'number') {
    return data;
  }
  
  if (typeof data === 'string') {
    const parsed = parseInt(data, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  
  if (typeof data === 'object') {
    // Try common response formats
    if (data.count !== undefined) return safeParseCount(data.count, fallback);
    if (data.total !== undefined) return safeParseCount(data.total, fallback);
    
    // API response with nested data property
    if (data.data !== undefined) {
      // If data.data is a number, use it directly
      if (typeof data.data === 'number') {
        return data.data;
      }
      
      // If data.data is an object with count property
      if (typeof data.data === 'object' && data.data !== null) {
        if (data.data.count !== undefined) {
          return safeParseCount(data.data.count, fallback);
        }
        if (data.data.total !== undefined) {
          return safeParseCount(data.data.total, fallback);
        }
      }
      
      // If data.data is an array, return its length
      if (Array.isArray(data.data)) {
        return data.data.length;
      }
    }
    
    // Check for pagination data structure
    if (data.pagination && typeof data.pagination === 'object') {
      if (data.pagination.total !== undefined) {
        return safeParseCount(data.pagination.total, fallback);
      }
    }
    
    // Check for array length
    if (Array.isArray(data)) {
      return data.length;
    }
  }
  
  return fallback;
}
