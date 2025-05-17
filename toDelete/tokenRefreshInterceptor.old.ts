'use client';

/**
 * API Client Token Refresh Interceptor
 * 
 * Provides automatic token refresh before expired tokens cause API failures
 * Enhanced with timeout handling, robust error recovery, and retry mechanisms
 */
import { getLogger } from '@/core/logging';

// Use logger early to avoid declaration issues
const logger = getLogger();

// Manager state
let tokenManager: any;
let tokenManagerLoaded = false;
let tokenManagerPromise: Promise<any> | null = null;
let tokenManagerInitAttempts = 0;
let lastInitAttempt = 0;

/**
 * Creates a simple fallback token manager when the main one fails to load
 */
function createFallbackTokenManager() {
  logger.warn('Creating fallback TokenManager implementation');
  
  return {
    getAccessToken: async () => {
      try {
        // Simple cookie reading fallback
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];
        
        return value ? decodeURIComponent(value) : null;
      } catch (e) {
        return null;
      }
    },
    getTokenInfo: async () => {
      try {
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];
        
        if (!value) return null;
        
        // Try to get expiry
        const expiryStr = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_expires_at='))
          ?.split('=')[1];
        
        const expiresAt = expiryStr ? new Date(parseInt(expiryStr)) : new Date(Date.now() + 15 * 60 * 1000);
        
        return {
          accessToken: decodeURIComponent(value),
          expiresAt,
          isExpired: Date.now() >= expiresAt.getTime()
        };
      } catch (e) {
        return null;
      }
    },
    checkTokenValidity: async () => true // Assume valid in fallback mode
  };
}

// Create a reliable way to ensure TokenManager is loaded with better error handling
async function ensureTokenManager(): Promise<any> {
  // Return existing instance if available
  if (tokenManager) {
    return tokenManager;
  }
  
  // Return existing promise if in progress and not stale
  if (tokenManagerPromise && Date.now() - lastInitAttempt < 5000) {
    return tokenManagerPromise;
  }
  
  // Track initialization attempts
  tokenManagerInitAttempts++;
  lastInitAttempt = Date.now();
  
  // If we've tried too many times, use a simple fallback
  if (tokenManagerInitAttempts > 3) {
    logger.warn('Too many TokenManager initialization attempts, using fallback');
    return createFallbackTokenManager();
  }
  
  // Create new loading promise with timeout
  tokenManagerPromise = new Promise(async (resolve, reject) => {
    try {
      // Set a timeout to avoid hanging if token manager loading takes too long
      const timeoutId = setTimeout(() => {
        logger.warn('TokenManager loading timed out after 5 seconds, using fallback');
        // If we have a fallback implementation, use it
        if (typeof window !== 'undefined') {
          const fallbackTokenManager = createFallbackTokenManager();
          tokenManager = fallbackTokenManager;
          tokenManagerLoaded = true;
          resolve(fallbackTokenManager);
        } else {
          tokenManagerPromise = null; // Reset promise to allow retry
          reject(new Error('TokenManager loading timed out'));
        }
      }, 5000);
      
      if (typeof window !== 'undefined') {
        try {
          const module = await import('@/features/auth/lib/token/TokenManager');
          tokenManager = module.tokenManager;
          
          tokenManagerLoaded = true;
          clearTimeout(timeoutId); // Clear timeout on success
          logger.info('TokenManager loaded successfully in interceptor');
          resolve(tokenManager);
        } catch (importError) {
          logger.warn('Error importing improved TokenManager, trying regular version');
          
          try {
            const fallbackModule = await import('@/features/auth/lib/token/TokenManager');
            tokenManager = fallbackModule.tokenManager;
            tokenManagerLoaded = true;
            clearTimeout(timeoutId); // Clear timeout on success
            logger.info('Regular TokenManager loaded successfully in interceptor');
            resolve(tokenManager);
          } catch (fallbackError) {
            clearTimeout(timeoutId); // Clear timeout on error
            logger.error('All TokenManager imports failed in interceptor:', fallbackError as Error);
            reject(fallbackError);
          }
        }
      } else {
        clearTimeout(timeoutId); // Clear timeout
        reject(new Error('Not in browser environment'));
      }
    } catch (err) {
      logger.error('Error setting up TokenManager loading:', err as Error);
      tokenManagerPromise = null; // Reset promise to allow retry
      reject(err);
    }
  });
  
  return tokenManagerPromise;
}

// Start loading immediately in client context
if (typeof window !== 'undefined') {
  ensureTokenManager().catch(err => {
    console.error('Initial TokenManager loading failed:', err as Error);
  });
}

/**
 * Create and configure token refresh interceptors for API client
 * Improved implementation with proper initialization tracking and timeout handling
 */
export function setupTokenRefreshInterceptor() {
  // Global state to track interceptor status
  const interceptorState = {
    isRefreshing: false,
    refreshAttempts: 0,
    lastRefreshTime: 0,
    isInitialized: false,
    initializationAttempts: 0,
    lastInitializationAttempt: 0
  };
  
  // Interceptor configuration
  const MAX_REFRESH_ATTEMPTS = 3;
  const MIN_REFRESH_INTERVAL = 5 * 1000; // 5 seconds - reduced to be more responsive
  const MAX_INIT_ATTEMPTS = 5;
  
  // Store failed requests to retry after token refresh
  let failedQueue: { resolve: Function, reject: Function, originalRequest: { url: string, options: RequestInit } }[] = [];
  
  // Log initialization state
  logger.info('Token refresh interceptor initializing...', { 
    tokenManagerLoaded, 
    windowDefined: typeof window !== 'undefined' 
  });
  
  /**
   * Process queued requests after token refresh
   */
  const processQueue = (error: any = null) => {
    const queueToProcess = [...failedQueue]; // Clone the queue
    failedQueue = []; // Clear the queue before processing
    
    queueToProcess.forEach(request => {
      if (error) {
        request.reject(error);
      } else {
        // Resolve with a function that will retry the original request
        request.resolve(() => {
          return originalFetch(request.originalRequest.url, request.originalRequest.options);
        });
      }
    });
  };
  
  /**
   * Check token expiration before each request with improved error handling and timeouts
   */
  async function checkTokenBeforeRequest() {
    let checkTimeoutId: any = null;
    
    try {
      // Skip if already refreshing
      if (interceptorState.isRefreshing) {
        return;
      }
      
      // Create a timeout for the entire token check operation
      const checkPromise = new Promise<void>(async (resolve, reject) => {
        checkTimeoutId = setTimeout(() => {
          logger.warn('Token check timed out, continuing with request');
          resolve(); // Resolve instead of reject to continue with request
        }, 3000); // 3 second timeout for token check
        
        try {
          // Ensure TokenManager is available with timeout protection
          if (!tokenManager) {
            try {
              // Don't try to initialize too frequently
              const now = Date.now();
              if (interceptorState.initializationAttempts > 0 && 
                  now - interceptorState.lastInitializationAttempt < 2000) {
                resolve(); // Skip initialization if attempted recently
                return;
              }
              
              // Track initialization attempt
              interceptorState.initializationAttempts++;
              interceptorState.lastInitializationAttempt = now;
              
              if (interceptorState.initializationAttempts > MAX_INIT_ATTEMPTS) {
                logger.warn(`Token manager initialization failed after ${MAX_INIT_ATTEMPTS} attempts, proceeding anyway`);
                resolve();
                return;
              }
              
              logger.info(`Attempting to load TokenManager (attempt ${interceptorState.initializationAttempts})`);
              tokenManager = await Promise.race([
                ensureTokenManager(),
                new Promise((_, timeoutReject) => {
                  setTimeout(() => timeoutReject(new Error('TokenManager loading timeout')), 2000);
                })
              ]);
              
              if (!tokenManager) {
                logger.warn('TokenManager still not available after loading attempt, proceeding anyway');
                resolve();
                return;
              }
              
              interceptorState.isInitialized = true;
              logger.info('TokenManager successfully initialized in interceptor');
            } catch (initError) {
              logger.error('Failed to initialize TokenManager, proceeding anyway:', initError as Error);
              resolve();
              return;
            }
          }
          
          // Check if token is about to expire
          let tokenInfo;
          try {
            tokenInfo = await Promise.race([
              tokenManager.getTokenInfo(),
              new Promise((_, timeoutReject) => {
                setTimeout(() => timeoutReject(new Error('getTokenInfo timeout')), 1000);
              })
            ]);
          } catch (tokenInfoError) {
            logger.warn('Error or timeout getting token info, proceeding anyway:', tokenInfoError as Error);
            resolve();
            return;
          }
          
          const shouldRefresh = tokenInfo?.isExpired || false;
          const now = Date.now();
          
          // Only refresh if: 
          // 1. Token is expiring
          // 2. We haven't refreshed recently
          // 3. We haven't exceeded max attempts
          if (shouldRefresh && 
              now - interceptorState.lastRefreshTime > MIN_REFRESH_INTERVAL && 
              interceptorState.refreshAttempts < MAX_REFRESH_ATTEMPTS) {
            
            interceptorState.isRefreshing = true;
            interceptorState.refreshAttempts++;
            
            logger.info('Token expiring soon, triggering refresh', {
              attempt: interceptorState.refreshAttempts,
              timeSinceLastRefresh: now - interceptorState.lastRefreshTime
            });
            
            try {
              // Import here to avoid circular dependencies
              const { AuthClient } = await import('@/features/auth/lib/clients/AuthClient');
              const refreshResult = await Promise.race([
                AuthClient.refreshToken(),
                new Promise((_, timeoutReject) => {
                  setTimeout(() => timeoutReject(new Error('refreshToken timeout')), 3000);
                })
              ]);
              
              if (!refreshResult) {
                logger.error('Token refresh attempt returned no result, proceeding anyway');
                processQueue();
                interceptorState.isRefreshing = false;
                resolve();
                return;
              }
              
              // Refresh successful
              interceptorState.lastRefreshTime = Date.now();
              processQueue();
              logger.info('Token refreshed successfully');
              
              // Notify about successful refresh
              if (typeof window !== 'undefined') {
                try {
                  window.dispatchEvent(new CustomEvent('token-refreshed', { 
                    detail: { timestamp: Date.now() } 
                  }));
                } catch (eventError) {
                  logger.error('Error dispatching token-refreshed event:', eventError as Error);
                }
              }
            } catch (error) {
              logger.error('Token refresh failed in interceptor, proceeding anyway:', error as Error);
              processQueue();
              interceptorState.isRefreshing = false;
            } finally {
              interceptorState.isRefreshing = false;
              resolve();
            }
          } else {
            resolve();
          }
        } catch (error) {
          logger.error('Error in token refresh check, proceeding anyway:', error as Error);
          resolve();
        }
      });
      
      // Wait for the check to complete or timeout
      await checkPromise;
      
      // Clear timeout
      if (checkTimeoutId) {
        clearTimeout(checkTimeoutId);
      }
    } catch (error) {
      // Clear timeout if it exists
      if (checkTimeoutId) {
        clearTimeout(checkTimeoutId);
      }
      
      logger.error('Critical error in checkTokenBeforeRequest, proceeding anyway:', error as Error);
    }
  }
  
  /**
   * Handle 401 responses with token refresh
   */
  async function handle401Response(originalUrl: string, originalOptions: RequestInit) {
    // Check for too frequent refreshes
    const now = Date.now();
    if (now - interceptorState.lastRefreshTime < MIN_REFRESH_INTERVAL) {
      logger.warn('Token refresh attempted too frequently, waiting...', {
        timeSinceLastRefresh: now - interceptorState.lastRefreshTime,
        endpoint: originalUrl
      });
      
      // Wait a short time before continuing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // If we're already refreshing, queue this request
    if (interceptorState.isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ 
          resolve, 
          reject, 
          originalRequest: { 
            url: originalUrl, 
            options: originalOptions 
          } 
        });
      })
        .then((retryFn) => {
          if (typeof retryFn === 'function') {
            return (retryFn as Function)();
          }
          return fetch(originalUrl, originalOptions);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }
    
    // Start the refresh process
    interceptorState.isRefreshing = true;
    try {
      // Check for special permission endpoint which is a common offender
      const isPermissionsEndpoint = originalUrl.includes('/api/users/permissions');
      if (isPermissionsEndpoint) {
        logger.info('401 on permissions endpoint, attempting token refresh with special handling');
      } else {
        logger.info('401 error detected, attempting token refresh');
      }
      
      // Import here to avoid circular dependencies
      const { AuthClient } = await import('@/features/auth/lib/clients/AuthClient');
      const refreshResult = await Promise.race([
        AuthClient.refreshToken(),
        new Promise((_, timeoutReject) => {
          setTimeout(() => timeoutReject(new Error('refreshToken timeout')), 3000);
        })
      ]);
      
      if (!refreshResult) {
        // Handle case where refreshResult is undefined
        logger.warn('Token refresh attempt returned undefined result, proceeding with request anyway');
        processQueue();
        interceptorState.isRefreshing = false;
        return fetch(originalUrl, originalOptions); // Try the original request anyway
      }
      
      if (refreshResult) {
        // Update the last refresh time
        interceptorState.lastRefreshTime = Date.now();
        // Process other queued requests
        processQueue();
        
        // Add a small delay for cookies to be properly set
        if (isPermissionsEndpoint) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Retry the original request with new Authorization header if we got a token
        logger.info('Token refreshed successfully, retrying original request');
        
        try {
          // Get the new token if available
          const { tokenManager } = await import('@/features/auth/lib/token/TokenManager');
          
          const accessToken = await tokenManager.getAccessToken();
          
          // Clone options and update Authorization header if we have a token
          const updatedOptions = { ...originalOptions };
          if (accessToken) {
            updatedOptions.headers = {
              ...updatedOptions.headers,
              'Authorization': `Bearer ${accessToken}`,
              // Add additional headers for debugging
              'X-Auth-Refreshed': 'true',
              'X-Auth-Refreshed-At': new Date().toISOString()
            };
          }
          
          return fetch(originalUrl, updatedOptions);
        } catch (tokenError) {
          logger.warn('Failed to get new token for retry, proceeding with original request');
          return fetch(originalUrl, originalOptions);
        }
      } else {
        // Log detailed information about the refresh failure
        logger.warn('Token refresh failed, proceeding with request anyway', { 
          status: (refreshResult as any)?.statusCode || 'unknown',
          message: (refreshResult as any)?.message || 'Unknown error',
          endpoint: originalUrl
        });
        
        processQueue();
        return fetch(originalUrl, originalOptions);
      }
    } catch (refreshError) {
      logger.error('Token refresh failed in response interceptor, proceeding anyway:', refreshError as Error);
      processQueue();
      return fetch(originalUrl, originalOptions);
    } finally {
      interceptorState.isRefreshing = false;
    }
  }
  
  // Store the original fetch for reference
  const originalFetch = window.fetch;
  
  // Patch the global fetch to add the token refresh checks
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    // Only intercept API requests
    const url = input.toString();
    if (url.includes('/api/') && !url.includes('/api/auth/')) {
      try {
        await checkTokenBeforeRequest();
      } catch (checkError) {
        logger.warn('Token check failed, proceeding with request anyway:', checkError as Error);
      }
      
      try {
        const response = await originalFetch(input, init);
        
        // Check for 401 token expired responses
        if (response.status === 401) {
          try {
            const clonedResponse = response.clone();
            const responseData = await clonedResponse.json().catch(() => ({}));
            
            // Check for token expired indicators
            const isTokenExpired = 
              response.headers.get('X-Auth-Status') === 'token-expired' ||
              responseData.code === 'TOKEN_EXPIRED' ||
              (responseData.message && responseData.message.includes('expired'));
            
            if (isTokenExpired) {
              // Try to refresh the token and retry the request
              return handle401Response(url, init || {});
            }
          } catch (parseError) {
            // If we can't parse the response, assume it's not a token error
            logger.warn('Failed to parse 401 response, continuing:', parseError as Error);
          }
        }
        
        return response;
      } catch (error) {
        logger.error('Fetch error:', error as Error);
        throw error;
      }
    }
    
    // For non-API or auth endpoints, just use the original fetch
    return originalFetch(input, init);
  };
  
  // Reset refresh attempts every 2 minutes to allow retry after errors
  setInterval(() => {
    interceptorState.refreshAttempts = 0;
  }, 2 * 60 * 1000);
  
  logger.info('Enhanced token refresh interceptor initialized');
}

// Initialize the token refresh interceptor when this module is imported
if (typeof window !== 'undefined') {
  // Create a global state tracker for interceptor status
  if (!(window as any).__TOKEN_INTERCEPTOR_STATE) {
    (window as any).__TOKEN_INTERCEPTOR_STATE = {
      initialized: false,
      initializationTime: 0,
      refreshCount: 0,
      lastRefreshTime: 0,
      errors: []
    };
  }
  
  // Only initialize in client environment with a more reliable approach
  // Wait for DOM to be ready for better reliability
  const initInterceptor = () => {
    try {
      setupTokenRefreshInterceptor();
      (window as any).__TOKEN_INTERCEPTOR_STATE.initialized = true;
      (window as any).__TOKEN_INTERCEPTOR_STATE.initializationTime = Date.now();
      logger.info('Token refresh interceptor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize token refresh interceptor, will retry:', error as Error);
      (window as any).__TOKEN_INTERCEPTOR_STATE.errors.push({
        time: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Retry after a delay
      setTimeout(initInterceptor, 2000);
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInterceptor);
  } else {
    // If DOM already loaded, initialize after a short delay
    setTimeout(initInterceptor, 300);
  }
}