'use client';

import { AuthClientService } from '@/infrastructure/clients/AuthClientService';
import Cookies from '../../../node_modules/@types/js-cookie';

// Import TokenManager properly
import { TokenManager } from './TokenManager';

/**
 * Client-side token manager
 * Provides a simplified interface for token management with secure token storage
 * and automatic synchronization with TokenManager
 */
export class ClientTokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly EXPIRES_AT_KEY = 'expiresAt';
  
  // Track initialization state
  private static _initialized = false;
  private static _initializePromise: Promise<void> | null = null;
  
  /**
   * Initialize the ClientTokenManager
   * @returns Promise that resolves when initialization is complete
   */
  static async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this._initialized) {
      return Promise.resolve();
    }
    
    // If initialization is in progress, return the existing promise
    if (this._initializePromise) {
      return this._initializePromise;
    }
    
    // Create a new initialization promise
    this._initializePromise = (async () => {
      try {
        console.log('ClientTokenManager: Initializing...');
        
        // Synchronize tokens with TokenManager
        await TokenManager.synchronizeTokens(true);
        
        // Mark as initialized
        this._initialized = true;
        console.log('ClientTokenManager: Initialization complete');
      } catch (error) {
        console.error('ClientTokenManager: Initialization error:', error);
        // Don't mark as initialized on error
      } finally {
        // Clear the promise reference
        this._initializePromise = null;
      }
    })();
    
    return this._initializePromise;
  }
  
  /**
   * Set tokens both in cookies and localStorage backup
   * @param accessToken Access token
   * @param refreshToken Refresh token
   * @param expiresIn Expiration time in seconds
   */
  static setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const secure = process.env.NODE_ENV === 'production';
    
    console.log(`Setting tokens with expiration of ${expiresIn} seconds`);
    
    try {
      // Store in cookies securely - use multiple variants for compatibility
      // URL encode token values to prevent cookie parsing issues
      const encodedAccessToken = encodeURIComponent(accessToken);
      const encodedRefreshToken = encodeURIComponent(refreshToken);
      
      // Auth token variants
      Cookies.set(this.ACCESS_TOKEN_KEY, encodedAccessToken, { 
        secure: secure,
        sameSite: 'lax', // Changed from strict to lax for better compatibility
        path: '/', // Ensure available for all requests
        expires: new Date(Date.now() + expiresIn * 1000) // Explicit expiry
      });
      
      // Additional auth token variants for compatibility
      Cookies.set('auth_token', encodedAccessToken, {
        secure: secure,
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + expiresIn * 1000)
      });
      
      Cookies.set('auth_token_access', encodedAccessToken, {
        secure: secure,
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + expiresIn * 1000)
      });
      
      Cookies.set('access_token', encodedAccessToken, {
        secure: secure,
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + expiresIn * 1000)
      });
      
      // Refresh token variants
      Cookies.set(this.REFRESH_TOKEN_KEY, encodedRefreshToken, { 
        secure: secure,
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + expiresIn * 10 * 1000) // Longer expiry for refresh token
      });
      
      Cookies.set('refresh_token', encodedRefreshToken, {
        secure: secure,
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + expiresIn * 10 * 1000)
      });
      
      Cookies.set('refresh_token_access', encodedRefreshToken, {
        secure: secure,
        sameSite: 'lax',
        path: '/',
        expires: new Date(Date.now() + expiresIn * 10 * 1000)
      });
      
      // Expiry metadata
      Cookies.set(this.EXPIRES_AT_KEY, expiresAt, { 
        secure: secure,
        sameSite: 'lax',
        path: '/'
      });
    } catch (cookieError) {
      console.warn('Error setting cookies:', cookieError);
      // Continue anyway to ensure localStorage backups are set
    }
    
    // Also store in localStorage as fallback (TokenManager uses these)
    try {
      localStorage.setItem('auth_token_backup', accessToken);
      localStorage.setItem('auth_token', accessToken); // For legacy compatibility
      localStorage.setItem('refresh_token_backup', refreshToken);
      localStorage.setItem('auth_timestamp', Date.now().toString());
      localStorage.setItem('auth_expires_at', expiresAt); // Store expiry time in localStorage
      localStorage.setItem('auth_expires_in', expiresIn.toString()); // Store original expiry duration
    } catch (storageError) {
      console.warn('Error setting localStorage backups:', storageError);
    }
    
    // Notify TokenManager about the change - use a longer delay to ensure all cookies are set
    setTimeout(async () => {
      try {
        // Ensure TokenManager synchronizes after setting tokens
        await TokenManager.synchronizeTokens(true);
        
        // Notify about auth change after synchronization
        setTimeout(() => {
          TokenManager.notifyAuthChange(true);
        }, 50);
      } catch (err) {
        console.warn('Error notifying TokenManager after setting tokens:', err);
      }
    }, 100);
  }
  
  /**
   * Get current access token
   */
  static getAccessToken(): string | null {
    try {
      // First try cookies
      const token = Cookies.get(this.ACCESS_TOKEN_KEY) || 
                  Cookies.get('auth_token') || 
                  Cookies.get('auth_token_access') || 
                  Cookies.get('access_token');
      
      if (token) {
        try {
          // Attempt to decode if URL encoded
          return decodeURIComponent(token);
        } catch (decodeError) {
          console.warn('Error decoding cookie token, returning as-is:', decodeError);
          return token;
        }
      }
      
      // Fall back to localStorage
      return localStorage.getItem('auth_token_backup');
    } catch (error) {
      console.warn('Error getting access token:', error);
      return null;
    }
  }
  
  /**
   * Get current refresh token
   */
  static getRefreshToken(): string | null {
    try {
      // First try cookies
      const token = Cookies.get(this.REFRESH_TOKEN_KEY) || 
                  Cookies.get('refresh_token') || 
                  Cookies.get('refresh_token_access');
      
      if (token) {
        try {
          // Attempt to decode if URL encoded
          return decodeURIComponent(token);
        } catch (decodeError) {
          console.warn('Error decoding cookie token, returning as-is:', decodeError);
          return token;
        }
      }
      
      // Fall back to localStorage
      return localStorage.getItem('refresh_token_backup');
    } catch (error) {
      console.warn('Error getting refresh token:', error);
      return null;
    }
  }
  
  /**
   * Clear all auth tokens and notify TokenManager
   * Comprehensive cleanup of all token variants
   */
  static clearTokens() {
    console.log('Clearing all auth tokens');
    
    try {
      // Clear cookie variants for access token
      Cookies.remove(this.ACCESS_TOKEN_KEY, { path: '/' });
      Cookies.remove('auth_token', { path: '/' });
      Cookies.remove('auth_token_access', { path: '/' });
      Cookies.remove('access_token', { path: '/' });
      Cookies.remove('accessToken', { path: '/' });
      
      // Clear cookie variants for refresh token
      Cookies.remove(this.REFRESH_TOKEN_KEY, { path: '/' });
      Cookies.remove('refresh_token', { path: '/' });
      Cookies.remove('refresh_token_access', { path: '/' });
      Cookies.remove('refresh', { path: '/' });
      
      // Clear expiry metadata
      Cookies.remove(this.EXPIRES_AT_KEY, { path: '/' });
      
      // Also clear HTTP-only cookies via document.cookie for maximum compatibility
      // Access token variants
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'auth_token_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Refresh token variants
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (cookieError) {
      console.warn('Error clearing cookies:', cookieError);
      // Continue to localStorage clearing
    }
    
    try {
      // Clear localStorage backup
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_backup');
      localStorage.removeItem('refresh_token_backup');
      localStorage.removeItem('auth_timestamp');
      localStorage.removeItem('auth_expires_at');
      localStorage.removeItem('auth_expires_in');
    } catch (storageError) {
      console.warn('Error clearing localStorage:', storageError);
    }
    
    // Verify cookie removal
    console.debug('Cookies after clearing:', document.cookie);
    
    // Notify TokenManager
    setTimeout(async () => {
      try {
        await TokenManager.notifyAuthChange(false);
      } catch (err) {
        console.warn('Error notifying TokenManager after clearing tokens:', err);
      }
    }, 50);
  }
  
  /**
   * Check if the access token is expired
   */
  static isTokenExpired(): boolean {
    try {
      // Check localStorage first as it's more reliable
      const storedExpiresAt = localStorage.getItem('auth_expires_at');
      if (storedExpiresAt) {
        const expiryTime = new Date(storedExpiresAt).getTime();
        const currentTime = Date.now();
        
        // Add a 5-second buffer to avoid edge cases
        return currentTime >= expiryTime - 5000;
      }
      
      // Fall back to cookie if localStorage not available
      const expiresAt = Cookies.get(this.EXPIRES_AT_KEY);
      if (!expiresAt) return true;
      
      const expiryTime = new Date(expiresAt).getTime();
      const currentTime = Date.now();
      
      // Add a 5-second buffer to avoid edge cases
      return currentTime >= expiryTime - 5000;
    } catch (error) {
      console.warn('Error checking token expiration:', error);
      return true; // Assume expired on error
    }
  }
  
  /**
   * Refresh the access token using multiple strategies:
   * 1. Try using TokenManager's refresh method first
   * 2. Fall back to direct API call if TokenManager fails
   * 3. Update both TokenManager and local cookies on success
   * 
   * @returns Promise resolving to true if refresh was successful
   */
  private static refreshInProgress: boolean = false;
  private static refreshPromise: Promise<boolean> | null = null;
  private static lastRefreshAttempt: number = 0;
  private static readonly MIN_REFRESH_INTERVAL = 2000; // Minimum interval between refresh attempts (2 seconds)
  private static refreshCallbacks: Array<(success: boolean) => void> = [];
  
  static async refreshAccessToken(): Promise<boolean> {
    console.log('ClientTokenManager: Starting token refresh process');
    
    // Prevent concurrent refresh calls
    if (this.refreshInProgress && this.refreshPromise) {
      console.log('Token refresh already in progress, waiting for completion');
      
      // Register for notification when the current promise completes
      return new Promise<boolean>((resolve) => {
        this.refreshCallbacks.push(resolve);
      });
    }
    
    // Rate limit refresh attempts
    const now = Date.now();
    if (now - this.lastRefreshAttempt < this.MIN_REFRESH_INTERVAL) {
      console.log(`Token refresh attempted too soon (within ${this.MIN_REFRESH_INTERVAL}ms), throttling`);
      return false;
    }
    
    // Update last attempt timestamp
    this.lastRefreshAttempt = now;
    
    // Set flags to prevent concurrent refreshes
    this.refreshInProgress = true;
    
    // Create and store the refresh promise
    this.refreshPromise = this._refreshTokenInternal()
      .then(result => {
        // Notify all waiting callbacks
        const callbacks = [...this.refreshCallbacks];
        this.refreshCallbacks = [];
        callbacks.forEach(callback => callback(result));
        return result;
      })
      .finally(() => {
        // Clear flags when complete
        setTimeout(() => {
          this.refreshInProgress = false;
          this.refreshPromise = null;
        }, 500);
      });
    
    return this.refreshPromise;
  }
  
  /**
   * Internal implementation of token refresh logic
   * @returns Promise resolving to true if refresh was successful
   */
  private static async _refreshTokenInternal(): Promise<boolean> {
    console.log('Starting token refresh process');
    
    // Generate a unique request ID for tracking
    const requestId = `token-refresh-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // First try using TokenManager's refresh method
    try {
      // Ensure tokens are synchronized
      const syncResult = await TokenManager.synchronizeTokens(true);
      console.log('Token synchronization result:', { syncResult, requestId });
      
      // Check for existing tokens after synchronization
      const hasAuthTokenAfterSync = !!localStorage.getItem('auth_token_backup');
      const hasRefreshTokenAfterSync = !!localStorage.getItem('refresh_token_backup');
      
      console.log('Token status after synchronization:', { 
        hasAuthTokenAfterSync, 
        hasRefreshTokenAfterSync,
        requestId 
      });
      
      // Try TokenManager refresh first with improved error handling
      try {
        const refreshResult = await TokenManager.refreshAccessToken();
        
        if (refreshResult) {
          console.log('Token refreshed successfully via TokenManager');
          return true;
        }
      } catch (tokenManagerError) {
        console.warn('TokenManager refresh failed, trying direct API call', tokenManagerError);
        // Continue to next approach instead of failing
      }
    } catch (syncError) {
      console.warn('Token synchronization failed during refresh:', syncError);
      // Continue despite sync failure
    }
    
    // Fall back to our implementation if TokenManager fails
    const refreshToken = this.getRefreshToken();
    const backupToken = localStorage.getItem('refresh_token_backup');
    
    // Try with cookie token first
    if (refreshToken) {
      try {
        console.log('Attempting token refresh with token from cookie');
        const response = await this.makeRefreshRequest(refreshToken, requestId);
        if (response) return true;
      } catch (cookieError) {
        console.error('Error refreshing token with cookie token:', cookieError);
      }
    }
    
    // If no cookie token or refresh failed, try with backup token
    if (backupToken && (!refreshToken || refreshToken !== backupToken)) {
      try {
        console.log('Attempting token refresh with backup token from localStorage');
        const response = await this.makeRefreshRequest(backupToken, requestId);
        if (response) return true;
      } catch (backupError) {
        console.error('Error refreshing token with backup token:', backupError);
      }
    }
    
    // If we get here, all refresh attempts failed
    console.warn('All token refresh attempts failed');
    return false;
  }
  
  /**
   * Helper to make the actual refresh request
   * @param refreshToken The token to use for refresh
   * @param requestId Optional request ID for tracking
   * @returns Promise resolving to true if successful
   */
  private static async makeRefreshRequest(refreshToken: string, requestId?: string): Promise<boolean> {
    try {
      // Get the current origin to avoid cross-origin issues
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      // Ensure we have the correct refresh token URL - avoid duplicate /api/ issues
      let refreshUrl = `${origin}/api/auth/refresh`;
      
      // Handle development environment where we might need to use a different URL
      // Sometimes in development the API runs on a different port
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        const currentPort = window.location.port;
        // If we're using a non-standard port in dev, make sure it's included
        if (currentPort && currentPort !== '80' && currentPort !== '443') {
          refreshUrl = `${window.location.protocol}//${window.location.hostname}:${currentPort}/api/auth/refresh`;
        }
      }
      
      // Add cache-busting query parameter
      const cacheBuster = Date.now();
      refreshUrl = `${refreshUrl}?_=${cacheBuster}`;
      
      console.log('Using refresh URL:', refreshUrl);
      try {
        // First ensure we have all cookies synchronized
        await TokenManager.synchronizeTokens(true);
        
        // Try a direct fetch first for better reliability
        try {
          console.log('Making direct fetch for token refresh');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          // Check cookies before making the request
          if (typeof document !== 'undefined') {
            const cookieCount = document.cookie.split(';').length;
            const cookieNames = document.cookie.split(';')
              .map(c => c.trim().split('=')[0])
              .filter(Boolean);
              
            console.debug('Cookies available before refresh request', { 
              count: cookieCount,
              names: cookieNames
            });
          }
          
          // Properly encode refreshToken in the body
          const encodedToken = encodeURIComponent(refreshToken);
          
          // Add more diagnostic headers
          const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Refresh-Request': 'true',
            'Pragma': 'no-cache',
            'X-Request-ID': requestId || `refresh-${Date.now()}`,
            'X-Client-Time': new Date().toISOString()
          };
          
          const response = await fetch(refreshUrl, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({ refreshToken }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Log response headers for debugging
          const responseHeaders: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });
          console.debug('Refresh response headers', { responseHeaders });
          
          // Check for various types of responses
          if (response.ok) {
            try {
              const data = await response.json();
              if (data.success && data.data) {
                console.log('Token refresh successful via direct fetch');
                // Successfully refreshed token
                this.setTokens(
                  data.data.accessToken,
                  data.data.refreshToken,
                  data.data.expiresIn || 3600
                );
                
                // After setting tokens, make sure they're properly synchronized
                await TokenManager.synchronizeTokens(true);
                
                // Notify about successful token refresh
                setTimeout(() => {
                  TokenManager.notifyAuthChange(true);
                }, 100);
                
                return true;
              } else {
                console.warn('Refresh response indicated success but had invalid data format');
                console.debug('Refresh response data:', data);
              }
            } catch (parseError) {
              console.warn('Error parsing token refresh response:', parseError);
              // Continue to fallback
            }
          } else {
            // Get more detail from the error response
            let responseText = '';
            try {
              responseText = await response.text();
            } catch (e) { /* Ignore text parsing errors */ }
            
            console.warn(`Token refresh failed with status: ${response.status}`, { responseText });
            
            // For 401/403 responses, we should clear tokens
            if (response.status === 401 || response.status === 403) {
              console.warn('Authorization failed during token refresh, clearing tokens');
              this.clearTokens();
            }
          }
        } catch (fetchError) {
          // Check for timeout
          if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
            console.warn('Token refresh request timed out');
          } else {
            console.warn('Direct fetch for token refresh failed, falling back to AuthClientService:', fetchError);
          }
        }
        
        // Fall back to AuthClientService if direct fetch fails
        try {
          // Log the fallback attempt
          console.log('Falling back to AuthClientService for token refresh');
          
          // Create a more structured request through the API client
          const response = await AuthClientService.refreshToken({ 
            refreshToken: refreshToken
          });
          
          // Check the response format and extract tokens
          if (!response) {
            console.error('AuthClientService returned empty response');
            throw new Error('Authentication required');
          }
          
          if (response.accessToken && response.refreshToken) {
            console.log('Token refresh successful via AuthClientService');
            
            this.setTokens(
              response.accessToken,
              response.refreshToken,
              response.expiresIn || 3600
            );
            
            // After setting tokens, ensure they're synchronized
            await TokenManager.synchronizeTokens(true);
            
            // Notify about auth change after a short delay
            setTimeout(() => {
              TokenManager.notifyAuthChange(true);
            }, 100);
            
            return true;
          }
          
          console.warn('AuthClientService response missing required token data');
          return false;
        } catch (apiError) {
          console.error('Error in AuthClientService.refreshToken:', apiError);
          
          // If it's an auth error, clear tokens
          if (apiError instanceof Error && 
              (apiError.message.includes('Authentication required') || 
               apiError.message.includes('Unauthorized'))) {
            console.warn('Authentication error during token refresh, clearing tokens');
            this.clearTokens();
          }
          
          throw apiError;
        }
      } catch (error) {
        console.error('Error in makeRefreshRequest:', error);
        return false;
      }
    } catch (error) {
      console.error('Error in makeRefreshRequest:', error);
      return false;
    }
  }
  
  /**
   * Check if the user is logged in with valid tokens
   * Performs token refresh if needed
   * 
   * @returns Promise resolving to true if user is logged in
   */
  static async isLoggedIn(): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) return false;
      
      // If token is expired, try to refresh it
      if (this.isTokenExpired()) {
        return await this.refreshAccessToken();
      }
      
      return true;
    } catch (error) {
      console.warn('Error checking login status:', error);
      return false;
    }
  }
  
  /**
   * Log the user out by clearing tokens and notifying TokenManager
   * 
   * @param allDevices Whether to log out from all devices
   * @returns Promise resolving to true if logout was successful
   */
  static async logout(allDevices: boolean = false): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      
      // Clear tokens first for immediate UI feedback
      this.clearTokens();
      
      // Call the logout API if we have a refresh token
      if (refreshToken) {
        try {
          const response = await AuthClientService.logout(0, { refreshToken, allDevices });
          return response.success;
        } catch (error) {
          console.error('Error during logout:', error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure tokens are cleared even if API call fails
      this.clearTokens();
      return false;
    }
  }
}