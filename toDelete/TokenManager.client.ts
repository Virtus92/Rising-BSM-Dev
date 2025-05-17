'use client';

/**
 * Client Token Manager
 * Properly implemented token management for client-side use
 */
import { jwtDecode } from 'jwt-decode';
import { TokenPayloadDto } from '@/domain/dtos/AuthDtos';
import { getLogger } from '@/core/logging';
import { AuthenticationError, NetworkError } from '@/core/errors/types/AppError';
import { 
  ITokenManager, 
  TokenUser, 
  TokenRefreshResult, 
  TokenValidationResult,
  TokenStatus
} from './interfaces/ITokenManager';

/**
 * Client-side Token Manager implementation
 * Uses HTTP-only cookies for token storage with proper error handling
 */
export class ClientTokenManager implements ITokenManager {
  private logger = getLogger();
  private eventListeners: ((isAuthenticated: boolean) => void)[] = [];
  private cachedBaseUrl: string | null = null;
  
  // Tracking successful API calls for troubleshooting
  private lastSuccessfulApiCall: {
    endpoint: string;
    timestamp: number;
    responseStatus: number;
  } | null = null;
  
  // Authentication state tracking
  private authState: {
    isAuthenticated: boolean;
    lastCheck: number;
    consecutiveFailures: number;
  } = {
    isAuthenticated: false,
    lastCheck: 0,
    consecutiveFailures: 0
  };
  
  /**
   * Constructor initializes and caches the base URL to prevent repetitive calculations
   */
  constructor() {
    try {
      // Pre-calculate and cache the base URL
      this.cachedBaseUrl = this.calculateBaseUrl();
      this.logger.debug('TokenManager initialized with base URL:', { baseUrl: this.cachedBaseUrl });
      
      // Schedule a delayed heartbeat to check auth status after initialization
      setTimeout(() => this.authHeartbeat(), 1000);
    } catch (error) {
      this.logger.error('Error initializing TokenManager:', error instanceof Error ? error : String(error));
      // Set a fallback URL
      this.cachedBaseUrl = 'http://localhost:3000';
    }
  }
  
  /**
   * Performs a lightweight auth check and schedules the next one
   * This helps detect auth issues early and recover from them
   */
  private async authHeartbeat() {
    try {
      // Only run heartbeat in client environment
      if (typeof window === 'undefined') return;
      
      // Check time since last heartbeat to prevent excessive checks
      const now = Date.now();
      const timeSinceLastCheck = now - this.authState.lastCheck;
      
      // Only perform check if it's been at least 30 seconds since the last one
      if (timeSinceLastCheck < 30000) {
        // Schedule next heartbeat
        setTimeout(() => this.authHeartbeat(), 30000);
        return;
      }
      
      this.authState.lastCheck = now;
      
      // Perform a lightweight token validation
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/auth/validate?quick=true`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Update tracking based on response
      if (response.ok) {
        // Success - reset failure count and update auth state
        this.lastSuccessfulApiCall = {
          endpoint: 'validate (heartbeat)',
          timestamp: now,
          responseStatus: response.status
        };
        
        this.authState.consecutiveFailures = 0;
        
        // Only update auth state if it's changed
        if (!this.authState.isAuthenticated) {
          this.authState.isAuthenticated = true;
          await this.notifyAuthChange(true);
        }
      } else {
        // Failure - increment count and potentially notify
        this.authState.consecutiveFailures++;
        
        // If we've had 3 consecutive failures, update auth state if needed
        if (this.authState.consecutiveFailures >= 3 && this.authState.isAuthenticated) {
          this.authState.isAuthenticated = false;
          await this.notifyAuthChange(false);
        }
      }
    } catch (error) {
      this.logger.debug('Auth heartbeat check failed:', error as Error);
      // Don't update state on network errors to prevent false logout events
    } finally {
      // Always schedule the next heartbeat
      setTimeout(() => this.authHeartbeat(), 30000);
    }
  }
  
  /**
   * Helper method to get the base URL for API calls
   * Uses cached value first, falls back to calculation if needed
   */
  private getBaseUrl(): string {
    // Return cached value if available
    if (this.cachedBaseUrl) {
      return this.cachedBaseUrl;
    }
    
    // Calculate and cache the value if not available
    try {
      this.cachedBaseUrl = this.calculateBaseUrl();
      return this.cachedBaseUrl;
    } catch (error) {
      this.logger.error('Error getting base URL', error instanceof Error ? error : String(error));
      return 'http://localhost:3000';
    }
  }
  
  /**
   * Calculate the base URL with robust error handling
   * This is separated from getBaseUrl to allow for pre-calculation and caching
   */
  private calculateBaseUrl(): string {
    try {
      if (typeof window !== 'undefined') {
        // Client-side: use window.location.origin
        if (window.location && window.location.origin) {
          return window.location.origin;
        }
        
        // Fallback if window.location.origin is not available
        if (window.location && window.location.protocol && window.location.host) {
          return `${window.location.protocol}//${window.location.host}`;
        }
        
        // Final client-side fallback
        this.logger.warn('Could not determine origin from window.location, using fallback');
        return 'http://localhost:3000';
      } else {
        // Server-side: use environment variable with fallbacks
        const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (envUrl) {
          // Validate URL format
          try {
            new URL(envUrl); // This will throw if invalid
            return envUrl;
          } catch (e) {
            this.logger.warn(`Invalid URL in NEXT_PUBLIC_API_BASE_URL: ${envUrl}`, e as Error);
          }
        }
        
        // Default fallback for server-side
        return 'http://localhost:3000';
      }
    } catch (error) {
      // Last resort fallback with error logging
      this.logger.error('Error determining base URL', error instanceof Error ? error : String(error));
      return 'http://localhost:3000';
    }
  }
  
  /**
   * Get current access token
   * We don't access cookies directly (as they may be HTTP-only)
   * This is mainly for headers in API requests
   */
  async getToken(): Promise<string | null> {
    try {
      // First try to validate token through an API call
      const validation = await this.validateToken();
      if (!validation.valid) {
        return null;
      }
      
      // Get base URL and call the API endpoint
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/auth/token`;
      
      try {
        // Call the API endpoint that returns the current token with absolute URL
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      // Track successful API call
      this.lastSuccessfulApiCall = {
        endpoint: '/api/auth/token',
        timestamp: Date.now(),
        responseStatus: response.status
      };
      
      // Update auth state if token is found
      if (data.token) {
        this.authState.isAuthenticated = true;
        this.authState.consecutiveFailures = 0;
      }
      
      return data.token || null;
      } catch (fetchError) {
        this.logger.error('Network error getting token:', {
          url,
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        
        // If this is a URL parsing error, it's likely happening during initialization
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to parse URL')) {
          this.logger.warn('URL parsing error during token retrieval, using defensive retry');
          
          // Wait a short period before retrying with a more robust URL construction
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            // More robust URL construction for the retry
            const fullUrl = new URL('/api/auth/token', baseUrl).toString();
            
            const retryResponse = await fetch(fullUrl, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            if (!retryResponse.ok) {
              return null;
            }
            
            const retryData = await retryResponse.json();
            return retryData.token || null;
          } catch (retryError) {
            this.logger.error('Token retrieval retry also failed', retryError instanceof Error ? retryError : String(retryError));
            return null;
          }
        }
        
        return null;
      }
    } catch (error) {
      this.logger.error('Error getting token:', error instanceof Error ? error : String(error));
      return null;
    }
  }
  
  /**
   * Validate the current token
   * Makes an API call to validate the token
   */
  async validateToken(): Promise<TokenValidationResult> {
    try {
      // Get base URL and call the API endpoint
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/auth/validate`;
      
      try {
        // Call the token validation endpoint with absolute URL
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
      
      if (!response.ok) {
        // Check if we got a 401 Unauthorized
        if (response.status === 401) {
          return { 
            valid: false, 
            expired: true,
            reason: 'Token expired or invalid'
          };
        }
        
        // Other error
        return { 
          valid: false,
          reason: `Validation failed with status ${response.status}`
        };
      }
      
      // Parse response
      const data = await response.json();
      
      // Track successful API call
      this.lastSuccessfulApiCall = {
        endpoint: '/api/auth/validate',
        timestamp: Date.now(),
        responseStatus: response.status
      };
      
      if (data && data.success) {
        // Update auth state on successful validation
        this.authState.isAuthenticated = true;
        this.authState.consecutiveFailures = 0;
        
        return { 
          valid: true,
          payload: data.data || null
        };
      }
      
      return { 
        valid: false,
        reason: data.message || 'Token validation failed'
      };
      } catch (fetchError) {
        this.logger.error('Network error validating token:', {
          url,
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        
        // If this is a URL parsing error, it's likely happening during initialization
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to parse URL')) {
        this.logger.warn('URL parsing error during token validation, using defensive retry');
          
        // Wait a short period before retrying with a more robust URL construction
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          // More robust URL construction for the retry
          const fullUrl = new URL('/api/auth/validate', baseUrl).toString();
          
          const retryResponse = await fetch(fullUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!retryResponse.ok) {
            return {
              valid: false,
              reason: `Retry validation failed with status ${retryResponse.status}`
            };
          }
          
          // Parse retry response
          const retryData = await retryResponse.json();
          
          if (retryData && retryData.success) {
            return { 
              valid: true,
              payload: retryData.data || null
            };
          }
          
          return {
            valid: false,
            reason: retryData.message || 'Token validation failed during retry'
          };
        } catch (retryError) {
          this.logger.error('Token validation retry also failed', retryError instanceof Error ? retryError : String(retryError));
          return {
            valid: false,
            reason: 'Token validation failed after retry'
          };
        }
      }
      
      // For other network errors
      return {
        valid: false,
        reason: fetchError instanceof Error ? fetchError.message : 'Network error during validation'
      };
      }
    } catch (error) {
      this.logger.error('Error validating token:', error instanceof Error ? error : String(error));
      
      return {
        valid: false,
        reason: error instanceof Error ? error.message : 'Unknown error during validation'
      };
    }
  }
  
  /**
   * Refresh the access token
   * Makes an API call to the refresh endpoint
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    try {
      // Get base URL and call the API endpoint
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/auth/refresh`;
      
      try {
        // Call the refresh endpoint with absolute URL
        const response = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthenticationError(
            'Invalid refresh token',
            'INVALID_REFRESH_TOKEN'
          );
        }
        
        throw new NetworkError(
          `Failed to refresh token: ${response.status}`,
          'REFRESH_TOKEN_NETWORK_ERROR'
        );
      }
      
      // Parse response
      const data = await response.json();
      
      // Track successful API call (even if the refresh itself failed)
      this.lastSuccessfulApiCall = {
        endpoint: '/api/auth/refresh',
        timestamp: Date.now(),
        responseStatus: response.status
      };
      
      if (!data || !data.success) {
        // Update auth state on failed refresh
        this.authState.consecutiveFailures++;
        
        if (this.authState.consecutiveFailures >= 3) {
          this.authState.isAuthenticated = false;
          await this.notifyAuthChange(false);
        }
        
        return {
          success: false,
          message: data?.message || 'Refresh failed'
        };
      }
      
      // Reset failure count and update auth state on success
      this.authState.isAuthenticated = true;
      this.authState.consecutiveFailures = 0;
      
      // Notify about successful authentication
      await this.notifyAuthChange(true);
      
      return {
        success: true,
        message: 'Token refreshed successfully',
        accessToken: data.data?.accessToken,
        refreshToken: data.data?.refreshToken,
        expiresIn: data.data?.expiresIn
      };
      } catch (fetchError) {
        this.logger.error('Network error refreshing token:', {
          url, 
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        
        return {
          success: false,
          message: 'Network error during token refresh',
          error: {
            code: 'NETWORK_ERROR',
            details: fetchError instanceof Error ? fetchError.message : String(fetchError)
          }
        };
      }
    } catch (error) {
      this.logger.error('Error refreshing token:', error instanceof Error ? error : String(error));
      
      // Specific error handling
      if (error instanceof AuthenticationError) {
        return {
          success: false,
          message: error.message,
          error: {
            code: error.errorCode,
            status: error.statusCode
          }
        };
      }
      
      if (error instanceof NetworkError) {
        return {
          success: false,
          message: 'Network error during token refresh',
          error: {
            code: 'NETWORK_ERROR',
            details: error.message
          }
        };
      }
      
      // Generic error
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during token refresh',
        error
      };
    }
  }
  
  /**
   * Clear all tokens
   * Makes an API call to the logout endpoint
   */
  async clearTokens(): Promise<void> {
    try {
      // Get base URL and call the API endpoint
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}/api/auth/logout`;
      
      try {
        // Call the logout endpoint to clear cookies with absolute URL
        await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
      
      // Notify about logout
      await this.notifyAuthChange(false);
      } catch (fetchError) {
        this.logger.error('Network error clearing tokens:', {
          url,
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          stack: fetchError instanceof Error ? fetchError.stack : undefined
        });
        // Still notify about logout even if API call fails
        await this.notifyAuthChange(false);
      }
    } catch (error) {
      this.logger.error('Error clearing tokens:', error instanceof Error ? error : String(error));
      // Still notify about logout even if API call fails
      await this.notifyAuthChange(false);
    }
  }
  
  /**
   * Get user information from a token
   * @param token JWT token
   * @returns User information or null
   */
  getUserFromToken(token: string): TokenUser | null {
    try {
      const decoded = jwtDecode<TokenPayloadDto>(token);
      
      if (!decoded) {
        return null;
      }
      
      // UserId can be in sub as string or number
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else if (typeof decoded.sub === 'string') {
        userId = parseInt(decoded.sub, 10);
      } else {
        return null;
      }
      
      // Check for required fields
      if (isNaN(userId) || !decoded.email) {
        return null;
      }
      
      return {
        id: userId,
        name: decoded.name || '',
        email: decoded.email,
        role: decoded.role || ''
      };
    } catch (error) {
      this.logger.error('Error decoding token:', error instanceof Error ? error : String(error));
      return null;
    }
  }
  
  /**
   * Get token status information
   */
  async getTokenStatus(): Promise<TokenStatus> {
    // This is a client implementation, so we can't directly check for HTTP-only cookies
    // Instead, we'll use an API call to validate the token
    try {
      // Call validation endpoint to check token status
      const validation = await this.validateToken();
      
      if (validation.valid) {
        return {
          hasAuthToken: true,
          hasRefreshToken: true,
          authExpiration: validation.payload?.exp ? 
            new Date(validation.payload.exp * 1000).toISOString() : null
        };
      }
      
      return {
        hasAuthToken: false,
        hasRefreshToken: false,
        authExpiration: null
      };
    } catch (error) {
      this.logger.error('Error checking token status:', error instanceof Error ? error : String(error));
      return {
        hasAuthToken: false,
        hasRefreshToken: false,
        authExpiration: null
      };
    }
  }
  
  /**
   * Register an auth change listener
   * @param listener Callback function
   * @returns Function to remove the listener
   */
  onAuthChange(listener: (isAuthenticated: boolean) => void): () => void {
    this.eventListeners.push(listener);
    
    // Return function to remove listener
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify about authentication state changes with improved diagnostics
   * @param isAuthenticated Whether user is authenticated
   */
  async notifyAuthChange(isAuthenticated: boolean): Promise<void> {
    // Update internal auth state
    const previousState = this.authState.isAuthenticated;
    this.authState.isAuthenticated = isAuthenticated;
    
    // Only notify if state has actually changed
    if (previousState === isAuthenticated) {
      return;
    }
    
    this.logger.debug('Auth state changed:', { 
      isAuthenticated, 
      previousState,
      timestamp: new Date().toISOString(),
      lastApiCall: this.lastSuccessfulApiCall
    });
    
    // Notify all registered listeners
    let listenersNotified = 0;
    this.eventListeners.forEach(listener => {
      try {
        listener(isAuthenticated);
        listenersNotified++;
      } catch (error) {
        this.logger.error('Error in auth change listener:', error instanceof Error ? error : String(error));
      }
    });
    
    // Dispatch global event for other components
    if (typeof window !== 'undefined') {
      try {
        // Dispatch standard auth-change event
        window.dispatchEvent(new CustomEvent('auth-change', { 
          detail: { 
            isAuthenticated,
            timestamp: Date.now(),
            source: 'TokenManager'
          } 
        }));
        
        // Additionally dispatch auth_status_changed for backward compatibility
        window.dispatchEvent(new CustomEvent('auth_status_changed', { 
          detail: { 
            isAuthenticated,
            timestamp: Date.now(),
            logout: !isAuthenticated
          } 
        }));
        
        this.logger.debug('Auth change events dispatched');
      } catch (error) {
        this.logger.error('Error dispatching auth change events:', error instanceof Error ? error : String(error));
      }
    }
    
    this.logger.debug(`Auth state notification complete: ${listenersNotified} listeners notified`);
  }
  
  /**
   * Notify about logout
   */
  async notifyLogout(): Promise<void> {
    // Notify all listeners about logout
    await this.notifyAuthChange(false);
    
    // Dispatch specific logout event
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('auth_status_changed', { 
          detail: { isAuthenticated: false, logout: true } 
        }));
      } catch (error) {
        this.logger.error('Error dispatching logout event:', error instanceof Error ? error : String(error));
      }
    }
  }
}

// Export a singleton instance
export const clientTokenManager = new ClientTokenManager();
export default clientTokenManager;