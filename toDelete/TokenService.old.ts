'use client';

/**
 * TokenService.ts
 * 
 * A consolidated, centralized service for token management in the client.
 * Single source of truth for all token operations including storage, retrieval,
 * validation, refresh, and event notification.
 */

import { jwtDecode } from 'jwt-decode';
import { getLogger } from '@/core/logging';

// Logger
const logger = getLogger();

// Constants
const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000; // 5 minutes before expiry

// Token-related types
interface TokenUser {
  id: number;
  name?: string;
  email: string;
  role?: string;
}

interface TokenInfo {
  token: string | null;
  expiresAt: Date | null;
  isExpired: boolean;
}

interface DecodedToken {
  sub: string | number;
  exp: number;
  iat: number;
  name?: string;
  email?: string;
  role?: string;
}

// Event handlers
type TokenExpiringHandler = () => void;
type AuthStateChangeHandler = (isAuthenticated: boolean) => void;

/**
 * TokenService class providing centralized token management
 */
class TokenServiceClass {
  private tokenExpiringHandlers: TokenExpiringHandler[] = [];
  private authStateChangeHandlers: AuthStateChangeHandler[] = [];
  private refreshTimeoutId: NodeJS.Timeout | null = null;
  
  constructor() {
    // Initialize token refresh timer if needed
    this.setupRefreshTimer();
    
    // Set up auth state change listener for browser events
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-state-change', this.handleAuthStateChangeEvent);
    }
  }
  
  /**
   * Get current access token (from HTTP-only cookie)
   * Note: This will always return null for HTTP-only cookies,
   * but the browser will send them automatically with requests
   */
  async getToken(): Promise<string | null> {
    try {
      // Add timeout to prevent hanging when getting token
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Set timeout to 3 seconds
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 3000);
      
      try {
        // For HTTP-only cookies, we need to check with the server
        const response = await fetch('/api/auth/token', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Request-Time': Date.now().toString()
          },
          signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          logger.debug('Failed to get token from server:', { status: response.status });
          return null;
        }
        
        try {
          const data = await response.json();
          return data.token || null;
        } catch (parseError) {
          logger.error('Error parsing token response:', parseError as Error);
          return null;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If this was an abort error, it was just a timeout
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          logger.warn('Token fetch timed out');
          
          // If token fetch timed out, try to get auth token cookie directly
          // This is a fallback and won't work with HTTP-only cookies, but can help with debugging
          try {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
              const cookie = cookies[i].trim();
              if (cookie.startsWith('auth_token=')) {
                const token = cookie.substring('auth_token='.length, cookie.length);
                if (token) {
                  return decodeURIComponent(token);
                }
              }
            }
          } catch (cookieError) {
            logger.warn('Error checking cookies for token:', cookieError as Error);
          }
          
          return null;
        }
        
        throw fetchError; // Rethrow for outer catch
      }
    } catch (error) {
      logger.error('Error getting token:', error as Error);
      return null;
    }
  }
  
  /**
   * Get token information including expiration details
   */
  async getTokenInfo(): Promise<TokenInfo> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        logger.debug('No token available for getTokenInfo');
        return {
          token: null,
          expiresAt: null,
          isExpired: true
        };
      }
      
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const expiresAt = new Date(decoded.exp * 1000);
        const isExpired = Date.now() >= expiresAt.getTime();
        
        // Log token info for debugging
        logger.debug('Token info retrieved:', {
          tokenLength: token.length,
          expiresAt: expiresAt.toISOString(),
          isExpired,
          expiresIn: isExpired ? 'expired' : `${Math.round((expiresAt.getTime() - Date.now()) / 1000 / 60)} minutes`
        });
        
        return {
          token,
          expiresAt,
          isExpired
        };
      } catch (decodeError) {
        logger.error('Error decoding token in getTokenInfo:', decodeError as Error);
        
        // Try to extract expiration from cookie as a fallback
        try {
          const cookies = document.cookie.split(';');
          let expiryTime: number | null = null;
          
          // Check for auth_expires_at or similar cookies
          const expiryCookieNames = ['auth_expires_at', 'auth_expires_timestamp', 'auth_expiry'];
          
          for (const name of expiryCookieNames) {
            for (let i = 0; i < cookies.length; i++) {
              const cookie = cookies[i].trim();
              if (cookie.startsWith(`${name}=`)) {
                const value = cookie.substring(name.length + 1, cookie.length);
                if (value) {
                  try {
                    expiryTime = parseInt(decodeURIComponent(value), 10);
                    break;
                  } catch (e) {
                    // Continue trying other cookies
                  }
                }
              }
            }
            
            if (expiryTime) break;
          }
          
          if (expiryTime) {
            const expiresAt = new Date(expiryTime);
            return {
              token,
              expiresAt,
              isExpired: Date.now() >= expiresAt.getTime()
            };
          }
        } catch (cookieError) {
          logger.warn('Error extracting expiry from cookies:', cookieError as Error);
        }
        
        // If all else fails, assume a default expiry time of 15 minutes from now
        // This is a fallback to prevent immediate logout
        return {
          token,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
          isExpired: false
        };
      }
    } catch (error) {
      logger.error('Error in getTokenInfo:', error as Error);
      return {
        token: null,
        expiresAt: null,
        isExpired: true
      };
    }
  }
  
  /**
   * Get user information from the current token
   */
  async getCurrentUser(): Promise<TokenUser | null> {
    // First try to get from token
    try {
      const token = await this.getToken();
      
      if (!token) {
        logger.debug('No token available for getCurrentUser');
        return null;
      }
      
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Log token details (safely - without revealing full token)
        logger.debug('Token details:', {
          tokenPrefix: token.substring(0, 8) + '...',
          tokenLength: token.length,
          exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'none',
          sub: decoded.sub || 'none',
          hasName: !!decoded.name,
          hasEmail: !!decoded.email
        });
        
        // Validate token expiration
        const expiresAt = new Date(decoded.exp * 1000);
        if (Date.now() >= expiresAt.getTime()) {
          logger.debug('Token is expired, cannot get current user');
          return null;
        }
        
        // Extract user ID from token subject claim
        let userId: number;
        if (typeof decoded.sub === 'number') {
          userId = decoded.sub;
        } else {
          userId = parseInt(decoded.sub, 10);
          if (isNaN(userId)) {
            logger.warn('Invalid user ID in token subject claim');
            return null;
          }
        }
        
        // Return user info
        return {
          id: userId,
          name: decoded.name,
          email: decoded.email || '',
          role: decoded.role
        };
      } catch (decodeError) {
        logger.error('Error decoding token:', decodeError as Error);
        
        // As a fallback, try to get user info from /api/users/me
        try {
          const response = await fetch('/api/users/me', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            logger.warn('Failed to get user from API:',{ status: response.status });
            return null;
          }
          
          const data = await response.json();
          
          if (!data.success || !data.data) {
            logger.warn('Invalid user data from API');
            return null;
          }
          
          return {
            id: data.data.id,
            name: data.data.name,
            email: data.data.email,
            role: data.data.role
          };
        } catch (apiError) {
          logger.error('Error getting user from API:', apiError as Error);
          return null;
        }
      }
    } catch (error) {
      logger.error('Error getting user from token:', error as Error);
      return null;
    }
  }
  
  // Refresh state management to prevent race conditions
  private refreshInProgress: boolean = false;
  private refreshPromise: Promise<boolean | { success: boolean, message?: string }> | null = null;
  private refreshAttempts: number = 0;
  private lastRefreshTime: number = 0;
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  private readonly REFRESH_COOLDOWN_MS = 5000; // 5 seconds between refresh attempts
  private readonly REFRESH_BACKOFF_MS = 1000; // Initial backoff time
  
  /**
   * Refresh the access token using refresh token with improved locking and backoff
   * @returns Promise<boolean | { success: boolean, message?: string }>
   */
  async refreshToken(): Promise<boolean | { success: boolean, message?: string }> {
    // If a refresh is already in progress, wait for the existing promise
    if (this.refreshInProgress && this.refreshPromise) {
      logger.debug('Token refresh already in progress, waiting for completion');
      return this.refreshPromise;
    }
    
    // Check cooldown period to prevent excessive refresh attempts
    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshTime;
    
    if (timeSinceLastRefresh < this.REFRESH_COOLDOWN_MS) {
      logger.debug(`Token refresh attempted too soon (${Math.round(timeSinceLastRefresh/1000)}s since last refresh)`);
      
      // If token was recently refreshed, just validate it
      const isValid = await this.validateToken();
      if (isValid) {
        return true;
      }
      
      // If we have too many attempts in a short period, add exponential backoff
      if (this.refreshAttempts > 0) {
        const backoffTime = this.REFRESH_BACKOFF_MS * Math.pow(2, this.refreshAttempts - 1);
        logger.debug(`Applying backoff delay of ${backoffTime}ms before refresh`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }

    // Check max refresh attempts
    if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
      // Reset counter if it's been a while since our last attempt
      if (timeSinceLastRefresh > 60000) { // 1 minute
        this.refreshAttempts = 0;
      } else {
        logger.warn(`Maximum refresh attempts (${this.MAX_REFRESH_ATTEMPTS}) reached`);
        return { success: false, message: 'Maximum refresh attempts reached' };
      }
    }
    
    // Lock refresh state and create a shared promise
    this.refreshInProgress = true;
    this.refreshAttempts++;
    
    // Create a promise that all callers will share
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      return await this.refreshPromise;
    } finally {
      // Always clean up, even on errors
      this.refreshInProgress = false;
      this.refreshPromise = null;
    }
  }
  
  /**
   * Actual token refresh implementation
   */
  private async performTokenRefresh(): Promise<boolean | { success: boolean, message?: string }> {
    try {
      logger.debug('Performing access token refresh');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-Time': Date.now().toString()
        }
      });
      
      // Update tracking state
      this.lastRefreshTime = Date.now();
      
      if (!response.ok) {
        const statusMessage = `${response.status}: ${response.statusText}`;
        logger.error('Token refresh failed:', statusMessage);
        
        // Attempt to parse error message from response
        let errorMessage = statusMessage;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Ignore JSON parse errors
        }
        
        // Notify about authentication state change for logout
        this.notifyAuthStateChange(false);
        return { success: false, message: errorMessage };
      }
      
      const data = await response.json();
      
      if (!data.success) {
        logger.error('Token refresh failed:', data.message);
        return { success: false, message: data.message };
      }
      
      // Reset refresh attempts on success
      this.refreshAttempts = 0;
      
      // Schedule the next token refresh
      this.setupRefreshTimer();
      
      // Notify about authentication state change for login
      this.notifyAuthStateChange(true);
      
      // Dispatch event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('token-refreshed', { 
          detail: { timestamp: Date.now() } 
        }));
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Token refresh error:', error as Error);
      return { success: false, message: errorMessage };
    }
  }
  
  /**
   * Validate current token with backend
   */
  async validateToken(): Promise<boolean> {
    try {
      // Add timeout to prevent hanging validation
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Set timeout to 5 seconds
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);
      
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Request-Time': Date.now().toString()
          },
          signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          logger.debug('Token validation failed with status:', { status: response.status });
          return false;
        }
        
        try {
          const data = await response.json();
          return data.success === true;
        } catch (parseError) {
          logger.error('Error parsing validation response:', parseError as Error);
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If this was an abort error, it was just a timeout
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          logger.warn('Token validation timed out');
          return false;
        }
        
        throw fetchError; // Rethrow for outer catch
      }
    } catch (error) {
      logger.error('Token validation error:', error as Error);
      return false;
    }
  }
  
  /**
   * Logout the user (alias for clearTokens for API compatibility)
   */
  async logout(): Promise<void> {
    return this.clearTokens();
  }

  /**
   * Clear tokens - used for logout
   */
  async clearTokens(): Promise<void> {
    try {
      // Clear the refresh timer
      if (this.refreshTimeoutId) {
        clearTimeout(this.refreshTimeoutId);
        this.refreshTimeoutId = null;
      }
      
      // Send logout request to clear HTTP cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Notify about authentication state change
      this.notifyAuthStateChange(false);
    } catch (error) {
      logger.error('Error clearing tokens:', error as Error);
      
      // Even if the API call fails, notify about logout
      this.notifyAuthStateChange(false);
    }
  }
  
  /**
   * Register a handler for token expiring events
   */
  onTokenExpiring(handler: TokenExpiringHandler): () => void {
    this.tokenExpiringHandlers.push(handler);
    
    // If this is the first handler, ensure the refresh timer is set up
    if (this.tokenExpiringHandlers.length === 1) {
      this.setupRefreshTimer();
    }
    
    // Return unsubscribe function
    return () => {
      this.tokenExpiringHandlers = this.tokenExpiringHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Register a handler for auth state changes
   */
  onAuthStateChange(handler: AuthStateChangeHandler): () => void {
    this.authStateChangeHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.authStateChangeHandlers = this.authStateChangeHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Initialize token service with improved reliability
   * @param options Optional initialization options
   */
  async initialize(options: { forceRefresh?: boolean, maxRetries?: number } = {}): Promise<boolean> {
    try {
      logger.debug('Initializing token service');
      
      // First validate current token
      const isValid = await this.validateToken();
      
      if (isValid && !options.forceRefresh) {
        logger.debug('Token is valid, setting up refresh timer');
        // Set up refresh timer
        this.setupRefreshTimer();
        // Reset refresh attempts
        this.refreshAttempts = 0;
        return true;
      }
      
      // Try to refresh if token is invalid or force refresh is requested
      logger.debug('Token is invalid or force refresh requested, attempting refresh');
      const maxRetries = options.maxRetries || 2;
      let retryCount = 0;
      let success = false;
      
      while (!success && retryCount <= maxRetries) {
        // Add delay between retries (except first attempt)
        if (retryCount > 0) {
          const backoffTime = 1000 * Math.pow(2, retryCount - 1);
          logger.debug(`Retrying token refresh (attempt ${retryCount}/${maxRetries}) after ${backoffTime}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
        
        const refreshResult = await this.refreshToken();
        success = typeof refreshResult === 'boolean' ? refreshResult : refreshResult.success;
        
        if (success) {
          logger.debug('Token refresh successful, initialization complete');
          break;
        }
        
        retryCount++;
      }
      
      return success;
    } catch (error) {
      logger.error('Error initializing token service:', error as Error);
      return false;
    }
  }
  
  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      return await this.validateToken();
    } catch (error) {
      logger.error('Error checking authentication:', error as Error);
      return false;
    }
  }
  
  // Using debounce for event notifications
  private notifyTokenExpiringTimeout: NodeJS.Timeout | null = null;
  private notifyAuthChangeTimeout: NodeJS.Timeout | null = null;
  private lastAuthState: boolean | null = null;
  
  /**
   * Private method to notify about token expiring
   */
  private notifyTokenExpiring(): void {
    // Clear any existing timeout
    if (this.notifyTokenExpiringTimeout) {
      clearTimeout(this.notifyTokenExpiringTimeout);
    }
    
    // Set a new timeout for debounce (100ms)
    this.notifyTokenExpiringTimeout = setTimeout(() => {
      logger.debug('Token is expiring soon, notifying handlers');
      
      // Make a copy of handlers array to avoid issues if array changes during iteration
      const handlers = [...this.tokenExpiringHandlers];
      
      handlers.forEach(handler => {
        try {
          handler();
        } catch (error) {
          logger.error('Error in token expiring handler:', error instanceof Error ? error : String(error));
        }
      });
    }, 100) as unknown as NodeJS.Timeout;
  }
  
  /**
   * Private method to notify about auth state changes
   * @param isAuthenticated - The authentication state or error information
   */
  private notifyAuthStateChange(isAuthenticated: boolean | string | Error | Record<string, any>): void {
    const authState = typeof isAuthenticated === 'boolean' ? isAuthenticated : false;
    
    // Prevent duplicate auth state notifications
    if (this.lastAuthState === authState) {
      return;
    }
    
    // Update last auth state
    this.lastAuthState = authState;
    
    // Clear any existing timeout
    if (this.notifyAuthChangeTimeout) {
      clearTimeout(this.notifyAuthChangeTimeout);
    }
    
    // Set a new timeout for debounce (100ms)
    this.notifyAuthChangeTimeout = setTimeout(() => {
      logger.debug('Auth state changed, notifying handlers', { isAuthenticated: authState });
      
      // Make a copy of handlers array to avoid issues if array changes during iteration
      const handlers = [...this.authStateChangeHandlers];
      
      // Notify all registered handlers
      handlers.forEach(handler => {
        try {
          handler(authState);
        } catch (error) {
          logger.error('Error in auth state change handler:', error as Error);
        }
      });
      
      // Dispatch global event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-state-change', { 
          detail: { isAuthenticated: authState } 
        }));
      }
    }, 100) as unknown as NodeJS.Timeout;
  }
  
  // Token state tracking
  private tokenExpiryTime: number | null = null;
  private refreshScheduled: boolean = false;
  
  /**
   * Private method to set up token refresh timer with improved reliability
   */
  private async setupRefreshTimer(): Promise<void> {
    // Avoid scheduling multiple refresh timers
    if (this.refreshScheduled) {
      logger.debug('Refresh already scheduled, skipping duplicate setup');
      return;
    }
    
    // Clear any existing refresh timer
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    try {
      // Mark as scheduled to prevent race conditions
      this.refreshScheduled = true;
      
      // Get token info with retry for better reliability
      let tokenInfo = await this.getTokenInfo();
      
      // If first attempt fails, retry once
      if (!tokenInfo.token && !tokenInfo.expiresAt) {
        logger.debug('Failed to get token info, retrying...');
        await new Promise(resolve => setTimeout(resolve, 500));
        tokenInfo = await this.getTokenInfo();
      }
      
      // If token is missing or already expired, don't set a timer
      if (!tokenInfo.token || !tokenInfo.expiresAt) {
        logger.debug('No valid token available, cannot schedule refresh');
        this.tokenExpiryTime = null;
        this.refreshScheduled = false;
        return;
      }
      
      const expiresAt = tokenInfo.expiresAt.getTime();
      const now = Date.now();
      
      // Store token expiry time
      this.tokenExpiryTime = expiresAt;
      
      // Calculate when to refresh (5 minutes before expiry)
      const refreshTime = expiresAt - now - TOKEN_EXPIRY_MARGIN_MS;
      
      // Only schedule if we need to refresh in the future
      if (refreshTime <= 0) {
        // Token is already expired or about to expire, trigger refresh now
        logger.debug('Token is expiring soon or already expired, refreshing immediately');
        this.notifyTokenExpiring();
        this.refreshScheduled = false;
        return;
      }
      
      // Add small random jitter (0-30 seconds) to prevent all clients refreshing simultaneously
      const jitter = Math.floor(Math.random() * 30000);
      const finalRefreshTime = refreshTime + jitter;
      
      // Schedule the refresh
      this.refreshTimeoutId = setTimeout(() => {
        this.refreshScheduled = false; // Reset flag when timer executes
        this.notifyTokenExpiring();
      }, finalRefreshTime) as unknown as NodeJS.Timeout;
      
      logger.debug('Token refresh scheduled', { 
        expiresAt: tokenInfo.expiresAt.toISOString(),
        refreshIn: Math.ceil(refreshTime / 1000 / 60) + ' minutes',
        jitterMs: jitter
      });
    } catch (error) {
      logger.error('Error setting up refresh timer:', error as Error);
      this.tokenExpiryTime = null;
      this.refreshScheduled = false;
    }
  }
  
  /**
   * Handle auth state change events from other components
   */
  private handleAuthStateChangeEvent = (event: Event): void => {
    const customEvent = event as CustomEvent;
    const isAuthenticated = customEvent.detail?.isAuthenticated;
    
    if (isAuthenticated !== undefined) {
      // Update refresh timer based on new state
      if (isAuthenticated) {
        this.setupRefreshTimer();
      } else if (this.refreshTimeoutId) {
        clearTimeout(this.refreshTimeoutId);
        this.refreshTimeoutId = null;
      }
    }
  };
}

// Export as singleton instance
export const TokenService = new TokenServiceClass();

// Also export as tokenService for compatibility with existing code
export const tokenService = TokenService;

// Export types
export type { TokenUser, TokenInfo };

// Default export
export default TokenService;