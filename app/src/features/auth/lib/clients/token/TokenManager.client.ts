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
      
      // Call the API endpoint that returns the current token
      const response = await fetch('/api/auth/token', {
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
      return data.token || null;
    } catch (error) {
      this.logger.error('Error getting token:', error as Error);
      return null;
    }
  }
  
  /**
   * Validate the current token
   * Makes an API call to validate the token
   */
  async validateToken(): Promise<TokenValidationResult> {
    try {
      // Call the token validation endpoint
      const response = await fetch('/api/auth/validate', {
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
      
      if (data && data.success) {
        return { 
          valid: true,
          payload: data.data || null
        };
      }
      
      return { 
        valid: false,
        reason: data.message || 'Token validation failed'
      };
    } catch (error) {
      this.logger.error('Error validating token:', error as Error);
      
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
      // Call the refresh endpoint
      const response = await fetch('/api/auth/refresh', {
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
      
      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || 'Refresh failed'
        };
      }
      
      // Notify about successful authentication
      await this.notifyAuthChange(true);
      
      return {
        success: true,
        message: 'Token refreshed successfully',
        accessToken: data.data?.accessToken,
        refreshToken: data.data?.refreshToken,
        expiresIn: data.data?.expiresIn
      };
    } catch (error) {
      this.logger.error('Error refreshing token:', error as Error);
      
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
      // Call the logout endpoint to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Notify about logout
      await this.notifyAuthChange(false);
    } catch (error) {
      this.logger.error('Error clearing tokens:', error as Error);
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
      this.logger.error('Error decoding token:', error as Error);
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
      this.logger.error('Error checking token status:', error as Error);
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
   * Notify about authentication state changes
   * @param isAuthenticated Whether user is authenticated
   */
  async notifyAuthChange(isAuthenticated: boolean): Promise<void> {
    // Notify all listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(isAuthenticated);
      } catch (error) {
        this.logger.error('Error in auth change listener:', error as Error);
      }
    });
    
    // Dispatch global event for other components
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('auth-change', { 
          detail: { isAuthenticated } 
        }));
      } catch (error) {
        this.logger.error('Error dispatching auth change event:', error as Error);
      }
    }
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
        this.logger.error('Error dispatching logout event:', error as Error);
      }
    }
  }
}

// Export a singleton instance
export const clientTokenManager = new ClientTokenManager();
export default clientTokenManager;