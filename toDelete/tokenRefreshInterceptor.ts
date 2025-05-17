'use client';

/**
 * API Client Token Refresh Interceptor
 * 
 * Provides automatic token refresh before expired tokens cause API failures
 */
import { getLogger } from '@/core/logging';
// Import TokenManager only on client side
// Improved token manager loading to ensure availability
let tokenManager: any;
let tokenManagerLoaded = false;
let tokenManagerPromise: Promise<any> | null = null;

  // Create a reliable way to ensure TokenManager is loaded with better error handling
  async function ensureTokenManager(): Promise<any> {
    // Return existing instance if available
    if (tokenManager) {
      return tokenManager;
    }
    
    // Return existing promise if in progress
    if (tokenManagerPromise) {
      return tokenManagerPromise;
    }
    
    // Create new loading promise with timeout
    tokenManagerPromise = new Promise(async (resolve, reject) => {
      try {
        // Set a timeout to avoid hanging if token manager loading takes too long
        const timeoutId = setTimeout(() => {
          logger.warn('TokenManager loading timed out after 5 seconds');
          tokenManagerPromise = null; // Reset promise to allow retry
          reject(new Error('TokenManager loading timed out'));
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
            clearTimeout(timeoutId); // Clear timeout on error
            logger.error('Error importing TokenManager in interceptor:', importError as Error);
            reject(importError);
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
// Removed unused import
const logger = getLogger();

/**
 * Create and configure token refresh interceptors for API client
 * Improved implementation with proper initialization tracking
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
  const MIN_REFRESH_INTERVAL = 10 * 1000; // 10 seconds - reduced from 15
  const MAX_INIT_ATTEMPTS = 5;
  
  // Store failed requests to retry after token refresh
  let failedQueue: { resolve: Function, reject: Function }[] = [];
  
  // Log initialization state
  logger.info('Token refresh interceptor initializing...', { 
    tokenManagerLoaded, 
    windowDefined: typeof window !== 'undefined' 
  });
  
  /**
   * Process queued requests after token refresh
   */
  const processQueue = (error: any = null) => {
    failedQueue.forEach(request => {
      if (error) {
        request.reject(error);
      } else {
        request.resolve();
      }
    });
    
    failedQueue = [];
  };
  
  /**
   * Check token expiration before each request with improved error handling
   */
  async function checkTokenBeforeRequest() {
    try {
      // Skip if already refreshing
      if (interceptorState.isRefreshing) {
        return;
      }
      
      // Ensure TokenManager is available
      if (!tokenManager) {
        try {
          // Don't try to initialize too frequently
          const now = Date.now();
          if (interceptorState.initializationAttempts > 0 && 
              now - interceptorState.lastInitializationAttempt < 2000) {
            return; // Skip initialization if attempted recently
          }
          
          // Track initialization attempt
          interceptorState.initializationAttempts++;
          interceptorState.lastInitializationAttempt = now;
          
          if (interceptorState.initializationAttempts > MAX_INIT_ATTEMPTS) {
            logger.warn(`Token manager initialization failed after ${MAX_INIT_ATTEMPTS} attempts`);
            return;
          }
          
          logger.info(`Attempting to load TokenManager (attempt ${interceptorState.initializationAttempts})`);
          tokenManager = await ensureTokenManager();
          
          if (!tokenManager) {
            logger.warn('TokenManager still not available after loading attempt');
            return;
          }
          
          interceptorState.isInitialized = true;
          logger.info('TokenManager successfully initialized in interceptor');
        } catch (initError) {
          logger.error('Failed to initialize TokenManager:', initError as Error);
          return;
        }
      }
      
      // Check if token is about to expire
      let tokenInfo;
      try {
        tokenInfo = await tokenManager.getTokenInfo();
      } catch (tokenInfoError) {
        logger.warn('Error getting token info:', tokenInfoError as Error);
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
          const refreshResult = await AuthClient.refreshToken();
          
          if (!refreshResult) {
            logger.error('Token refresh attempt returned no result');
            processQueue(new Error('Token refresh failed: No result returned'));
            interceptorState.isRefreshing = false;
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
          logger.error('Token refresh failed in interceptor:', error as Error);
          processQueue(error);
        } finally {
          interceptorState.isRefreshing = false;
        }
      }
    } catch (error) {
      logger.error('Error in token refresh check:', error as Error);
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
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // If we're already refreshing, queue this request
    if (interceptorState.isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
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
      const refreshResult = await AuthClient.refreshToken();
      
      if (!refreshResult) {
        // Handle case where refreshResult is undefined
        logger.warn('Token refresh attempt returned undefined result');
        processQueue(new Error('Token refresh failed: No result returned'));
        interceptorState.isRefreshing = false;
        return fetch(originalUrl, originalOptions); // Try the original request anyway
      }
      
      if (refreshResult.success) {
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
      } else {
        // Log detailed information about the refresh failure
        logger.warn('Token refresh failed', { 
          status: refreshResult?.statusCode || 'unknown',
          message: refreshResult?.message || 'Unknown error',
          endpoint: originalUrl
        });
        
        processQueue(new Error('Token refresh failed'));
        throw new Error(`Token refresh failed: ${refreshResult.message || 'Unknown error'}`);
      }
    } catch (refreshError) {
      logger.error('Token refresh failed in response interceptor:', refreshError as Error);
      processQueue(refreshError);
      throw refreshError;
    } finally {
      interceptorState.isRefreshing = false;
    }
  }
  // Patch the global fetch to add the token refresh checks
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    // Only intercept API requests
    const url = input.toString();
    if (url.includes('/api/') && !url.includes('/api/auth/')) {
      await checkTokenBeforeRequest();
      
      try {
        const response = await originalFetch(input, init);
        
        // Check for 401 token expired responses
        if (response.status === 401) {
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
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    }
    
    // For non-API or auth endpoints, just use the original fetch
    return originalFetch(input, init);
  };
  
  // Reset refresh attempts every 5 minutes
  // Reset refresh attempts every 5 minutes
  setInterval(() => {
    interceptorState.refreshAttempts = 0;
  }, 5 * 60 * 1000);
  logger.info('Token refresh interceptor initialized');
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
      logger.error('Failed to initialize token refresh interceptor:', error as Error);
      (window as any).__TOKEN_INTERCEPTOR_STATE.errors.push({
        time: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInterceptor);
  } else {
    // If DOM already loaded, initialize after a short delay
    setTimeout(initInterceptor, 300);
  }
}
