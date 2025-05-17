'use client';

/**
 * ApiClient.ts
 * 
 * Complete rewrite to fix authentication and token handling issues.
 * This implementation eliminates all workarounds and properly handles
 * API requests with clean error boundaries and token management.
 */

import { getLogger } from '@/core/logging';
import AuthService from '@/features/auth/core/AuthService';
import { TokenManager } from '@/core/initialization';

// Logger
const logger = getLogger();

// Types
export interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  withAuth?: boolean;
  signal?: AbortSignal;
  cache?: RequestCache;
  retry?: number;
}

export interface ApiResponse<T = any> {
  /**
   * Whether the request was successful
   */
  success: boolean;
  
  /**
   * Response data (only present on success)
   */
  data: T | null;
  
  /**
   * Error information (only present on failure)
   */
  error: string | null;
  
  /**
   * HTTP status code
   */
  statusCode?: number;
  
  /**
   * Error code if available
   */
  code?: string;
  
  /**
   * @deprecated Use error property instead
   */
  message?: string;
}

// Create a named ApiRequestError class for typed errors
export class ApiRequestError extends Error {
  public statusCode: number;
  public data: any;
  
  constructor(message: string, statusCode: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// API client class
class ApiClientClass {
  private baseUrl: string = '';
  private initialized: boolean = false;
  private initializationPromise: Promise<boolean> | null = null;
  
  /**
   * Check if API client is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Initialize API client
   */
  async initialize(options?: { forceAuth?: boolean }): Promise<boolean> {
    // If already initialized, return true
    if (this.initialized) {
      return true;
    }
    
    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      try {
        return await this.initializationPromise;
      } catch (error) {
        logger.error('Error waiting for initialization:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        return false;
      }
    }
    
    // Create and store initialization promise
    this.initializationPromise = this.performInitialization(options);
    
    try {
      // Wait for initialization
      const result = await this.initializationPromise;
      
      // Update initialization state
      this.initialized = result;
      
      // Notify about completion
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-client-initialized', {
          detail: { timestamp: Date.now(), success: result }
        }));
      }
      
      return result;
    } catch (error) {
      logger.error('API client initialization error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return false;
    } finally {
      this.initializationPromise = null;
    }
  }
  
  /**
   * Perform API client initialization
   */
  private async performInitialization(options?: { forceAuth?: boolean }): Promise<boolean> {
    try {
      logger.info('Initializing API client');
      
      // Set base URL
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Initialize TokenManager correctly
      try {
        await TokenManager.initialize();
      } catch (error) {
        logger.warn('TokenManager initialization failed, continuing with API client initialization', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // Initialize AuthService if required
      if (options?.forceAuth) {
        try {
          await AuthService.initialize();
        } catch (error) {
          logger.warn('AuthService initialization failed, continuing with API client initialization', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Mark as initialized
      this.initialized = true;
      
      logger.info('API client initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize API client:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return false;
    }
  }
  
  /**
   * Format URL with query parameters
   */
  private formatUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    // Format URL based on path
    let url: string;
    
    // Handle absolute URLs
    if (path.startsWith('http')) {
      url = path;
    }
    // Handle paths that already include /api prefix
    else if (path.startsWith('/api/')) {
      url = path;
    }
    // Add baseUrl to other paths
    else {
      url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    }
    
    // Return URL if no params
    if (!params) {
      return url;
    }
    
    // Filter out undefined values
    const filteredParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
    
    // Add query parameters
    const searchParams = new URLSearchParams(filteredParams);
    return `${url}${url.includes('?') ? '&' : '?'}${searchParams.toString()}`;
  }
  
  /**
   * Get headers including authentication
   */
  private async getHeaders(options?: ApiOptions): Promise<Headers> {
    const headers = new Headers();
    
    // Set content type
    headers.set('Content-Type', 'application/json');
    
    // Generate request ID for tracing
    const requestId = crypto.randomUUID();
    headers.set('X-Request-ID', requestId);
    
    // Add cache control headers
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    
    // Add custom headers
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
    
    // Add authentication header if required
    if (options?.withAuth !== false) {
      try {
        // Ensure token manager is initialized
        await TokenManager.initialize();
        
        // Force refresh token if it's a post-401 retry to ensure it's valid
        if (options?.retry === 401) {
          await TokenManager.refreshToken({ force: true });
        }
        
        // Get token from TokenManager
        const token = await TokenManager.getToken();
        
        if (token) {
          // Make sure Authorization header is formatted exactly as expected by the server
          headers.set('Authorization', `Bearer ${token}`);
          logger.debug('Attached auth token to request', { 
            requestId, 
            tokenLength: token.length
          });
          
          // Also extract user ID from token and add as a redundant header
          // This ensures the user ID is available even if the auth property isn't correctly attached
          try {
            const { jwtDecode } = await import('jwt-decode');
            const decoded = jwtDecode<{sub: string | number}>(token);
            const userId = typeof decoded.sub === 'number' ? decoded.sub : parseInt(decoded.sub, 10);
            
            if (!isNaN(userId)) {
              // Add user ID as a separate header for extra reliability
              headers.set('X-Auth-User-ID', userId.toString());
            }
          } catch (decodeError) {
            logger.warn('Failed to decode user ID from token', {
              error: decodeError instanceof Error ? decodeError.message : String(decodeError),
              requestId
            });
          }
        } else {
          logger.debug('No auth token available for request', { requestId });
          
          // Try to refresh token and attach if needed
          const refreshed = await TokenManager.refreshToken({ force: true });
          if (refreshed) {
            const newToken = await TokenManager.getToken();
            if (newToken) {
              headers.set('Authorization', `Bearer ${newToken}`);
              logger.debug('Attached refreshed auth token to request', { 
                requestId, 
                tokenLength: newToken.length
              });
              
              // Also add user ID header from refreshed token
              try {
                const { jwtDecode } = await import('jwt-decode');
                const decoded = jwtDecode<{sub: string | number}>(newToken);
                const userId = typeof decoded.sub === 'number' ? decoded.sub : parseInt(decoded.sub, 10);
                
                if (!isNaN(userId)) {
                  headers.set('X-Auth-User-ID', userId.toString());
                }
              } catch (decodeError) {
                logger.warn('Failed to decode user ID from refreshed token', {
                  error: decodeError instanceof Error ? decodeError.message : String(decodeError),
                  requestId
                });
              }
            }
          }
        }
        
        // Fall back to Auth Service if still no user ID header
        if (!headers.has('X-Auth-User-ID')) {
          try {
            const user = AuthService.getUser();
            if (user?.id) {
              headers.set('X-Auth-User-ID', user.id.toString());
            }
          } catch (userError) {
            logger.warn('Failed to get user ID from AuthService', {
              error: userError instanceof Error ? userError.message : String(userError),
              requestId
            });
          }
        }
      } catch (error) {
        logger.warn('Failed to get auth token for API request:', {
          error: error instanceof Error ? error.message : String(error),
          requestId
        });
      }
    }
    
    return headers;
  }
  
  /**
   * Make API request with proper error handling
   */
  private async fetchWithRetry(
    url: string,
    config: RequestInit,
    options?: ApiOptions
  ): Promise<Response> {
    const requestId = crypto.randomUUID().slice(0, 8);
    const maxRetries = options?.retry ?? 0; // Default to NO retries for auth errors
    let retries = 0;
    
    // Log request details
    logger.debug(`API request ${requestId} initiated`, {
      url: url.replace(/\?.*$/, ''), // Strip query params for logging
      method: config.method,
      timestamp: Date.now()
    });
    
    // Only retry for network errors, not authentication errors
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Make the request
        const response = await fetch(url, config);
        
        // For auth errors, don't retry - immediately return the response
        // Let higher-level code handle auth errors properly
        if (response.status === 401 || response.status === 403) {
          return response;
        }
        
        // For server errors, we might retry if configured
        if (response.status >= 500 && attempt < maxRetries) {
          // Wait a bit before retrying (exponential backoff)
          const backoffMs = Math.min(100 * Math.pow(2, attempt), 2000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        
        // Otherwise, return the response
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Only retry for network errors, not for other types
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const backoffMs = Math.min(100 * Math.pow(2, attempt), 2000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          
          logger.warn(`Network error, retrying request (${attempt + 1}/${maxRetries + 1})`, {
            error: lastError.message,
            requestId
          });
        } else {
          // No more retries, throw the last error
          throw lastError;
        }
      }
    }
    
    // This should not happen, but TypeScript requires a return
    throw lastError || new Error('Unknown error in fetch');
  }
  
  /**
   * Process API response with clear error handling and standardized format
   */
  private async processResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    try {
      // For auth errors, try to parse response body first to get more detailed error message if available
      if (response.status === 401) {
        // Try to parse JSON response for more info
        try {
          const clonedResponse = response.clone();
          const errorData = await clonedResponse.json();
          
          return {
            success: false,
            data: null,
            error: errorData.error || errorData.message || 'Authentication required',
            message: errorData.message || errorData.error || 'Authentication required',
            statusCode: 401,
            code: errorData.code || 'AUTHENTICATION_REQUIRED'
          };
        } catch (parseError) {
          // Fall back to default response if parsing fails
          return {
            success: false,
            data: null,
            error: 'Authentication required',
            message: 'Authentication required',
            statusCode: 401,
            code: 'AUTHENTICATION_REQUIRED'
          };
        }
      }
      
      if (response.status === 403) {
        // Try to parse JSON response for more info
        try {
          const clonedResponse = response.clone();
          const errorData = await clonedResponse.json();
          
          return {
            success: false,
            data: null,
            error: errorData.error || errorData.message || 'Permission denied',
            message: errorData.message || errorData.error || 'You do not have permission to access this resource',
            statusCode: 403,
            code: errorData.code || 'PERMISSION_DENIED'
          };
        } catch (parseError) {
          // Fall back to default response if parsing fails
          return {
            success: false,
            data: null,
            error: 'Permission denied',
            message: 'You do not have permission to access this resource',
            statusCode: 403,
            code: 'PERMISSION_DENIED'
          };
        }
      }
      
      // Process based on content type
      if (isJson) {
        // Parse JSON response
        const body = await response.json();
        
        // Check for API-formatted response
        if ('success' in body) {
          // If already in correct format, use it directly with code if available
          return {
            success: body.success,
            data: body.data,
            error: body.error || body.message || null,
            message: body.message || body.error || null,
            statusCode: response.status,
            code: body.code || (body.error && body.error.code ? body.error.code : undefined)
          };
        }
        
        // Format regular JSON response
        return {
          success: response.ok,
          data: response.ok ? body : null,
          error: !response.ok ? (body.error || body.message || response.statusText) : null,
          message: !response.ok ? (body.message || body.error || response.statusText) : null, 
          statusCode: response.status,
          code: body.code || (body.error && body.error.code ? body.error.code : undefined)
        };
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        
        return {
          success: response.ok,
          data: response.ok ? text as any : null,
          error: !response.ok ? text || response.statusText : null,
          message: !response.ok ? text || response.statusText : undefined, 
          statusCode: response.status
        };
      }
    } catch (error) {
      logger.error('Error processing API response:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status: response.status,
        url: response.url
      });
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
        message: error instanceof Error ? error.message : String(error), 
        statusCode: response.status
      };
    }
  }
  
  /**
   * Make API request with proper authentication and error handling
   */
  async request<T = any>(
    method: string,
    path: string,
    data?: any,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> {
    // Ensure client is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Format URL with query parameters
    const url = this.formatUrl(path, options?.params);
    
    // Get headers
    const headers = await this.getHeaders(options);
    
    // Create request config
    const config: RequestInit = {
      method,
      headers,
      cache: options?.cache || 'no-cache',
      credentials: 'include', // Include cookies
      signal: options?.signal,
    };
    
    // Add request body for non-GET requests
    if (method !== 'GET' && data !== undefined) {
      config.body = JSON.stringify(data);
    }
    
    try {
      logger.debug(`API ${method} request: ${url}`);
      
      // Make request with retry logic
      const response = await this.fetchWithRetry(url, config, options);
      
      // Process response
      const result = await this.processResponse<T>(response);
      
      // Log result
      if (!result.success) {
        logger.warn(`API ${method} request failed: ${url}`, {
          status: result.statusCode,
          error: result.error,
          code: result.code
        });
        
        // Handle 401 errors with automatic token refresh
        if (result.statusCode === 401 && options?.withAuth !== false) {
          logger.info('API Request returned 401, attempting token refresh');
          
          // Log the response
          logger.debug('API Response:', {
            success: result.success,
            data: result.data,
            error: result.error,
            message: result.message,
            statusCode: result.statusCode,
            code: result.code
          });
          
          // Clear token cache and try to refresh
          TokenManager.clearTokens();
          
          try {
            logger.debug('Starting token refresh');
            const refreshResult = await TokenManager.refreshToken({
              force: true,
              retry: 0 // No retries for refresh to prevent loops
            });
            
            if (refreshResult) {
              logger.info('Token refreshed, retrying request');
              
              // Wait a short time to ensure token is fully propagated
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Get new headers with fresh token and explicitly mark as post-401 retry
              const retryOptions = { ...options, withAuth: true, retry: 401 };
              const newHeaders = await this.getHeaders(retryOptions);
              
              // Update config with new headers
              config.headers = newHeaders;
              
              // Make sure the Authorization header is properly set
              const token = await TokenManager.getToken();
              if (token) {
                // Log token info for debugging
                logger.debug('Using token for retry', {
                  tokenLength: token.length,
                  tokenPrefix: token.substring(0, 10) + '...',
                  hasAuthHeader: newHeaders.has('Authorization'),
                  authHeader: newHeaders.get('Authorization')?.substring(0, 15) + '...'
                });
              }
              
              // Retry the request with new token
              try {
                const newResponse = await fetch(url, config);
                return await this.processResponse<T>(newResponse);
              } catch (retryError) {
                // Log error and continue to return original error
                logger.error('Retry request after token refresh failed:', {
                  error: retryError instanceof Error ? retryError.message : String(retryError),
                  stack: retryError instanceof Error ? retryError.stack : undefined
                });
              }
            } else {
              logger.warn('Token refresh failed, not retrying request');
              
              // Try to initialize auth service as a last resort
              try {
                const { default: AuthService } = await import('@/features/auth/core/AuthService');
                await AuthService.initialize({ force: true });
                
                // Get a fresh token after full initialization
                const token = await TokenManager.getToken();
                if (token) {
                  // If we have a token now, retry with it
                  const retryOptions = { ...options, withAuth: true, retry: 401 };
                  const newHeaders = await this.getHeaders(retryOptions);
                  config.headers = newHeaders;
                  
                  const newResponse = await fetch(url, config);
                  return await this.processResponse<T>(newResponse);
                }
              } catch (authInitError) {
                logger.error('Auth service initialization failed:', {
                  error: authInitError instanceof Error ? authInitError.message : String(authInitError)
                });
              }
              
              // Notify app about authentication issue
              logger.warn('API Client Error', {
                message: result.error || result.message,
                code: result.statusCode,
                status: result.statusCode
              });
              
              // Only emit event for auth required errors
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth-required', {
                  detail: { 
                    path, 
                    method, 
                    timestamp: Date.now(),
                    statusCode: result.statusCode
                  }
                }));
              }
            }
          } catch (refreshError) {
            // Log refresh error
            logger.error('Error refreshing token during API request:', {
              error: refreshError instanceof Error ? refreshError.message : String(refreshError),
              stack: refreshError instanceof Error ? refreshError.stack : undefined
            });
          }
        }
        // Handle 403 errors (permission issue)
        else if (result.statusCode === 403 && options?.withAuth !== false) {
          // Just notify the app about the permission failure
          logger.warn('API Client Error - Permission denied', {
            message: result.error || result.message,
            code: result.statusCode,
            status: result.statusCode
          });
          
          // Emit event for permission denied errors
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('permission-denied', {
              detail: { 
                path, 
                method, 
                timestamp: Date.now(),
                statusCode: result.statusCode
              }
            }));
          }
        }
      } else {
        logger.debug(`API ${method} request succeeded: ${url}`, {
          status: result.statusCode
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`API ${method} request error: ${url}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error),
        message: error instanceof Error ? error.message : String(error),
        statusCode: 500
      };
    }
  }
  
  /**
   * GET request
   */
  async get<T = any>(path: string, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, options);
  }
  
  /**
   * POST request
   */
  async post<T = any>(path: string, data?: any, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, options);
  }
  
  /**
   * PUT request
   */
  async put<T = any>(path: string, data?: any, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, options);
  }
  
  /**
   * PATCH request
   */
  async patch<T = any>(path: string, data?: any, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, options);
  }
  
  /**
   * DELETE request
   */
  async delete<T = any>(path: string, data?: any, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, data, options);
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Create singleton instance
export const ApiClient = new ApiClientClass();

// Default export
export default ApiClient;