'use client';

/**
 * TokenManager.ts
 * 
 * Centralized token management with proper coordination to prevent
 * race conditions and duplicate token fetches.
 */

import { getLogger } from '@/core/logging';
import SharedTokenCache from './SharedTokenCache';
import { jwtDecode } from 'jwt-decode';

const logger = getLogger();

// Types
export interface DecodedToken {
  sub: string | number;
  exp: number;
  iat: number;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface TokenValidationResult {
  valid: boolean;
  errors: string[];
  userId?: number;
  expiresAt?: Date;
  remainingTimeMs?: number;
}

export interface TokenManagerOptions {
  timeout?: number;
  force?: boolean;
  retry?: number; // Number of retry attempts
}

export class TokenManager {
  // Improved state tracking
  private static refreshInProgress = false;
  private static refreshPromise: Promise<boolean> | null = null;
  private static lastRefreshError: Error | null = null;
  private static lastRefreshTime = 0;
  private static initializationPromise: Promise<boolean> | null = null;
  private static hmrTokenLock = false;
  
  /**
   * Initialize the token manager
   */
  public static async initialize(options: TokenManagerOptions = {}): Promise<boolean> {
    try {
      // Use existing initialization promise if available to prevent race conditions
      if (this.initializationPromise && !options.force) {
        return await this.initializationPromise;
      }
      
      // Create new initialization promise
      this.initializationPromise = this.performInitialization(options);
      
      // Wait for initialization to complete
      const result = await this.initializationPromise;
      
      // Clear promise reference once done
      this.initializationPromise = null;
      
      return result;
    } catch (error) {
      logger.error('TokenManager initialization failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Clear promise reference on error
      this.initializationPromise = null;
      
      return false;
    }
  }
  
  /**
   * Perform initialization with proper error handling
   */
  private static async performInitialization(options: TokenManagerOptions = {}): Promise<boolean> {
    try {
      // Clear error state when initializing
      this.lastRefreshError = null;
      
      // Get token or fetch a fresh one
      const token = await this.getToken(options);
      return !!token;
    } catch (error) {
      logger.error('TokenManager initialization failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }
  
  /**
   * Get token with proper error handling
   */
  public static async getToken(options: TokenManagerOptions = {}): Promise<string | null> {
    try {
      // Check SharedTokenCache first if not forcing refresh
      if (!options.force) {
        const cachedToken = SharedTokenCache.getToken();
        if (cachedToken) {
          // Validate token before returning it
          const validation = await this.validateToken(cachedToken);
          if (validation.valid) {
            return cachedToken;
          } else {
            logger.debug('Cached token is invalid, fetching new token', {
              errors: validation.errors
            });
          }
        }
      }
      
      // Fetch a fresh token
      try {
        return await this.fetchToken();
      } catch (error) {
        logger.error('Failed to fetch token:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          options
        });
        return null;
      }
    } catch (error) {
      logger.error('Error in getToken:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }
  
  /**
   * Fetch a token with proper error handling
   */
  private static async fetchToken(): Promise<string | null> {
    const requestId = crypto.randomUUID().substring(0, 8);
    
    try {
      logger.debug('Fetching token', { requestId });
      
      // Make the API request with clear error boundaries
      const response = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'X-Request-ID': requestId
        }
      });
      
      // Handle non-200 responses properly
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read response body');
        throw new Error(`Token fetch failed with status ${response.status}: ${errorText}`);
      }
      
      // Parse response body with error handling
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Failed to parse token response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Extract token and validate format
      let token = null;
      
      // First check if token is in response body
      if (data.data?.token) {
        token = data.data.token;
      } else if (data.token) {
        token = data.token;
      }
      
      // If token not found in response body, check cookies
      if (!token) {
        logger.debug('Token not found in response body, checking cookies');
        
        // Parse cookies from document.cookie - specifically check for js_token first
        // which is set as non-HttpOnly in the login endpoint
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'js_token') {
            // Prioritize js_token as it's specifically set for JavaScript access
            token = decodeURIComponent(value);
            logger.debug('Token found in js_token cookie');
            break;
          } else if (['auth_token', 'access_token'].includes(name)) {
            token = decodeURIComponent(value);
            logger.debug(`Token found in ${name} cookie`);
            break;
          }
        }
      }
      
      // If still no token, throw error
      if (!token) {
        throw new Error('No token found in response or cookies');
      }
      
      // Basic token format validation
      if (typeof token !== 'string' || !token.includes('.') || token.split('.').length !== 3) {
        throw new Error('Invalid token format received');
      }
      
      // Store token in SharedTokenCache
      try {
        // Decode token to get expiration time
        const decoded = jwtDecode<DecodedToken>(token);
        const expiresInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        
        if (expiresInSeconds <= 0) {
          throw new Error('Received expired token');
        }
        
        // Store in cache
        SharedTokenCache.setToken(token, expiresInSeconds);
        
        logger.debug('Token cached successfully', {
          expiresIn: `${expiresInSeconds}s`,
          tokenLength: token.length
        });
        
        logger.debug('Token fetched and cached successfully', {
          requestId,
          tokenLength: token.length,
          expiresInSeconds
        });
      } catch (cacheError) {
        logger.warn('Error caching fetched token', {
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
          requestId
        });
        // Continue even if caching fails
      }
      
      return token;
    } catch (error) {
      logger.error('Token fetch failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestId
      });
      
      return null;
    }
  }
  
  /**
  * Validate a token and verify its claims
  */
  public static async validateToken(token: string): Promise<TokenValidationResult> {
    const errors: string[] = [];
    
    try {
      // Check if token is present
      if (!token) {
        errors.push('No token provided');
        return { valid: false, errors };
      }
      
      // Check token format
      if (!token.includes('.') || token.split('.').length !== 3) {
        errors.push('Invalid token format');
        return { valid: false, errors };
      }
      
      // Decode token locally
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Check for required claims
        if (!decoded.sub) {
          errors.push('Token missing subject claim');
          return { valid: false, errors };
        }
        
        if (!decoded.exp) {
          errors.push('Token missing expiration claim');
          return { valid: false, errors };
        }
        
        // Check expiration
        const now = Date.now();
        const expiresAt = new Date(decoded.exp * 1000);
        const remainingTimeMs = expiresAt.getTime() - now;
        
        // Log token expiration information
        logger.debug('Token validation', {
          createdAt: new Date(decoded.iat * 1000).toISOString(),
          expiresAt: expiresAt.toISOString(),
          timeRemaining: `${Math.round(remainingTimeMs / 1000)} seconds`,
          isExpired: now >= expiresAt.getTime()
        });
        
        // Check current time against expiration time
        if (now >= expiresAt.getTime()) {
          errors.push(`Token is expired: Expired at ${expiresAt.toISOString()}, now ${new Date(now).toISOString()}`);
          return { valid: false, errors, expiresAt };
        }
        
        // Parse user ID
        let userId: number;
        if (typeof decoded.sub === 'number') {
          userId = decoded.sub;
        } else {
          userId = parseInt(decoded.sub, 10);
          if (isNaN(userId)) {
            errors.push('Invalid user ID in token');
            return { valid: false, errors };
          }
        }
        
        // Return successful validation based on local checks
        return {
          valid: true,
          errors: [],
          userId,
          expiresAt,
          remainingTimeMs
        };
      } catch (decodeError) {
        errors.push(`Token decode error: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
        return { valid: false, errors };
      }
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, errors };
    }
  }
  
  /**
   * Refresh the token with proper synchronization to prevent race conditions
   */
  public static async refreshToken(options: TokenManagerOptions = {}): Promise<boolean> {
    // Prevent token refreshes in HMR scenarios
    if (this.hmrTokenLock && (typeof module !== 'undefined' && (module as any).hot)) {
      logger.debug('Token refresh blocked during HMR');
      return false;
    }
    
    // Check if token is still valid before attempting refresh
    const currentToken = SharedTokenCache.getToken();
    if (currentToken && !options.force) {
      const validation = await this.validateToken(currentToken);
      if (validation.valid && validation.remainingTimeMs && validation.remainingTimeMs > 300000) { // Token valid for >5min
        logger.debug('Skipping unnecessary token refresh, current token still valid', {
          timeRemaining: `${Math.round((validation.remainingTimeMs || 0) / 1000)} seconds`
        });
        return true;
      }
    }
    
    // Prevent concurrent refresh operations
    if (this.refreshInProgress && !options.force) {
      logger.debug('Token refresh already in progress');
      
      // If a refresh is already in progress, wait for it to complete
      if (this.refreshPromise) {
        try {
          return await this.refreshPromise;
        } catch (error) {
          logger.warn('Error waiting for in-progress token refresh', {
            error: error instanceof Error ? error.message : String(error)
          });
          return false;
        }
      }
      
      return false;
    }
    
    // Set refresh flag and generate request ID
    this.refreshInProgress = true;
    const requestId = crypto.randomUUID().substring(0, 8);
    
    // Create a new refresh promise
    this.refreshPromise = this.performTokenRefresh(requestId, options);
    
    try {
      // Wait for refresh to complete
      const result = await this.refreshPromise;
      
      // If refresh was successful, trigger event to notify components
      if (result && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('token-refreshed', {
          detail: { timestamp: Date.now() }
        }));
      }
      
      return result;
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestId
      });
      return false;
    } finally {
      // Clear state
      this.refreshInProgress = false;
      this.refreshPromise = null;
    }
  }
  
  /**
   * Perform token refresh with proper error handling
   */
  private static async performTokenRefresh(requestId: string, options: TokenManagerOptions = {}): Promise<boolean> {
    try {
      logger.debug('Starting token refresh', { requestId });
      
      // Do not clear existing token yet to prevent token unavailability during refresh
      
      // Add retry logic for network issues
      const maxRetries = options.retry ?? 1; // Default to 1 retry for better reliability
      let retryCount = 0;
      let lastError: Error | null = null;
      
      // Implement circuit breaker pattern
      const consecutiveFailureLimit = 3;
      const failureCache = this.getFailureCache();
      
      // Check if we've hit too many consecutive failures
      if (failureCache.count >= consecutiveFailureLimit && 
          Date.now() - failureCache.lastFailureTime < 60000) { // Within last minute
        logger.warn('Token refresh circuit breaker triggered - too many consecutive failures', {
          failureCount: failureCache.count,
          lastFailureTime: new Date(failureCache.lastFailureTime).toISOString(),
          requestId
        });
        
        // Clear token state to force re-authentication
        this.clearTokens();
        this.lastRefreshError = new Error('Authentication required after multiple token refresh failures');
        return false;
      }
      
      while (retryCount <= maxRetries) {
        try {
          // Add jitter to prevent thundering herd problem
          const jitter = Math.floor(Math.random() * 100);
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, jitter));
          }
          
          // Call the refresh endpoint
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache',
              'X-Request-ID': requestId
            }
          });
          
          // Get response details for error reporting
          let responseBody = '';
          try {
            responseBody = await response.text();
          } catch (e) {
            // Ignore errors reading response body
          }
          
          // Handle non-success responses
          if (!response.ok) {
            // Record specific error details
            this.lastRefreshError = new Error(
              `Token refresh failed: ${response.status} ${response.statusText} - ${responseBody.substring(0, 200)}`
            );
            
            logger.error('Token refresh failed', {
              requestId,
              status: response.status,
              statusText: response.statusText,
              responsePreview: responseBody.substring(0, 200),
              attempt: retryCount + 1,
              maxAttempts: maxRetries + 1
            });
            
            // Update failure counter for circuit breaker
            this.incrementFailureCounter();
            
            // Only retry for server errors or certain conditions
            const isServerError = response.status >= 500;
            const isRateLimited = response.status === 429;
            const isNetworkOrTimeout = response.status === 0 || response.status === 504 || response.status === 408;
            
            if ((isServerError || isRateLimited || isNetworkOrTimeout) && retryCount < maxRetries) {
              // Exponential backoff with jitter
              const backoffMs = Math.min(100 * Math.pow(2, retryCount), 2000) + jitter;
              logger.debug(`Retrying refresh in ${backoffMs}ms`, { requestId, attempt: retryCount + 1 });
              await new Promise(resolve => setTimeout(resolve, backoffMs));
              retryCount++;
              continue;
            }
            
            // For 401/403 errors, clear all tokens and state
            if (response.status === 401 || response.status === 403) {
              logger.warn('Authentication error during token refresh, clearing all tokens', {
                status: response.status,
                requestId
              });
              this.clearTokens();
            }
            
            return false;
          }
          
          // Try to parse the response
          let data;
          try {
            data = responseBody ? JSON.parse(responseBody) : null;
          } catch (parseError) {
            logger.error('Failed to parse refresh response', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              responsePreview: responseBody.substring(0, 200),
              requestId
            });
            
            // If parsing fails but the response was successful, continue
            // to try fetching the token anyway
          }
          
          // Now clear the existing token to ensure we get a fresh one
          SharedTokenCache.clearToken();
          
          // Fetch the new token - it should be available in cookies now
          const token = await this.fetchToken();
          
          if (!token) {
            logger.error('Failed to retrieve token after successful refresh', { requestId });
            
            // Update failure counter
            this.incrementFailureCounter();
            
            // Simple retry for token fetch failures
            if (retryCount < maxRetries) {
              logger.debug('Retrying token fetch after refresh', { 
                requestId, 
                attempt: retryCount + 1 
              });
              
              await new Promise(resolve => setTimeout(resolve, 500 + jitter));
              retryCount++;
              continue;
            }
            
            return false;
          }
          
          // Make sure the token is correctly formatted and has valid claims
          try {
            const validation = await this.validateToken(token);
            
            if (!validation.valid) {
              logger.warn('Retrieved token after refresh but it failed validation', { 
                requestId,
                errors: validation.errors
              });
              
              // Update failure counter
              this.incrementFailureCounter();
              
              if (retryCount < maxRetries) {
                logger.debug('Retrying after invalid token', { requestId, attempt: retryCount + 1 });
                await new Promise(resolve => setTimeout(resolve, 500 + jitter));
                retryCount++;
                continue;
              }
              
              return false;
            }
          } catch (validationError) {
            logger.warn('Error validating refreshed token', {
              error: validationError instanceof Error ? validationError.message : String(validationError),
              requestId
            });
            // Continue despite validation errors - we'll trust the server-side refresh
          }
          
          // Success! Reset failure counter
          this.resetFailureCounter();
          
          // Update last refresh timestamp
          this.lastRefreshTime = Date.now();
          this.lastRefreshError = null;
          
          logger.debug('Token refresh completed successfully', {
            requestId,
            tokenLength: token.length,
            attempt: retryCount + 1
          });
          
          return true;
        } catch (fetchError) {
          // Store the error for reporting
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          
          logger.error('Token refresh network error', {
            requestId,
            error: lastError.message,
            stack: lastError.stack,
            attempt: retryCount + 1,
            maxAttempts: maxRetries + 1
          });
          
          // Update failure counter
          this.incrementFailureCounter();
          
          // Retry for network errors if we have retries left
          if (retryCount < maxRetries) {
            const jitter = Math.floor(Math.random() * 200);
            const backoffMs = Math.min(200 * Math.pow(2, retryCount), 3000) + jitter;
            logger.debug(`Retrying refresh in ${backoffMs}ms after network error`, { 
              requestId, 
              attempt: retryCount + 1 
            });
            
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            retryCount++;
            continue;
          }
          
          // No more retries left, store error and return false
          this.lastRefreshError = lastError;
          return false;
        }
      }
      
      // All retries exhausted and unsuccessful
      return false;
    } catch (error) {
      this.lastRefreshError = error instanceof Error ? error : new Error(String(error));
      
      // Update failure counter
      this.incrementFailureCounter();
      
      logger.error('Token refresh error', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return false;
    }
  }
  
  /**
   * Circuit breaker pattern implementation
   */
  private static getFailureCache(): { count: number, lastFailureTime: number } {
    if (typeof window === 'undefined') {
      return { count: 0, lastFailureTime: 0 };
    }
    
    if (!(window as any).__TOKEN_FAILURE_CACHE__) {
      (window as any).__TOKEN_FAILURE_CACHE__ = { count: 0, lastFailureTime: 0 };
    }
    
    return (window as any).__TOKEN_FAILURE_CACHE__;
  }
  
  private static incrementFailureCounter(): void {
    if (typeof window === 'undefined') return;
    
    const cache = this.getFailureCache();
    cache.count += 1;
    cache.lastFailureTime = Date.now();
  }
  
  private static resetFailureCounter(): void {
    if (typeof window === 'undefined') return;
    
    const cache = this.getFailureCache();
    cache.count = 0;
  }
  
  /**
   * Get the last token refresh error if any
   */
  public static getLastRefreshError(): Error | null {
    return this.lastRefreshError;
  }
  
  /**
   * Check if token refresh is in progress
   */
  public static isRefreshInProgress(): boolean {
    return this.refreshInProgress;
  }
  
  /**
   * Get last successful token refresh time
   */
  public static getLastRefreshTime(): number {
    return this.lastRefreshTime;
  }
  
  /**
   * Get failure count for circuit breaker
   */
  public static getFailureCount(): number {
    return this.getFailureCache().count;
  }
  
  /**
   * Check if circuit breaker is triggered
   */
  public static isCircuitBreakerTriggered(): boolean {
    const cache = this.getFailureCache();
    return cache.count >= 3 && (Date.now() - cache.lastFailureTime < 60000);
  }
  
  /**
   * Set HMR lock to prevent token refreshes during hot module reloading
   */
  public static setHmrLock(locked: boolean): void {
    this.hmrTokenLock = locked;
    logger.debug(`HMR token lock ${locked ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Special utility function to get a token specifically for permission checks
   * This ensures the token is always included with permission check requests
   * 
   * @returns Token and headers object ready to use in fetch requests
   */
  public static async getTokenForPermissionCheck(): Promise<{
    token: string | null;
    headers: Record<string, string>;
  }> {
    try {
      // Initialize and ensure we have a valid token
      await TokenManager.initialize();
      
      // Try to refresh the token first to ensure it's valid
      // Use a lighter refresh approach that won't block if one is in progress
      let refreshed = false;
      if (!TokenManager.isRefreshInProgress()) {
        refreshed = await TokenManager.refreshToken({ force: false, retry: 0 });
      }
      
      // Get the token (either freshly refreshed or from cache)
      const token = await TokenManager.getToken();
      
      // Create a set of headers specifically for permission checks
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Request-Time': new Date().toISOString(),
        'X-Request-ID': `perm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      };
      
      // Add Authorization header if we have a token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        
        // Also add userId as a backup method
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          const userId = typeof decoded.sub === 'number' ? decoded.sub : parseInt(String(decoded.sub), 10);
          
          if (!isNaN(userId)) {
            headers['X-Auth-User-ID'] = String(userId);
          }
        } catch (error) {
          logger.warn('Failed to decode user ID from token for permission check', {
            error: error instanceof Error ? error.message : String(error),
            tokenLength: token.length
          });
        }
      }
      
      return { token, headers };
    } catch (error) {
      logger.error('Error preparing token for permission check', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return empty token but still provide basic headers
      return {
        token: null,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Request-Time': new Date().toISOString(),
          'X-Request-ID': `perm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        }
      };
    }
  }
  
  /**
   * Clear token state
   */
  public static clearTokens(): void {
    // Clear token cache
    SharedTokenCache.clearToken();
    
    // Reset state
    this.lastRefreshError = null;
    this.refreshInProgress = false;
    
    // Attempt to clear cookies directly
    if (typeof document !== 'undefined') {
      // Set cookies to expire in the past
      document.cookie = 'auth_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'access_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'refresh_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      document.cookie = 'js_token=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;'; // Also clear js_token
    }
    
    logger.debug('Token cache cleared');
  }
}

// Register HMR handler to prevent token operations during reloads
if (typeof module !== 'undefined' && (module as any).hot) {
  (module as any).hot.dispose(() => {
    TokenManager.setHmrLock(true);
    logger.debug('HMR detected: Token manager locked for reload');
  });
  
  (module as any).hot.accept(() => {
    setTimeout(() => {
      TokenManager.setHmrLock(false);
      logger.debug('HMR completed: Token manager unlocked');
    }, 1000); // Give a bit of time for the reload to complete
  });
}

// Export
export default TokenManager;