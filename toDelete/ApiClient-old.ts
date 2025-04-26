'use client';

/**
 * Client-side API client for making HTTP requests
 * Uses cookies for authentication instead of localStorage
 * This is explicitly marked as a client component and should not be used directly in server components
 */
import { permissionErrorHandler, formatPermissionDeniedMessage } from '@/shared/utils/permission-error-handler';
import { TokenManager } from '@/infrastructure/auth/TokenManager';
import { ClientTokenManager } from '@/infrastructure/auth/ClientTokenManager';

// GLOBAL INITIALIZATION FLAG - outside the class to ensure it's truly a singleton across all imports
// This is critically important - React may import this file multiple times
let GLOBAL_API_INITIALIZED = false;
let GLOBAL_INIT_PROMISE: Promise<void> | null = null;
let GLOBAL_API_BASE_URL = '/api'; // Set default API base URL
let GLOBAL_API_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

// Global request tracking to prevent duplicate calls and detect duplicate API instances
let GLOBAL_REQUEST_COUNT = 0;
let GLOBAL_REQUEST_HISTORY: Array<{url: string, method: string, timestamp: number}> = [];
const MAX_REQUEST_HISTORY = 20; // Only keep track of the last 20 requests

// Expose window-level flags we can check for debugging and synchronization
if (typeof window !== 'undefined') {
  // Initialize the global flag object if it doesn't exist
  if (!(window as any).__API_CLIENT_STATE) {
    (window as any).__API_CLIENT_STATE = {
      initialized: false,
      initPromise: null,
      lastInitTime: 0,
      pendingRequests: 0,
      requestCache: {},
      tokens: {
        lastSync: 0,
        hasAuth: false,
        hasRefresh: false
      }
    };
  }
}

// Add global error handler for uncaught API errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Only handle API-related errors
    if (event.reason && event.reason.message && 
        (event.reason.message.includes('API') || 
         event.reason.message.includes('fetch'))) {
      console.error('Unhandled API error:', event.reason);
    }
  });
  
  // Set up periodic cleanup to prevent memory leaks
  setInterval(() => {
    if ((window as any).__API_CLIENT_STATE) {
      // Clean up request cache older than 5 minutes
      const now = Date.now();
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      
      Object.keys((window as any).__API_CLIENT_STATE.requestCache || {}).forEach(key => {
        const entry = (window as any).__API_CLIENT_STATE.requestCache[key];
        if (entry && entry.timestamp && now - entry.timestamp > CACHE_TTL) {
          delete (window as any).__API_CLIENT_STATE.requestCache[key];
        }
      });
      
      // Trim request history if needed
      if (GLOBAL_REQUEST_HISTORY.length > MAX_REQUEST_HISTORY) {
        GLOBAL_REQUEST_HISTORY = GLOBAL_REQUEST_HISTORY.slice(-MAX_REQUEST_HISTORY);
      }
    }
  }, 60000); // Run every minute
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
    force?: boolean; // Added force option to reinitialize if needed
    source?: string; // Added source for tracking initialization origins
  } = {}): Promise<void> {
    // Access to global state for synchronization
    const globalState = typeof window !== 'undefined' ? (window as any).__API_CLIENT_STATE : null;
    const now = Date.now();
    
    // Rate limit initialization requests to prevent storms (unless forced)
    if (!config.force && globalState && now - globalState.lastInitTime < 2000) {
      console.log('ApiClient: Initialization throttled, reusing existing state');
      return globalState.initPromise || Promise.resolve();
    }
    
    // If already initialized with the same base URL, return immediately unless force=true
    if (!config.force && GLOBAL_API_INITIALIZED && GLOBAL_API_BASE_URL === (config.baseUrl || GLOBAL_API_BASE_URL)) {
      console.log('ApiClient: Already initialized, reusing existing instance');
      return Promise.resolve();
    }
    
    // Return existing promise if initialization is in progress
    if (GLOBAL_INIT_PROMISE && !config.force) {
      console.log('ApiClient: Initialization already in progress, waiting...');
      return GLOBAL_INIT_PROMISE;
    }
    
    // If forced, clear any existing promise
    if (config.force && GLOBAL_INIT_PROMISE) {
      console.log('ApiClient: Force reinitializing');
      GLOBAL_INIT_PROMISE = null;
    }
    
    // Update global state tracking
    if (globalState) {
      globalState.lastInitTime = now;
    }
    
    // Create a new initialization promise
    GLOBAL_INIT_PROMISE = new Promise<void>((resolve) => {
      try {
        // Update configuration
        GLOBAL_API_BASE_URL = config.baseUrl || GLOBAL_API_BASE_URL;
        if (config.headers) {
          GLOBAL_API_HEADERS = { ...GLOBAL_API_HEADERS, ...config.headers };
        }
        
        // Token synchronization in client environment
        const tokenPromise = typeof window !== 'undefined' && config.autoRefreshToken !== false
          ? TokenManager.synchronizeTokens(true).catch(err => {
              console.warn('Failed to synchronize tokens during API initialization:', err);
              return false;
            })
          : Promise.resolve(false);
        
        // Wait for token synchronization to complete
        tokenPromise.then(syncResult => {
          // Mark as initialized - globally
          GLOBAL_API_INITIALIZED = true;
          
          // Update window global state
          if (globalState) {
            globalState.initialized = true;
            globalState.initPromise = GLOBAL_INIT_PROMISE;
            
            // Update token status if the synchronization was performed
            if (syncResult !== false) {
              globalState.tokens.lastSync = Date.now();
              
              // Check cookies for token status
              if (typeof document !== 'undefined') {
                const cookies = document.cookie.split(';').map(c => c.trim());
                globalState.tokens.hasAuth = cookies.some(c => c.startsWith('auth_token='));
                globalState.tokens.hasRefresh = cookies.some(c => c.startsWith('refresh_token='));
              }
            }
          }
          
          // Log initialization status
          console.log('API Client initialized with base URL:', GLOBAL_API_BASE_URL);
          
          // Initialize complete
          resolve();
          
          // Clear the promise reference with a delay to avoid race conditions
          setTimeout(() => {
            if (GLOBAL_INIT_PROMISE === GLOBAL_INIT_PROMISE) {
              GLOBAL_INIT_PROMISE = null;
              
              if (globalState) {
                globalState.initPromise = null;
              }
            }
          }, 1000);
        });
      } catch (error) {
        console.error('API Client initialization error:', error);
        GLOBAL_API_INITIALIZED = false;
        
        if (globalState) {
          globalState.initialized = false;
          globalState.initPromise = null;
        }
        
        resolve(); // Still resolve to prevent hanging promises
      }
    });
    
    // Update the global promise reference
    if (globalState) {
      globalState.initPromise = GLOBAL_INIT_PROMISE;
    }
    
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
    // Normalize endpoint path
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    
    // Fix potential double /api/ prefix issue
    const normalizedEndpoint = endpoint.replace(/^\/api\/api\//g, '/api/');
    
    // If base URL already has '/api' and endpoint also starts with '/api', fix it
    let finalEndpoint = normalizedEndpoint;
    if (GLOBAL_API_BASE_URL.endsWith('/api') && normalizedEndpoint.startsWith('/api/')) {
      finalEndpoint = normalizedEndpoint.substring(4); // Remove leading '/api'
    }
    
    // If there are no params, return simple URL
    if (!params || Object.keys(params).length === 0) {
      return `${GLOBAL_API_BASE_URL}${finalEndpoint}`;
    }
    
    // Create URL with query parameters
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(`${GLOBAL_API_BASE_URL}${finalEndpoint}`, baseOrigin);
    
    // Process params for URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array parameters
          value.forEach(item => {
            if (item !== undefined && item !== null) {
              url.searchParams.append(`${key}[]`, String(item));
            }
          });
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
    
    // Remove origin from URL string
    return url.toString().replace(baseOrigin, '');
  }

  /**
   * Make a GET request
   * @param endpoint API endpoint
   * @param options Request options
   * @returns API response
   */
  static async get<T = any>(
    endpoint: string, 
    options: { 
      params?: Record<string, any>; 
      headers?: Record<string, string>;
      skipInitCheck?: boolean; // Skip initialization check for internal calls
      requestId?: string; // Optional request ID for tracking
      skipCache?: boolean; // Skip cache for this request
      cacheTime?: number; // Cache time in milliseconds (default: 30000 ms = 30 seconds)
    } = {}
  ): Promise<ApiResponse<T>> {
    // Generate request ID for tracking if not provided
    const requestId = options.requestId || `get-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Normalize the endpoint path and fix potential /api/api/ duplication
    endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    endpoint = endpoint.replace(/^\/api\/api\//g, '/api/');
    
    // Check if initialized - unless explicitly skipped
    if (!options.skipInitCheck && !GLOBAL_API_INITIALIZED) {
      console.warn(`API Client not initialized on GET to ${endpoint}. Initializing with defaults... (requestId: ${requestId})`);
      // We'll initialize it with defaults, but log a warning
      try {
        await ApiClient.initialize({
          source: `auto-init-get-${requestId}`,
          autoRefreshToken: true
        });
      } catch (initError) {
        console.error(`API Client initialization failed during GET (requestId: ${requestId}):`, initError);
        // Continue anyway - we'll try to make the request
      }
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
        console.log(`API GET: ${url}`, { initialized: GLOBAL_API_INITIALIZED });
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
    options: { 
      headers?: Record<string, string>;
      skipInitCheck?: boolean; // Skip initialization check for internal calls
      requestId?: string; // Optional request ID for tracking
    } = {}
  ): Promise<ApiResponse<T>> {
    // Generate request ID for tracking if not provided
    const requestId = options.requestId || `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Normalize the endpoint path and fix potential /api/api/ duplication
    endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    endpoint = endpoint.replace(/^\/api\/api\//g, '/api/');
    
    // Handle common API endpoint path issue
    if (GLOBAL_API_BASE_URL.endsWith('/api') && endpoint.startsWith('/api/')) {
      endpoint = endpoint.substring(4); // Remove duplicated '/api'
    }
    
    // Check if initialized - unless explicitly skipped
    if (!options.skipInitCheck && !GLOBAL_API_INITIALIZED) {
      console.warn(`API Client not initialized on POST to ${endpoint}. Initializing with defaults... (requestId: ${requestId})`);
      // We'll initialize it with defaults, but log a warning
      try {
        await ApiClient.initialize({
          source: `auto-init-post-${requestId}`,
          autoRefreshToken: true
        });
      } catch (initError) {
        console.error(`API Client initialization failed during POST (requestId: ${requestId}):`, initError);
        // Continue anyway - we'll try to make the request
      }
    }

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
    options: { 
      headers?: Record<string, string>;
      skipInitCheck?: boolean; // Skip initialization check for internal calls
      requestId?: string; // Optional request ID for tracking
    } = {}
  ): Promise<ApiResponse<T>> {
    // Generate request ID for tracking if not provided
    const requestId = options.requestId || `put-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Normalize the endpoint path and fix potential /api/api/ duplication
    endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    endpoint = endpoint.replace(/^\/api\/api\//g, '/api/');
    
    // Handle common API endpoint path issue
    if (GLOBAL_API_BASE_URL.endsWith('/api') && endpoint.startsWith('/api/')) {
      endpoint = endpoint.substring(4); // Remove duplicated '/api'
    }
    
    // Check if initialized - unless explicitly skipped
    if (!options.skipInitCheck && !GLOBAL_API_INITIALIZED) {
      console.warn(`API Client not initialized on PUT to ${endpoint}. Initializing with defaults... (requestId: ${requestId})`);
      try {
        await ApiClient.initialize({
          source: `auto-init-put-${requestId}`,
          autoRefreshToken: true
        });
      } catch (initError) {
        console.error(`API Client initialization failed during PUT (requestId: ${requestId}):`, initError);
        // Continue anyway - we'll try to make the request
      }
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`API PUT: ${endpoint}`, { data });
      }

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
    options: { 
      headers?: Record<string, string>;
      skipInitCheck?: boolean; // Skip initialization check for internal calls
      requestId?: string; // Optional request ID for tracking
    } = {}
  ): Promise<ApiResponse<T>> {
    // Generate request ID for tracking if not provided
    const requestId = options.requestId || `patch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Normalize the endpoint path and fix potential /api/api/ duplication
    endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    endpoint = endpoint.replace(/^\/api\/api\//g, '/api/');
    
    // Handle common API endpoint path issue
    if (GLOBAL_API_BASE_URL.endsWith('/api') && endpoint.startsWith('/api/')) {
      endpoint = endpoint.substring(4); // Remove duplicated '/api'
    }
    
    // Check if initialized - unless explicitly skipped
    if (!options.skipInitCheck && !GLOBAL_API_INITIALIZED) {
      console.warn(`API Client not initialized on PATCH to ${endpoint}. Initializing with defaults... (requestId: ${requestId})`);
      try {
        await ApiClient.initialize({
          source: `auto-init-patch-${requestId}`,
          autoRefreshToken: true
        });
      } catch (initError) {
        console.error(`API Client initialization failed during PATCH (requestId: ${requestId}):`, initError);
        // Continue anyway - we'll try to make the request
      }
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`API PATCH: ${endpoint}`, { data });
      }

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
    options: { 
      headers?: Record<string, string>;
      skipInitCheck?: boolean; // Skip initialization check for internal calls
      requestId?: string; // Optional request ID for tracking
    } = {}
  ): Promise<ApiResponse<T>> {
    // Generate request ID for tracking if not provided
    const requestId = options.requestId || `delete-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Normalize the endpoint path and fix potential /api/api/ duplication
    endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    endpoint = endpoint.replace(/^\/api\/api\//g, '/api/');
    
    // Handle common API endpoint path issue
    if (GLOBAL_API_BASE_URL.endsWith('/api') && endpoint.startsWith('/api/')) {
      endpoint = endpoint.substring(4); // Remove duplicated '/api'
    }
    
    // Check if initialized - unless explicitly skipped
    if (!options.skipInitCheck && !GLOBAL_API_INITIALIZED) {
      console.warn(`API Client not initialized on DELETE to ${endpoint}. Initializing with defaults... (requestId: ${requestId})`);
      try {
        await ApiClient.initialize({
          source: `auto-init-delete-${requestId}`,
          autoRefreshToken: true
        });
      } catch (initError) {
        console.error(`API Client initialization failed during DELETE (requestId: ${requestId}):`, initError);
        // Continue anyway - we'll try to make the request
      }
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`API DELETE: ${endpoint}`);
      }

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
      const isRefreshRequest = response.url.includes('/api/auth/refresh');
      
      // Store the original response URL to handle retries correctly
      const originalUrl = response.url;
      
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
      
      // Create a function to handle 401 (unauthorized) responses that can be reused
      const handle401Response = async (): Promise<ApiResponse<T> | null> => {
        console.warn('API request returned 401 Unauthorized');
        
        // Skip token refresh for auth-related endpoints to prevent infinite loops
        const skipTokenRefresh = isRefreshRequest || 
        isLoginRequest || 
        originalUrl.includes('/api/auth/validate') ||
        originalUrl.includes('/api/auth/logout') ||
                                originalUrl.includes('/auth/refresh');
        
        if (!skipTokenRefresh && typeof window !== 'undefined') {
          try {
            // Use the imported ClientTokenManager
            const refreshSuccess = await ClientTokenManager.refreshAccessToken();
            
            if (refreshSuccess) {
              // Retry the original request after token refresh with explicit headers
              console.log('Token refreshed successfully, retrying original request:', originalUrl);
              
              // Build proper headers for retry
              const retryHeaders = new Headers(response.headers);
              
              // Get the refreshed token
              const newToken = ClientTokenManager.getAccessToken();
              if (newToken) {
                retryHeaders.set('Authorization', `Bearer ${newToken}`);
              }
              
              // Set proper content-type if needed
              if (!retryHeaders.has('Content-Type')) {
                retryHeaders.set('Content-Type', 'application/json');
              }
              
              // Set cache control to prevent caching issues
              retryHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
              
              try {
                // Get the request body if available
                let requestBody: string | undefined = undefined;
                if (!response.bodyUsed) {
                  try {
                    requestBody = await response.clone().text();
                  } catch (bodyError) {
                    console.warn('Could not clone response body for retry');
                  }
                }
                
                const retryResponse = await fetch(originalUrl, {
                  method: response.type || 'GET',
                  headers: retryHeaders,
                  credentials: 'include',
                  body: requestBody
                });
                
                // Process the retry response
                return await this.handleResponse<T>(retryResponse);
              } catch (retryError) {
                console.error('Failed to retry request after token refresh:', retryError);
              }
            }
          } catch (refreshError) {
            console.error('Failed to refresh token during 401 response:', refreshError);
          }
          
          // If token refresh or retry failed, redirect to login
          if (typeof window !== 'undefined' && !skipTokenRefresh) {
            console.log('Token refresh failed or request retry failed, redirecting to login');
            // Use a timeout to allow the current code to complete
            setTimeout(() => {
              window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
            }, 100);
          }
        }
        
        return null;
      };
      
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
          // Check if we're in an authentication flow already
          const isAuthEndpoint = originalUrl.includes('/api/auth/');
          
          // Avoid token refresh loops in authentication endpoints
          if (!isAuthEndpoint) {
          console.log('401 response for non-auth endpoint, attempting token refresh');
          const refreshResult = await handle401Response();
          if (refreshResult) return refreshResult;
          } else {
          console.log('401 response in auth endpoint, skipping token refresh');
          }
            
        // If refresh handler didn't return a response or this is an auth endpoint, return standard 401 response
        return {
          success: false,
          data: null as any,
          message: json.message || json.error || 'Authentication required',
          statusCode: 401,
          errorType: 'network'
        };
      }
          
          // Check for permission errors (403 Forbidden)
          if (response.status === 403) {
            // Check for specific error types in the response
            const isPermissionError = 
              (json.message && json.message.toLowerCase().includes('permission')) ||
              (json.error && json.error.toLowerCase().includes('permission')) ||
              (json.errorType && json.errorType === 'permission');
              
            if (isPermissionError) {
              return this.handlePermissionError<T>(
                response.status, 
                json.message || json.error || response.statusText
              );
            } else {
              // Generic 403 without specific permission message
              return {
                success: false,
                data: null as any,
                message: json.message || json.error || 'Access denied',
                statusCode: 403,
                errorType: 'permission'
              };
            }
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
          if (response.status === 401) {
            const refreshResult = await handle401Response();
            if (refreshResult) return refreshResult;
            
            // If refresh handler didn't return a response, return standard 401 response
            return {
              success: false,
              data: null as any,
              message: text || 'Authentication required',
              statusCode: 401,
              errorType: 'network'
            };
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
  private static handleError<T>(error: any, requestInfo?: { endpoint?: string; method?: string; requestId?: string }): ApiResponse<T> {
    // More structured error handling with request information
    const requestId = requestInfo?.requestId || `error-${Date.now()}`;
    const endpoint = requestInfo?.endpoint || 'unknown';
    const method = requestInfo?.method || 'unknown';
    
    // Log errors with proper context
    console.error(`API Error (${method} ${endpoint}, requestId: ${requestId}):`, error);
    
    let errorMessage = 'Unknown error occurred';
    let errorType: 'network' | 'validation' | 'permission' | 'unknown' = 'unknown';
    let errors: string[] | undefined;
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Extract additional error information if available
      if ((error as any).errors) {
        errors = (error as any).errors;
      }
      
      if ((error as any).statusCode) {
        statusCode = (error as any).statusCode;
      }
      
      // Determine error type from message
      if (error.message.includes('network') || error.message.includes('fetch') || 
          error.message.includes('abort') || error.message.includes('timeout')) {
        errorType = 'network';
      } else if (error.message.includes('permission') || error.message.includes('forbidden') || 
                error.message.includes('unauthorized') || error.message.includes('not allowed')) {
        errorType = 'permission';
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        errorType = 'validation';
      }
      
      // Special handling for network errors
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = 'Network connection error. Please check your internet connection.';
        errorType = 'network';
      }
      
      // Special handling for timeout errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again later.';
        errorType = 'network';
        statusCode = 408; // Request Timeout
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && error.message) {
      errorMessage = error.message;
      
      // Try to extract status code if available
      if (error.status || error.statusCode) {
        statusCode = error.status || error.statusCode;
      }
      
      // Try to extract errors array if available
      if (error.errors) {
        errors = error.errors;
      }
    }
    
    // Check for offline status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      errorMessage = 'You are currently offline. Please check your internet connection.';
      errorType = 'network';
      statusCode = 0; // Special status code for offline
    }
    
    return {
      success: false,
      data: null,
      message: errorMessage,
      errors,
      statusCode,
      errorType
    };
  }

  /**
   * Retry a failed request
   * @param fn Function to retry
   * @param retries Number of retries
   * @param delay Delay between retries in milliseconds
   * @returns Result of the function
   */
  /**
   * Retry a request function with exponential backoff
   * 
   * @param fn Function to retry
   * @param retries Number of retries
   * @param delay Base delay in milliseconds
   * @param opts Additional options
   * @returns Promise with the result
   */
  private static async retry<T>(
    fn: () => Promise<T>, 
    retries: number = 3, 
    delay: number = 300,
    opts: {
      isAuthRequest?: boolean;
      requestId?: string;
      isTokenRefresh?: boolean;
    } = {}
  ): Promise<T> {
    try {
      // Track pending request
      if (typeof window !== 'undefined' && (window as any).__API_CLIENT_STATE) {
        (window as any).__API_CLIENT_STATE.pendingRequests++;
      }
      
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
      
      // Special handling for token refresh to prevent cascading auth failures
      if (opts.isTokenRefresh && isNetworkError) {
        console.warn('Token refresh network error, waiting longer before retry');
        // Use a longer delay for token refresh requests
        delay = delay * 2;
      }
      
      // For auth requests, check if API is initialized
      if (opts.isAuthRequest && !GLOBAL_API_INITIALIZED) {
        console.warn('API not initialized during auth request, initializing before retry');
        // Initialize API before retrying
        await ApiClient.initialize({ force: true });
      }
      
      // Log retry attempt
      console.warn(`Retrying request ${opts.requestId ? `(${opts.requestId})` : ''} - ${retries} attempts left after ${delay}ms delay`);
      
      // Wait for delay milliseconds
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with one fewer retry and longer delay (exponential backoff)
      return this.retry(fn, retries - 1, delay * 1.5, opts);
    } finally {
      // Track pending request completion
      if (typeof window !== 'undefined' && (window as any).__API_CLIENT_STATE) {
        (window as any).__API_CLIENT_STATE.pendingRequests = 
          Math.max(0, ((window as any).__API_CLIENT_STATE.pendingRequests || 0) - 1);
      }
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