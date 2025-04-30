'use client';

/**
 * Client-side API client for making HTTP requests
 * Uses cookies for authentication instead of localStorage
 * This is explicitly marked as a client component and should not be used directly in server components
 */
import { permissionErrorHandler, formatPermissionDeniedMessage } from '@/shared/utils/permission-error-handler';
// Only import ClientTokenManager - avoid importing TokenManager directly
import { ClientTokenManager } from '@/features/auth/lib/clients/token/ClientTokenManager';
import { getItem } from '@/shared/utils/storage/cookieStorage';

// GLOBAL INITIALIZATION FLAG - outside the class to ensure it's truly a singleton across all imports
// This is critically important - React may import this file multiple times
let GLOBAL_API_INITIALIZED = false;
let GLOBAL_INIT_PROMISE: Promise<void> | null = null;
let GLOBAL_API_BASE_URL = '/api'; // Set default API base URL
let GLOBAL_API_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' };

// Global request tracking for diagnostic purposes only
let GLOBAL_REQUEST_COUNT = 0;
let GLOBAL_REQUEST_HISTORY: Array<{url: string, method: string, timestamp: number, error?: Error}> = [];
const MAX_REQUEST_HISTORY = 50; // Keep track of more requests for debugging

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
          ? ClientTokenManager.refreshAccessToken().catch((err: Error) => {
              console.warn('Error refreshing token during API initialization:', err);
              return false;
            })
          : Promise.resolve(false);
        
        // Wait for token synchronization to complete
        tokenPromise.then((syncResult: boolean | unknown) => {
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
        console.error('API Client initialization error:', error as Error);
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
    // Get auth token for every request by default
    let headersToUse = {...GLOBAL_API_HEADERS};
    
    // Always include auth token by default for all requests
    try {
      const authToken = getItem('auth_token_backup') || getItem('auth_token');
      if (authToken) {
        headersToUse['Authorization'] = `Bearer ${authToken}`;
        headersToUse['X-Auth-Token'] = authToken;
      }
    } catch (tokenError) {
      console.warn('Error getting auth token for request:', tokenError);
    }
    
    return {
      method,
      headers: headersToUse,
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
      includeAuthToken?: boolean; // Whether to explicitly include auth token in headers
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
      const headersToUse = { ...GLOBAL_API_HEADERS, ...(options.headers || {}) };
      
      // Explicitly include auth token if requested or for permission/user endpoints
      if (options.includeAuthToken !== false && 
          (endpoint.includes('/permissions') || endpoint.includes('/users') || options.includeAuthToken)) {
        try {
          // Get token from localStorage
          const authToken = getItem('auth_token_backup') || getItem('auth_token');
          if (authToken) {
            headersToUse['Authorization'] = `Bearer ${authToken}`;
            headersToUse['X-Auth-Token'] = authToken;
          } else {
            console.warn(`No auth token available for request to ${endpoint}`);
          }
        } catch (tokenError) {
          console.warn(`Error getting auth token for request to ${endpoint}:`, tokenError);
        }
      }
      
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: headersToUse,
        credentials: 'include', // Include cookies
        // Add cache control to prevent browser caching
        cache: 'no-cache',
      };

      // Use direct request execution - no retries
      return await this.executeRequest<ApiResponse<T>>(
        async () => {
          // Create a stable controller that won't be garbage collected during the request
          const controller = new AbortController();
          let timeoutId: any = null;
          
          try {
            // Set timeout with safety checks
            if (typeof window !== 'undefined') {
              timeoutId = window.setTimeout(() => {
                try {
                  // Only abort if the controller is still valid
                  if (controller && controller.signal && !controller.signal.aborted) {
                    controller.abort(new DOMException('Request timed out', 'TimeoutError'));
                  }
                } catch (abortError) {
                  console.error('Error during abort:', abortError);
                }
              }, 30000); // Increase timeout to 30 seconds for more reliability
            }
            
            // Make the request with the signal
            const response = await fetch(url, {
              ...requestOptions,
              signal: controller.signal
            });
            
            // Clear timeout once response received
            if (timeoutId !== null && typeof window !== 'undefined') {
              window.clearTimeout(timeoutId);
              timeoutId = null;
            }
            
            // Process the response
            return this.handleResponse<T>(response, { endpoint, requestId });
          } catch (error) {
            // Always clear timeout to prevent memory leaks
            if (timeoutId !== null && typeof window !== 'undefined') {
              window.clearTimeout(timeoutId);
              timeoutId = null;
            }
            
            // Handle abort errors with better messaging
            if (error instanceof DOMException && error.name === 'AbortError') {
              if (error.message === 'Request timed out') {
                throw new Error(`Request to ${endpoint} timed out after 30 seconds`);
              } else {
                throw new Error(`Request to ${endpoint} was aborted: ${error.message}`);
              }
            }
            
            // Re-throw other errors
            throw error;
          }
        },
        { endpoint, method: 'GET', requestId, error: null}
      );
    } catch (error) {
      // Log the error but don't handle it specially - just rethrow
      console.error(`GET request failed for ${endpoint}:`, error);
      
      // Return formatted error response instead of throwing
      return this.handleError<T>(error, { endpoint, method: 'GET', requestId });
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
      includeAuthToken?: boolean; // Whether to explicitly include auth token in headers
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
      const headersToUse = { ...GLOBAL_API_HEADERS, ...(options.headers || {}) };
      
      // Explicitly include auth token if requested or for permission/user endpoints
      if (options.includeAuthToken !== false && 
          (endpoint.includes('/permissions') || endpoint.includes('/users') || options.includeAuthToken)) {
        try {
          // Get token from localStorage
          const authToken = getItem('auth_token_backup') || getItem('auth_token');
          if (authToken) {
            headersToUse['Authorization'] = `Bearer ${authToken}`;
            headersToUse['X-Auth-Token'] = authToken;
          } else {
            console.warn(`No auth token available for request to ${endpoint}`);
          }
        } catch (tokenError) {
          console.warn(`Error getting auth token for request to ${endpoint}:`, tokenError);
        }
      }
      
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: headersToUse,
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
      includeAuthToken?: boolean; // Whether to explicitly include auth token in headers
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
      const headersToUse = { ...GLOBAL_API_HEADERS, ...(options.headers || {}) };
      
      // Explicitly include auth token if requested or for permission/user endpoints
      if (options.includeAuthToken !== false && 
          (endpoint.includes('/permissions') || endpoint.includes('/users') || options.includeAuthToken)) {
        try {
          // Get token from localStorage
          const authToken = getItem('auth_token_backup') || getItem('auth_token');
          if (authToken) {
            headersToUse['Authorization'] = `Bearer ${authToken}`;
            headersToUse['X-Auth-Token'] = authToken;
          } else {
            console.warn(`No auth token available for request to ${endpoint}`);
          }
        } catch (tokenError) {
          console.warn(`Error getting auth token for request to ${endpoint}:`, tokenError);
        }
      }
      
      const requestOptions: RequestInit = {
        method: 'PUT',
        headers: headersToUse,
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
      includeAuthToken?: boolean; // Whether to explicitly include auth token in headers
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
      const headersToUse = { ...GLOBAL_API_HEADERS, ...(options.headers || {}) };
      
      // Explicitly include auth token if requested or for permission/user endpoints
      if (options.includeAuthToken !== false && 
          (endpoint.includes('/permissions') || endpoint.includes('/users') || options.includeAuthToken)) {
        try {
          // Get token from localStorage
          const authToken = getItem('auth_token_backup') || getItem('auth_token');
          if (authToken) {
            headersToUse['Authorization'] = `Bearer ${authToken}`;
            headersToUse['X-Auth-Token'] = authToken;
          } else {
            console.warn(`No auth token available for request to ${endpoint}`);
          }
        } catch (tokenError) {
          console.warn(`Error getting auth token for request to ${endpoint}:`, tokenError);
        }
      }
      
      const requestOptions: RequestInit = {
        method: 'PATCH',
        headers: headersToUse,
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
      includeAuthToken?: boolean; // Whether to explicitly include auth token in headers
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
      const headersToUse = { ...GLOBAL_API_HEADERS, ...(options.headers || {}) };
      
      // Explicitly include auth token if requested or for permission/user endpoints
      if (options.includeAuthToken !== false && 
          (endpoint.includes('/permissions') || endpoint.includes('/users') || options.includeAuthToken)) {
        try {
          // Get token from localStorage
          const authToken = getItem('auth_token_backup') || getItem('auth_token');
          if (authToken) {
            headersToUse['Authorization'] = `Bearer ${authToken}`;
            headersToUse['X-Auth-Token'] = authToken;
          } else {
            console.warn(`No auth token available for request to ${endpoint}`);
          }
        } catch (tokenError) {
          console.warn(`Error getting auth token for request to ${endpoint}:`, tokenError);
        }
      }
      
      const requestOptions: RequestInit = {
        method: 'DELETE',
        headers: headersToUse,
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
   * Handle API response - directly expose all errors
   * @param response Fetch API response
   * @param requestInfo Request information for better error messages
   * @returns API response
   * @throws Detailed errors for all API issues
   */
  private static async handleResponse<T>(
    response: Response, 
    requestInfo?: { endpoint?: string; method?: string; requestId?: string }
  ): Promise<ApiResponse<T>> {
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
      
      // No 401 auto-handling - let errors propagate directly
      
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
          // Handle 401 (Unauthorized) - No automatic refresh or handling
          if (response.status === 401) {
          const errorDetails = {
          url: originalUrl,
          isAuthEndpoint: originalUrl.includes('/api/auth/'),
          responseMessage: json.message || json.error,
            requestId: requestInfo?.requestId,
            requestEndpoint: requestInfo?.endpoint
          };
          
          console.error('401 Unauthorized error detected:', errorDetails);
          
          // Create a detailed error with all information
          const error = new ApiRequestError(
              `Authentication error (401): ${json.message || json.error || 'Unauthorized'}`,
          401,
          json.errors || []
        );
        
        // Add request details to the error
        (error as any).requestDetails = errorDetails;
        (error as any).responseData = json;
        
        // Throw directly - no refresh attempt
        throw error;
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
          // Handle 401 (Unauthorized) - No automatic handling
          if (response.status === 401) {
            const errorDetails = {
              url: response.url,
              isAuthEndpoint: response.url.includes('/api/auth/'),
              statusText: response.statusText,
              responseText: text,
              requestId: requestInfo?.requestId,
              requestEndpoint: requestInfo?.endpoint
            };
            
            console.error('401 Unauthorized error detected (text response):', errorDetails);
            
            // Create detailed error
            const error = new ApiRequestError(
              `Authentication error (401): ${text || response.statusText || 'Unauthorized'}`,
              401,
              []
            );
            
            // Add request details to the error
            (error as any).requestDetails = errorDetails;
            
            // Throw directly - no refresh attempt
            throw error;
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
    } catch (error: unknown) {
    // For development debugging
    if (process.env.NODE_ENV === 'development') {
    console.error('Error handling API response:', error as Error);
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
    console.error(`API Error (${method} ${endpoint}, requestId: ${requestId}):`, error as Error);
    
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
   * Execute function without any retries to expose raw errors
   * 
   * @param fn Function to execute
   * @returns Promise with the raw result or error
   */
  /**
   * Execute API request without any retries
   * This method exposes all errors directly for proper debugging
   * 
   * @param fn Function to execute the API request
   * @param requestInfo Request information for tracking
   * @returns Promise with the direct result
   * @throws Original errors without any handling
   */
  private static async executeRequest<T>(
    fn: () => Promise<T>,
    requestInfo: { endpoint: string; method: string; requestId: string; error: any }
  ): Promise<T> {
    // Track pending request for analytics only
    if (typeof window !== 'undefined' && (window as any).__API_CLIENT_STATE) {
      (window as any).__API_CLIENT_STATE.pendingRequests++;
    }
    
    // Add to request history for diagnostics
    const historyEntry = {
      url: requestInfo.endpoint,
      method: requestInfo.method,
      error: requestInfo.error,
      timestamp: Date.now()
    };
    GLOBAL_REQUEST_HISTORY.push(historyEntry);
    
    try {
      // Execute function directly - no retry logic
      const result = await fn();
      return result;
    } catch (error) {
      // Add error to history entry for diagnostics
      historyEntry.error = error instanceof Error ? error : new Error(String(error));
      
      // Log detailed error information
      console.error(`API request failed [${requestInfo.method} ${requestInfo.endpoint}]:`, {
        requestId: requestInfo.requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Throw the original error directly - no swallowing
      throw error;
    } finally {
      // Track pending request completion
      if (typeof window !== 'undefined' && (window as any).__API_CLIENT_STATE) {
        (window as any).__API_CLIENT_STATE.pendingRequests = 
          Math.max(0, ((window as any).__API_CLIENT_STATE.pendingRequests || 0) - 1);
      }
      
      // Trim request history if needed
      if (GLOBAL_REQUEST_HISTORY.length > MAX_REQUEST_HISTORY) {
        GLOBAL_REQUEST_HISTORY = GLOBAL_REQUEST_HISTORY.slice(-MAX_REQUEST_HISTORY);
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
/**
 * Function stub kept for reference - disabled
 * This function has been disabled to expose all authentication errors directly
 * We no longer attempt to automatically refresh tokens when 401 errors occur
 */
async function disabledHandle401Response<T>(): Promise<ApiResponse<T> | undefined> {
  // This function is intentionally disabled to force proper error handling
  console.error('Token refresh on 401 has been disabled to expose authentication errors');
  return undefined;
}
