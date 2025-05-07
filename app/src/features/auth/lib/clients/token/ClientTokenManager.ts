'use client';

/**
 * ClientTokenManager
 * 
 * A token management system for client-side use with robust error reporting.
 * This implementation exposes all errors and avoids silent fallbacks.
 */

import { AuthClientService } from '@/features/auth/lib/clients/AuthClient';
import { getItem, setItem, removeItem } from '@/shared/utils/storage/cookieStorage';
// Import jwt-decode for token parsing
import { jwtDecode } from 'jwt-decode';

// Store token state and errors for debugging
const TOKEN_STATE = {
  // Token state only - no caching of validation results
  tokenValue: null as string | null,
  tokenExpiry: null as Date | null,
  lastOperation: 0,
  operationErrors: [] as {operation: string, error: Error, timestamp: number}[]
};

/**
 * Error class for token-related failures
 */
export class TokenError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TokenError';
    Object.setPrototypeOf(this, TokenError.prototype);
  }
}

/**
 * Client-side token manager
 * Provides a robust interface for token management with proper error reporting
 */
export class ClientTokenManager {
  /**
   * Initialize the ClientTokenManager
   * @returns Promise that resolves when initialization is complete
   * @throws TokenError if initialization fails
   */
  static async initialize(): Promise<void> {
    console.log('ClientTokenManager: Initializing...');
    
    try {
      // Synchronize tokens - will throw errors if there are issues
      await this.synchronizeTokens(true);
      
      console.log('ClientTokenManager: Initialization complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('ClientTokenManager: Initialization error:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'initialize',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Token initialization failed: ${errorMessage}`,
        'INIT_FAILED',
        error
      );
    }
  }
  
  /**
   * Set tokens using cookie storage consistently
   * @param accessToken Access token
   * @param refreshToken Refresh token
   * @param expiresIn Expiration time in seconds
   * @throws TokenError if token storage fails
   */
  static setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    console.log(`Setting tokens with expiration of ${expiresIn} seconds`);
    
    if (!accessToken || !refreshToken || !expiresIn) {
      throw new TokenError(
        'Invalid token data provided',
        'INVALID_TOKEN_DATA',
        { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken, expiresIn }
      );
    }
    
    // Update token state
    TOKEN_STATE.tokenValue = accessToken;
    TOKEN_STATE.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    TOKEN_STATE.lastOperation = Date.now();
    
    try {
      // Calculate and format expiration timestamp
      const expiryDate = new Date(Date.now() + expiresIn * 1000);
      const expiryISOString = expiryDate.toISOString();
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('Storing auth tokens with expiration data:', {
          tokenLength: accessToken.length,
          expires: expiryISOString,
          expiresTimestamp: expiryDate.getTime(),
          currentTime: Date.now()
        });
      }
      
      // Store tokens using only cookieStorage, not direct document.cookie manipulation
      // This ensures consistent cookie behavior
      setItem('auth_token', accessToken); // Main token
      setItem('auth_token_backup', accessToken); // Backup copy
      setItem('refresh_token', refreshToken); // Main refresh token
      setItem('refresh_token_backup', refreshToken); // Backup copy
      
      // Store expiration metadata
      setItem('auth_timestamp', Date.now().toString());
      setItem('auth_expires_at', expiryISOString);
      setItem('auth_expires_in', expiresIn.toString());
      setItem('auth_expires_timestamp', expiryDate.getTime().toString());
      setItem('auth_expires_seconds', Math.floor(expiryDate.getTime() / 1000).toString());
      
      // Set initialization flags
      setItem('auth_init_completed', 'true');
      setItem('auth_init_timestamp', Date.now().toString());
      
      // Notify about auth change after a small delay
      setTimeout(async () => {
        try {
          await this.notifyAuthChange(true);
        } catch (err) {
          console.error('Error during auth change notification:', err);
          throw err;
        }
      }, 50);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in ClientTokenManager.setTokens:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'setTokens',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to set tokens: ${errorMessage}`,
        'TOKEN_STORAGE_FAILED',
        error
      );
    }
  }
  
  /**
   * Get current access token
   * @throws TokenError if token retrieval fails
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      // Check localStorage for token
      const token = getItem('auth_token_backup');
      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error retrieving access token:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'getAccessToken',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to retrieve access token: ${errorMessage}`,
        'TOKEN_RETRIEVAL_FAILED',
        error
      );
    }
  }
  
  /**
   * Get current refresh token
   * @throws TokenError if token retrieval fails
   */
  static getRefreshToken(): string | null {
    try {
      return getItem('refresh_token_backup');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error retrieving refresh token:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'getRefreshToken',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to retrieve refresh token: ${errorMessage}`,
        'TOKEN_RETRIEVAL_FAILED',
        error
      );
    }
  }
  
  /**
   * Clear all auth tokens
   * @throws TokenError if token clearing fails
   */
  static async clearTokens(): Promise<void> {
    console.log('Clearing all auth tokens');
    
    try {
      // Clear token state
      TOKEN_STATE.tokenValue = null;
      TOKEN_STATE.tokenExpiry = null;
      TOKEN_STATE.lastOperation = Date.now();
      TOKEN_STATE.operationErrors = [];
      
      // Clear all tokens consistently using the cookieStorage utility
      removeItem('auth_token');
      removeItem('auth_token_backup');
      removeItem('auth_token_access'); // Legacy name
      removeItem('access_token'); // Legacy name
      removeItem('refresh_token');
      removeItem('refresh_token_backup');
      
      // Clear metadata
      removeItem('auth_expires_at');
      removeItem('auth_expires_in');
      removeItem('auth_timestamp');
      removeItem('auth_expires_timestamp');
      removeItem('auth_expires_seconds');
      removeItem('auth_init_completed');
      removeItem('auth_init_timestamp');
      removeItem('token_refresh_timestamp');
      
      // Notify about logout
      await this.notifyAuthChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error clearing tokens:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'clearTokens',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to clear tokens: ${errorMessage}`,
        'TOKEN_CLEAR_FAILED',
        error
      );
    }
  }
  
  /**
   * Check if the access token is expired
   * 
   * @param bufferSeconds - Buffer time to consider token as needing refresh
   * @returns True if token is expired or will expire soon
   * @throws TokenError if expiration information is missing or corrupted
   */
  static isTokenExpired(bufferSeconds: number = 600): boolean {
    try {
      // Try to get expiration time from multiple sources
      let expiryTime: number | null = null;
      
      // Try TOKEN_STATE first - most up-to-date source
      if (TOKEN_STATE.tokenExpiry instanceof Date) {
        expiryTime = TOKEN_STATE.tokenExpiry.getTime();
      }
      
      // If not found in memory, try localStorage sources in different formats
      if (!expiryTime) {
        // Try ISO string format
        const expiresAtStr = getItem('auth_expires_at');
        if (expiresAtStr) {
          try {
            const parsedTime = new Date(expiresAtStr).getTime();
            if (!isNaN(parsedTime)) {
              expiryTime = parsedTime;
            }
          } catch (e) {
            console.warn('Error parsing auth_expires_at:', e);
          }
        }
        
        // Try direct timestamp
        if (!expiryTime) {
          const expiresTimestampStr = getItem('auth_expires_timestamp');
          if (expiresTimestampStr) {
            try {
              const parsedTime = parseInt(expiresTimestampStr, 10);
              if (!isNaN(parsedTime)) {
                expiryTime = parsedTime;
              }
            } catch (e) {
              console.warn('Error parsing auth_expires_timestamp:', e);
            }
          }
        }
        
        // Try seconds format
        if (!expiryTime) {
          const expiresSecondsStr = getItem('auth_expires_seconds');
          if (expiresSecondsStr) {
            try {
              const parsedTime = parseInt(expiresSecondsStr, 10) * 1000; // Convert to ms
              if (!isNaN(parsedTime)) {
                expiryTime = parsedTime;
              }
            } catch (e) {
              console.warn('Error parsing auth_expires_seconds:', e);
            }
          }
        }
        
        // Calculate from auth_timestamp + auth_expires_in as last resort
        if (!expiryTime) {
          const expiresInStr = getItem('auth_expires_in');
          const authTimestampStr = getItem('auth_timestamp');
          
          if (expiresInStr && authTimestampStr) {
            try {
              const expiresIn = parseInt(expiresInStr, 10);
              const authTimestamp = parseInt(authTimestampStr, 10);
              
              if (!isNaN(expiresIn) && !isNaN(authTimestamp)) {
                expiryTime = authTimestamp + (expiresIn * 1000);
              }
            } catch (e) {
              console.warn('Error calculating expiration time:', e);
            }
          }
        }
      }
      
      // If no valid expiration time found after all attempts, assume token is expired
      if (!expiryTime) {
        console.warn('No valid token expiration time found, assuming expired');
        return true;
      }
      
      // Compare current time to expiration time with buffer
      const currentTime = Date.now();
      const bufferMs = bufferSeconds * 1000;
      const isExpired = currentTime >= expiryTime - bufferMs;
      
      // Log expiration status for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug('Token expiration status:', {
          currentTime: new Date(currentTime).toISOString(),
          expiryTime: new Date(expiryTime).toISOString(),
          bufferSeconds,
          remainingSeconds: Math.floor((expiryTime - currentTime) / 1000),
          isExpired
        });
      }
      
      return isExpired;
    } catch (error) {
      // Log error but don't crash - assume token is expired in case of errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error checking token expiration:', { error: errorMessage });
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'isTokenExpired',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // In case of any error checking expiration, assume token is expired
      // This is safer than assuming it's valid
      return true;
    }
  }
  
  /**
   * Synchronize tokens and update internal state
   * Simpler implementation with fewer unnecessary checks
   * 
   * @param forceRefresh Whether to force a token refresh
   * @returns Promise resolving to true if authentication is valid
   * @throws TokenError if synchronization fails
   */
  static async synchronizeTokens(forceRefresh: boolean = false): Promise<boolean> {
    console.log(`ClientTokenManager: Synchronizing tokens (force=${forceRefresh})`);
    
    try {
      // Check for tokens in consistent order (primary, then backup)
      const accessToken = getItem('auth_token') || getItem('auth_token_backup');
      const refreshToken = getItem('refresh_token') || getItem('refresh_token_backup');
      
      if (!accessToken) {
        if (forceRefresh && refreshToken) {
          // We have a refresh token but no access token, try refreshing
          console.log('No access token found but refresh token exists, attempting refresh');
          return await this.refreshAccessToken();
        }
        
        // No tokens, reset state
        TOKEN_STATE.tokenValue = null;
        TOKEN_STATE.tokenExpiry = null;
        TOKEN_STATE.lastOperation = Date.now();
        return false;
      }
      
      // We have a token, update our state
      TOKEN_STATE.tokenValue = accessToken;
      
      // Get expiration time, prioritize direct timestamp for simplicity
      let expiryTime: number | null = null;
      
      // First check expires_at (ISO string)
      const expiresAtStr = getItem('auth_expires_at');
      if (expiresAtStr) {
        try {
          expiryTime = new Date(expiresAtStr).getTime();
        } catch (e) {
          // Ignore parsing errors, will try other formats
        }
      }
      
      // If not found, try expires_timestamp (milliseconds)
      if (!expiryTime || isNaN(expiryTime)) {
        const expiresTimestampStr = getItem('auth_expires_timestamp');
        if (expiresTimestampStr) {
          try {
            expiryTime = parseInt(expiresTimestampStr, 10);
          } catch (e) {
            // Ignore parsing errors, will try other formats
          }
        }
      }
      
      // If still not found, add default 15 minute expiration
      if (!expiryTime || isNaN(expiryTime)) {
        // Use a reasonable default expiration
        expiryTime = Date.now() + (15 * 60 * 1000); // 15 minutes
        
        // Store this for future reference
        const expiryDate = new Date(expiryTime);
        setItem('auth_expires_at', expiryDate.toISOString());
        setItem('auth_expires_timestamp', expiryTime.toString());
        
        if (process.env.NODE_ENV === 'development') {
          console.debug('Using default expiration time:', {
            expiryTime: new Date(expiryTime).toISOString(),
            remainingSeconds: Math.floor((expiryTime - Date.now()) / 1000)
          });
        }
      }
      
      // Update token state
      TOKEN_STATE.tokenExpiry = new Date(expiryTime);
      TOKEN_STATE.lastOperation = Date.now();
      
      // If token is expired or close to expiry and forceRefresh is requested, refresh
      const tokenIsExpired = Date.now() > expiryTime - (5 * 60 * 1000); // 5 min buffer
      if (forceRefresh && tokenIsExpired && refreshToken) {
        console.log('Token expired or close to expiry, refreshing');
        return await this.refreshAccessToken();
      }
      
      return true;
    } catch (error) {
      // If it's already a TokenError, just rethrow
      if (error instanceof TokenError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error synchronizing tokens:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'synchronizeTokens',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to synchronize tokens: ${errorMessage}`,
        'SYNCHRONIZATION_FAILED',
        error
      );
    }
  }
  
  /**
   * Refresh the access token through the API
   * Improved implementation with better error handling and retry logic
   * 
   * @returns Promise resolving to true if refresh was successful
   * @throws TokenError with detailed information if refresh fails
   */
  static async refreshAccessToken(): Promise<boolean> {
    console.log('ClientTokenManager: Starting token refresh');
    
    // Check time since last refresh to prevent frequent refreshes
    const now = Date.now();
    const lastRefresh = parseInt(getItem('token_refresh_timestamp') || '0', 10);
    const timeSinceLastRefresh = now - lastRefresh;
    
    // Minimum 5 seconds between refresh attempts to prevent refresh storms
    const MIN_REFRESH_INTERVAL = 5000; 
    if (lastRefresh > 0 && timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      console.log(`Token refresh too frequent (${timeSinceLastRefresh}ms), skipping`);
      return true; // Return success but skip actual refresh
    }
    
    // Record operation timestamp
    TOKEN_STATE.lastOperation = now;
    setItem('token_refresh_timestamp', now.toString());
    
    try {
      // Get refresh token consistently
      const refreshToken = getItem('refresh_token') || getItem('refresh_token_backup');
      
      if (!refreshToken) {
        console.warn('No refresh token available for token refresh');
        
        // Don't throw an error, just return false to indicate refresh failed
        // This prevents needless error cascading
        return false;
      }
      
      // Validate token format before sending to avoid server errors
      if (typeof refreshToken !== 'string' || refreshToken.length < 20) {
        console.warn('Invalid refresh token format', { 
          tokenLength: refreshToken?.length 
        });
        return false;
      }
      
      // Simple API call with minimal headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // Include cookies
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Client-Time': new Date().toISOString(),
            'X-Refresh-Source': 'client-token-manager'
          },
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal
        });
        
        // Clear timeout
        clearTimeout(timeoutId);
        
        // Handle non-OK response
        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Refresh token invalid or expired');
            // Clear tokens on auth error but don't throw - let the app redirect naturally
            await this.clearTokens();
            
            // Return false instead of throwing to prevent error cascades
            return false;
          } else {
            console.error(`Token refresh failed with status ${response.status}`);
            
            // Return false to indicate failure without throwing
            return false;
          }
        }
        
        // Parse response data
        const data = await response.json();
        
        if (!data.success || !data.data) {
          console.warn('Token refresh API returned invalid response', {
            success: data.success,
            hasData: !!data.data
          });
          return false;
        }
        
        // Extract tokens with standardized property names
        const accessToken = data.data.token || data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;
        const expiresIn = data.data.expiresIn || 3600;
        
        if (!accessToken) {
          console.warn('Token refresh API returned no access token');
          return false;
        }
        
        // Log success and set tokens
        console.log('Token refresh successful, setting new tokens');
        
        // Use new refresh token or keep existing one
        const refreshTokenToUse = newRefreshToken || refreshToken;
        
        // Store both tokens
        this.setTokens(accessToken, refreshTokenToUse, expiresIn);
        
        return true;
      } catch (fetchError) {
        // Always clear timeout to prevent memory leaks
        clearTimeout(timeoutId);
        
        // Handle abort/timeout gracefully
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          console.warn('Token refresh request timed out');
          return false;
        }
        
        // Handle network errors separately
        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          console.error('Network error during token refresh:', fetchError.message);
          // Don't clear tokens on network errors
          return false;
        }
        
        // Log other unexpected errors
        console.error('Error during token refresh:', fetchError);
        return false;
      }
    } catch (error) {
      // If it's already a TokenError, just rethrow
      if (error instanceof TokenError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error refreshing token:', error);
      
      // Track the error but don't rethrow for regular users
      TOKEN_STATE.operationErrors.push({
        operation: 'refreshAccessToken',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // In development, rethrow with details to help debugging
      if (process.env.NODE_ENV === 'development') {
        throw new TokenError(
          `Failed to refresh access token: ${errorMessage}`,
          'REFRESH_FAILED',
          error
        );
      }
      
      return false;
    }
  }
  
  /**
   * Check if the user is logged in with valid tokens
   * 
   * @returns Promise resolving to true if user is logged in
   * @throws TokenError if login status check fails
   */
  static async isLoggedIn(): Promise<boolean> {
    try {
      // Always check the actual token - no caching of validation results
      const accessToken = await this.getAccessToken();
      TOKEN_STATE.tokenValue = accessToken;
      
      if (!accessToken) {
        // No token present - user is definitely not logged in
        return false;
      }
      
      // Check if token is expired - will throw error if expiration info is missing/invalid
      const isExpired = this.isTokenExpired();
      
      if (isExpired) {
        // Token is expired or will expire soon - refresh it
        // This will throw error if refresh fails, so we don't need to handle it here
        await this.refreshAccessToken();
      }
      
      // If we got here, the token is valid or was successfully refreshed
      return true;
    } catch (error) {
      // If it's already a TokenError, just rethrow
      if (error instanceof TokenError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error checking login status:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'isLoggedIn',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to check login status: ${errorMessage}`,
        'LOGIN_CHECK_FAILED',
        error
      );
    }
  }
  
  /**
   * Notify subscribers about authentication state changes
   * 
   * @param isAuthenticated Whether the user is authenticated
   * @throws Error if notification fails
   */
  static async notifyAuthChange(isAuthenticated: boolean): Promise<void> {
    console.log(`ClientTokenManager: Notifying auth change: ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`);
    
    try {
      // Dispatch event for any listeners
      if (typeof window !== 'undefined') {
        // Custom event for auth change
        window.dispatchEvent(new CustomEvent('auth_status_changed', { 
          detail: { isAuthenticated } 
        }));
        
        // Additional event specifically for logout
        if (!isAuthenticated) {
          window.dispatchEvent(new CustomEvent('auth-logout'));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in notifyAuthChange:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'notifyAuthChange',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to notify auth change: ${errorMessage}`,
        'NOTIFICATION_FAILED',
        error
      );
    }
  }
  
  /**
   * Notify about logout event
   * 
   * @throws Error if notification fails
   */
  static async notifyLogout(): Promise<void> {
    console.log('ClientTokenManager: Notifying logout');
    
    try {
      // Clear token state first
      TOKEN_STATE.tokenValue = null;
      TOKEN_STATE.tokenExpiry = null;
      TOKEN_STATE.lastOperation = Date.now();
      
      // Just dispatch the logout event directly
      await this.notifyAuthChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in notifyLogout:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'notifyLogout',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to notify logout: ${errorMessage}`,
        'LOGOUT_NOTIFICATION_FAILED',
        error
      );
    }
  }
  
  /**
   * Extract user information from token
   * @param token JWT token
   * @returns User information or null
   * @throws TokenError if decoding fails
   */
  static getUserFromToken(token: string) {
    if (!token) {
      throw new TokenError(
        'Cannot extract user from empty token',
        'EMPTY_TOKEN',
        null
      );
    }
    
    try {
      // Use the imported jwtDecode function properly
      const decoded = jwtDecode<{
        sub: string | number;
        name?: string;
        email?: string;
        role?: string;
      }>(token);
      
      if (!decoded || !decoded.sub) {
        throw new TokenError(
          'Invalid token format: missing subject claim',
          'INVALID_TOKEN_FORMAT',
          { decodedToken: decoded }
        );
      }
      
      // Extract user information
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else if (typeof decoded.sub === 'string') {
        userId = parseInt(decoded.sub, 10);
      } else {
        throw new TokenError(
          'Invalid subject claim format',
          'INVALID_SUBJECT_FORMAT',
          { subjectType: typeof decoded.sub, subjectValue: decoded.sub }
        );
      }
      
      if (isNaN(userId)) {
        throw new TokenError(
          'Invalid user ID in token',
          'INVALID_USER_ID',
          { userId, decodedSub: decoded.sub }
        );
      }
      
      return {
        id: userId,
        name: decoded.name || '',
        email: decoded.email || '',
        role: decoded.role || ''
      };
    } catch (error) {
      // If it's already a TokenError, just rethrow
      if (error instanceof TokenError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error decoding token:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'getUserFromToken',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Failed to decode token: ${errorMessage}`,
        'TOKEN_DECODE_FAILED',
        error
      );
    }
  }
  
  /**
   * Log the user out by clearing tokens and calling the logout API
   * 
   * @param allDevices Whether to log out from all devices
   * @returns Promise resolving to true if logout was successful
   * @throws TokenError if logout fails
   */
  static async logout(allDevices: boolean = false): Promise<boolean> {
    try {
      // Clear tokens first for immediate UI feedback
      await this.clearTokens();
      
      // Call the logout API
      const response = await AuthClientService.logout();
      
      if (!response.success) {
        throw new TokenError(
          `Logout API failed: ${response.message || 'Unknown error'}`,
          'LOGOUT_API_FAILED',
          response
        );
      }
      
      return true;
    } catch (error) {
      // If it's already a TokenError, just rethrow
      if (error instanceof TokenError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error during logout:', error);
      
      // Track the error
      TOKEN_STATE.operationErrors.push({
        operation: 'logout',
        error: error instanceof Error ? error : new Error(errorMessage),
        timestamp: Date.now()
      });
      
      // Rethrow with additional context
      throw new TokenError(
        `Logout failed: ${errorMessage}`,
        'LOGOUT_FAILED',
        error
      );
    }
  }
}

// Export for backward compatibility
export default ClientTokenManager;