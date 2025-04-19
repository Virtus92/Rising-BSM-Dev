'use client';

/**
 * Client-side API client for making HTTP requests
 * Uses cookies for authentication instead of localStorage
 * This is explicitly marked as a client component and should not be used directly in server components
 */
import { permissionErrorHandler, formatPermissionDeniedMessage } from '@/shared/utils/permission-error-handler';

// GLOBAL INITIALIZATION FLAG - outside the class to ensure it's truly a singleton across all imports
// This is critically important - React may import this file multiple times
let GLOBAL_API_INITIALIZED = false;
let GLOBAL_INIT_PROMISE: Promise<void> | null = null;
let GLOBAL_API_BASE_URL = '';
let GLOBAL_API_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

// Expose a window-level flag we can check for debugging
if (typeof window !== 'undefined') {
  (window as any).__API_CLIENT_INITIALIZED = false;
}
export interface ApiError {
  message: string;
  errors?: string[];
  statusCode?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  errors?: string[];
  statusCode?: number;
  errorType?: 'permission' | 'validation' | 'network' | 'unknown';
}

export class ApiClient {
  /**
   * Get the current base URL
   * @returns Current base URL
   */
  static getBaseUrl(): string {
    return GLOBAL_API_BASE_URL;
  }

  /**
   * Initialize the API client
   * @param config Configuration options
   */
  static initialize(config: { 
    baseUrl?: string; 
    headers?: Record<string, string>;
    autoRefreshToken?: boolean;
  } = {}): Promise<void> {
    // If already initialized with the same base URL, return immediately
    if (GLOBAL_API_INITIALIZED && GLOBAL_API_BASE_URL === (config.baseUrl || GLOBAL_API_BASE_URL)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ApiClient already initialized, reusing existing instance');
      }
      return Promise.resolve();
    }
    
    // Return existing promise if initialization is in progress
    if (GLOBAL_INIT_PROMISE) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ApiClient initialization already in progress, waiting...');
      }
      return GLOBAL_INIT_PROMISE;
    }
    
    // Create a new initialization promise
    GLOBAL_INIT_PROMISE = new Promise<void>((resolve) => {
      try {
        // Update configuration
        GLOBAL_API_BASE_URL = config.baseUrl || GLOBAL_API_BASE_URL;
        if (config.headers) {
          GLOBAL_API_HEADERS = { ...GLOBAL_API_HEADERS, ...config.headers };
        }
        
        // Mark as initialized - globally
        GLOBAL_API_INITIALIZED = true;
        
        // Update debug flag
        if (typeof window !== 'undefined') {
          (window as any).__API_CLIENT_INITIALIZED = true;
        }
        
        // Log only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('API Client initialized with base URL:', GLOBAL_API_BASE_URL);
        }
        
        // Initialize complete
        resolve();
      } catch (error) {
        console.error('API Client initialization error:', error);
        GLOBAL_API_INITIALIZED = false;
        if (typeof window !== 'undefined') {
          (window as any).__API_CLIENT_INITIALIZED = false;
        }
        resolve(); // Still resolve to prevent hanging promises
      } finally {
        // Clear the promise after completion - use a longer timeout to ensure all components have a chance to react
        setTimeout(() => {
          GLOBAL_INIT_PROMISE = null;
        }, 500);
      }
    });
    
    return GLOBAL_INIT_PROMISE;
  }

  /**
   * Set CSRF token for security
   * @param token CSRF token
   */
  static setCsrfToken(token: string) {
    GLOBAL_API_HEADERS['X-CSRF-Token'] = token;
  }

  /**
   * Generate request options with appropriate credentials
   * @param method HTTP method
   * @param data Request data
   * @returns Request options
   */
  private static getRequestOptions(method: string, data?: any): RequestInit {
    return {
      method,
      headers: GLOBAL_API_HEADERS,
      credentials: 'include', // Always include cookies for authentication
      body: data ? JSON.stringify(data) : undefined
    };
  }

  /**
   * Create a request URL with query parameters
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns URL with query parameters
   */
  static createUrl(endpoint: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return `${GLOBAL_API_BASE_URL}${endpoint}`;
    }
    
    const url = new URL(`${GLOBAL_API_BASE_URL}${endpoint}`, 
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array parameters
          value.forEach(item => url.searchParams.append(`${key}[]`, String(item)));
        } else if (typeof value === 'object' && value instanceof Date) {
          // Handle Date objects
          url.searchParams.append(key, value.toISOString());
        } else if (typeof value === 'object') {
          // Handle object parameters
          url.searchParams.append(key, JSON.stringify(value));
        } else {
          // Handle primitive values
          url.searchParams.append(key, String(value));
        }
      }
    });
    
    return url.toString().replace(
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost', '');
  }

  /**
   * Make a GET request
   * @param endpoint API endpoint
   * @param options Request options
   * @returns API response
   */
  static async get<T = any>(
    endpoint: string, 
    options: { params?: Record<string, any>; headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    // Check if initialized
    if (!GLOBAL_API_INITIALIZED) {
      console.warn('API Client not initialized on GET. Initializing with defaults...');
      // We'll initialize it with defaults, but log a warning
      await ApiClient.initialize();
    }

    try {
      // Process the parameters to remove undefined values to prevent URL issues
      const cleanParams = options.params ? Object.fromEntries(
        Object.entries(options.params)
          .filter(([_, value]) => value !== undefined && value !== null)
      ) : undefined;

      // Create URL with query parameters
      const url = cleanParams 
        ? this.createUrl(endpoint, cleanParams)
        : `${GLOBAL_API_BASE_URL}${endpoint}`;
      
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`API GET: ${url}`);
      }

      // Merge headers and other options
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: { ...GLOBAL_API_HEADERS, ...(options.headers || {}) },
        credentials: 'include', // Include cookies
        // Add cache control to prevent browser caching
        cache: 'no-cache',
      };

      // Detect notification endpoint for special handling and lists for better retry strategy
      const isNotificationEndpoint = endpoint.includes('/notifications');
      const isListEndpoint = endpoint.includes('?page=') || 
                             endpoint.includes('limit=') || 
                             endpoint.includes('pagination');
      
      // Configure retries based on endpoint type
      // - No retries for notifications
      // - Limited retries for list endpoints to prevent resource exhaustion
      // - Standard retries for other endpoints
      const maxRetries = isNotificationEndpoint ? 0 : (isListEndpoint ? 1 : 2);
      const retryDelay = isListEndpoint ? 1000 : 300; // Longer delay for list endpoints

      // Use retry logic with configurable retries
      return await this.retry<ApiResponse<T>>(async () => {
        // Add request timeout for better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
          const response = await fetch(url, {
            ...requestOptions,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          return this.handleResponse<T>(response);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }, maxRetries, retryDelay);
    } catch (error) {
      // Special handling for notification endpoint errors
      if (endpoint.includes('/notifications')) {
        console.warn('Notification endpoint error, preventing retry:', error);
        return {
          success: false,
          data: null,
          message: 'Failed to fetch notifications',
          statusCode: 500
        };
      }
      
      // Check if this is a list endpoint that's failing repeatedly
      if (endpoint.includes('?page=') || endpoint.includes('limit=')) {
        console.warn('List endpoint error, limiting retries:', endpoint);
      }
      
      return this.handleError<T>(error);
    }
  }

  /**
   * Make a POST request
   * @param endpoint API endpoint
   * @param data Request data
   * @param options Request options
   * @returns API response
   */
  static async post<T = any>(
    endpoint: string, 
    data?: any, 
    options: { headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    // No longer auto-initialize - rely on proper initialization

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`API POST: ${endpoint}`, { data });
      }

      // Merge headers
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: { ...GLOBAL_API_HEADERS, ...(options.headers || {}) },
        credentials: 'include', // Include cookies
        body: data ? JSON.stringify(data) : undefined,
      };

      const response = await fetch(`${GLOBAL_API_BASE_URL}${endpoint}`, requestOptions);

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Make a PUT request
   * @param endpoint API endpoint
   * @param data Request data
   * @param options Request options
   * @returns API response
   */
  static async put<T = any>(
    endpoint: string, 
    data: any, 
    options: { headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    // No longer auto-initialize - rely on proper initialization

    try {
      // Merge headers
      const requestOptions: RequestInit = {
        method: 'PUT',
        headers: { ...GLOBAL_API_HEADERS, ...(options.headers || {}) },
        credentials: 'include', // Include cookies
        body: JSON.stringify(data),
      };

      const response = await fetch(`${GLOBAL_API_BASE_URL}${endpoint}`, requestOptions);

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }
  
  /**
   * Make a PATCH request
   * @param endpoint API endpoint
   * @param data Request data
   * @param options Request options
   * @returns API response
   */
  static async patch<T = any>(
    endpoint: string, 
    data: any, 
    options: { headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    // No longer auto-initialize - rely on proper initialization

    try {
      // Merge headers
      const requestOptions: RequestInit = {
        method: 'PATCH',
        headers: { ...GLOBAL_API_HEADERS, ...(options.headers || {}) },
        credentials: 'include', // Include cookies
        body: JSON.stringify(data),
      };

      const response = await fetch(`${GLOBAL_API_BASE_URL}${endpoint}`, requestOptions);

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Make a DELETE request
   * @param endpoint API endpoint
   * @param options Request options
   * @returns API response
   */
  static async delete<T = any>(
    endpoint: string, 
    options: { headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    // No longer auto-initialize - rely on proper initialization

    try {
      // Merge headers
      const requestOptions: RequestInit = {
        method: 'DELETE',
        headers: { ...GLOBAL_API_HEADERS, ...(options.headers || {}) },
        credentials: 'include', // Include cookies
      };

      const response = await fetch(`${GLOBAL_API_BASE_URL}${endpoint}`, requestOptions);

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  /**
   * Handle permission errors
   * @param status HTTP status code
   * @param message Error message
   * @returns API response with permission error details
   */
  private static handlePermissionError<T>(status: number, message: string): ApiResponse<T> {
    // Use the permission error handler to format a friendly message
    const formattedMessage = formatPermissionDeniedMessage(message);
    
    // Format a user-friendly permission error message
    const permissionMessage = message?.includes('permission') 
      ? formattedMessage || message
      : 'You do not have permission to perform this action';
    
    // Log the permission error for debugging
    console.error('Permission error:', { status, message, formattedMessage });
    
    // Call the permission error handler to show appropriate UI feedback
    permissionErrorHandler.handle(permissionMessage);
    
    // Include error type for better client-side handling
    return {
      success: false,
      data: null as any,
      message: permissionMessage,
      errors: [permissionMessage],
      statusCode: status,
      errorType: 'permission'
    };
  }

  /**
   * Handle API response
   * @param response Fetch API response
   * @returns API response
   */
  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get('content-type');
      
      // Special handling for the login endpoint - don't treat redirects as errors
      // This prevents false-positive detection of redirects during login
      const isLoginRequest = response.url.includes('/api/auth/login');
      
      if (response.redirected && !isLoginRequest) {
        console.log('API response redirected, but not a login request');
        return {
          success: false,
          data: null as any,
          message: 'Session expired. Please log in again.',
          statusCode: 401
        };
      }
      
      // For development debugging
      if (process.env.NODE_ENV === 'development' && !response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`, {
          url: response.url,
          status: response.status,
          statusText: response.statusText,
        });
      }
      
      // Handle JSON responses
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        
        if (response.ok) {
          // Success with JSON response
          return {
            success: true,
            data: json.data || json,
            message: json.message,
            statusCode: response.status
          };
        } else {
          // Handle 401 (Unauthorized) - Session expired
          if (response.status === 401) {
            console.warn('API request returned 401 Unauthorized');
            
            // Try to refresh the token and retry the request if it's not already a refresh request
            if (!response.url.includes('/api/auth/refresh') && typeof window !== 'undefined') {
              try {
                // Import TokenManager dynamically to avoid circular dependencies
                const { ClientTokenManager } = await import('@/infrastructure/auth/ClientTokenManager');
                const refreshSuccess = await ClientTokenManager.refreshAccessToken();
                
                if (refreshSuccess) {
                  // Retry the original request after token refresh
                  console.log('Token refreshed successfully, retrying original request');
                  const retryResponse = await fetch(response.url, {
                    method: response.type,
                    headers: response.headers,
                    credentials: 'include',
                    body: response.bodyUsed ? undefined : await response.clone().text()
                  });
                  
                  return this.handleResponse<T>(retryResponse);
                }
              } catch (refreshError) {
                console.error('Failed to refresh token during 401 response', refreshError);
              }
            }
            
            // If refresh fails or we're already in a refresh request, redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
            }
          }
          
          // Check for permission errors (403 Forbidden)
          if (response.status === 403) {
            return this.handlePermissionError<T>(
              response.status, 
              json.message || json.error || response.statusText
            );
          }
          
          // Error with JSON details
          return {
            success: false,
            data: null as any,
            message: json.message || json.error || response.statusText,
            errors: json.errors || (json.message ? [json.message] : undefined),
            statusCode: response.status
          };
        }
      } else {
        // Handle text responses
        const text = await response.text();
        
        if (response.ok) {
          // Success with text response
          return {
            success: true,
            data: text as any,
            statusCode: response.status
          };
        } else {
          // Handle 401 (Unauthorized) - Session expired
          if (response.status === 401 && typeof window !== 'undefined') {
            // Try to refresh the token first
            try {
                // Import TokenManager dynamically to avoid circular dependencies
                const { ClientTokenManager } = await import('@/infrastructure/auth/ClientTokenManager');
                const refreshSuccess = await ClientTokenManager.refreshAccessToken();
              
              if (refreshSuccess) {
                // Retry the original request after token refresh
                console.log('Token refreshed successfully, retrying original request');
                const retryResponse = await fetch(response.url, {
                  method: response.type,
                  headers: response.headers,
                  credentials: 'include',
                  body: response.bodyUsed ? undefined : await response.clone().text()
                });
                
                return this.handleResponse<T>(retryResponse);
              }
            } catch (refreshError) {
              console.error('Failed to refresh token during 401 response', refreshError);
            }
            
            // If refresh fails, redirect to login page
            window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
          }
          
          // Check for permission errors (403 Forbidden)
          if (response.status === 403) {
            return this.handlePermissionError<T>(
              response.status, 
              text || response.statusText
            );
          }
          
          // Error with text details
          return {
            success: false,
            data: null as any,
            message: text || response.statusText,
            statusCode: response.status
          };
        }
      }
    } catch (error) {
      // For development debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error handling API response:', error);
      }
      return this.handleError<T>(error);
    }
  }

  /**
   * Handle error
   * @param error Error object
   * @returns API response with error details
   */
  private static handleError<T>(error: any): ApiResponse<T> {
    // Log errors only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    
    let errorMessage = 'Unknown error occurred';
    let errors: string[] | undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if ((error as any).errors) {
        errors = (error as any).errors;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      data: null,
      message: errorMessage,
      errors,
      statusCode: 500
    };
  }

  /**
   * Retry a failed request
   * @param fn Function to retry
   * @param retries Number of retries
   * @param delay Delay between retries in milliseconds
   * @returns Result of the function
   */
  private static async retry<T>(
    fn: () => Promise<T>, 
    retries: number = 3, 
    delay: number = 300
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Don't retry if we're out of retries
      if (retries <= 0) {
        throw error;
      }
      
      // Check for abort errors (e.g. timeouts) and network errors
      const isAbortError = error instanceof DOMException && error.name === 'AbortError';
      const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch';
      
      // Don't retry for programmatic aborts (timeouts) or certain kinds of client errors
      if (isAbortError) {
        console.warn('Request timed out, not retrying');
        throw new Error('Request timed out. Please try again later.');
      }
      
      // For network errors, check if navigator is online before retrying
      if (isNetworkError && typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('Network offline, not retrying');
        throw new Error('Network connection unavailable. Please check your internet connection.');
      }
      
      // Log retry attempt
      console.warn(`Retrying request (${retries} attempts left) after ${delay}ms delay`);
      
      // Wait for delay milliseconds
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with one fewer retry and longer delay
      return this.retry(fn, retries - 1, delay * 1.5);
    }
  }
}

/**
 * Custom error class for API request errors
 */
export class ApiRequestError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public errors: string[] = []
  ) {
    super(message);
    this.name = 'ApiRequestError';
    // This is needed to properly extend Error in TypeScript
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

export const apiClient = ApiClient;
export default ApiClient;