'use client';

/**
 * TokenService.ts
 *
 * Core service for token management with proper state handling and error boundaries.
 * This is a clean, best-practice implementation with no workarounds.
 */

import { jwtDecode } from 'jwt-decode';
import { getLogger } from '@/core/logging';

const logger = getLogger();

// Storage keys with clear namespacing
const STORAGE_KEYS = {
  TOKEN: 'auth.token.current',
  EXPIRY: 'auth.token.expiry',
  TIMESTAMP: 'auth.token.timestamp',
};

// Types
export interface TokenInfo {
  token: string | null;
  expiresAt: Date | null;
  isExpired: boolean;
  remainingTimeMs?: number;
}

export interface DecodedToken {
  sub: string | number;
  exp: number;
  iat: number;
  [key: string]: any;
}

export interface RefreshResult {
  success: boolean;
  message?: string;
  token?: string;
  expiresAt?: Date;
}

/**
 * TokenService - Manages token lifecycle
 */
export class TokenService {
  // Static token verification method for middleware usage
  public static async verifyToken(token: string): Promise<{ valid: boolean; userId?: number; role?: string }> {
    try {
      // First check if token has valid format
      if (!token || !token.includes('.') || token.split('.').length !== 3) {
        return { valid: false };
      }
      
      // Try to decode token
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Check expiration
      const expiresAt = new Date(decoded.exp * 1000);
      if (Date.now() >= expiresAt.getTime()) {
        logger.debug('Token is expired in verifyToken');
        return { valid: false };
      }
      
      // Extract user ID
      let userId: number;
      if (typeof decoded.sub === 'number') {
        userId = decoded.sub;
      } else {
        userId = parseInt(decoded.sub, 10);
        if (isNaN(userId)) {
          logger.warn('Invalid user ID in token subject claim');
          return { valid: false };
        }
      }
      
      // Return validation result
      return {
        valid: true,
        userId,
        role: decoded.role
      };
    } catch (error) {
      logger.error('Token verification error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return { valid: false };
    }
  }
  // In-memory state (no reliance on global variables or window object)
  private token: string | null = null;
  private expiresAt: number = 0;
  private initialized: boolean = false;
  
  /**
   * Initialize the token service
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }
    
    try {
      if (typeof window !== 'undefined') {
        // Try to restore token from storage
        const storedToken = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedExpiry = sessionStorage.getItem(STORAGE_KEYS.EXPIRY);
        
        if (storedToken && storedExpiry) {
          const expiry = parseInt(storedExpiry, 10);
          const now = Date.now();
          
          // Only use if valid and not expired
          if (now < expiry) {
            this.token = storedToken;
            this.expiresAt = expiry;
            
            logger.debug('Restored token from storage', {
              expiresIn: Math.round((expiry - now) / 1000) + 's'
            });
          } else {
            // Clear expired token
            this.clearStorage();
            logger.debug('Cleared expired token from storage');
          }
        }
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('Error initializing token service', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Stay robust even if initialization fails
      this.initialized = true;
      return false;
    }
  }
  
  /**
   * Get the current token
   */
  public async getToken(): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Check if token exists and is valid
    const now = Date.now();
    
    if (this.token && now < this.expiresAt) {
      return this.token;
    } else if (this.token) {
      // Token exists but is expired
      logger.debug('Token has expired');
      this.clearTokens();
    }
    
    return null;
  }
  
  /**
   * Get token information
   */
  public async getTokenInfo(): Promise<TokenInfo> {
    // Get token first (handles initialization/expiration)
    const token = await this.getToken();
    const now = Date.now();
    
    if (!token) {
      return {
        token: null,
        expiresAt: null,
        isExpired: true
      };
    }
    
    // Calculate expiration details
    const expiresAt = new Date(this.expiresAt);
    const isExpired = now >= this.expiresAt;
    const remainingTimeMs = isExpired ? 0 : this.expiresAt - now;
    
    return {
      token,
      expiresAt,
      isExpired,
      remainingTimeMs
    };
  }
  
  /**
   * Validate a token
   */
  public async validateToken(token: string): Promise<boolean> {
    try {
      // Check token format
      if (!token || typeof token !== 'string' || !token.includes('.') || token.split('.').length !== 3) {
        logger.debug('Invalid token format');
        return false;
      }
      
      // Decode and validate token
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Check required claims
        if (!decoded.sub || !decoded.exp) {
          logger.debug('Token missing required claims');
          return false;
        }
        
        // Check expiration
        const now = Date.now();
        const expiresAt = new Date(decoded.exp * 1000);
        
        if (now >= expiresAt.getTime()) {
          logger.debug('Token is expired');
          return false;
        }
        
        // Validate with server
        return await this.validateTokenWithServer(token);
      } catch (decodeError) {
        logger.error('Error decoding token', {
          error: decodeError instanceof Error ? decodeError.message : String(decodeError)
        });
        return false;
      }
    } catch (error) {
      logger.error('Error validating token', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  
  /**
   * Validate token with server to ensure it's still valid
   * Improved implementation with better error handling and diagnostics
   */
  private async validateTokenWithServer(token: string): Promise<boolean> {
    try {
      // Generate request ID for tracking
      const requestId = crypto.randomUUID().substring(0, 8);
      
      logger.debug('Starting server token validation', { requestId });
      
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': requestId,
          'X-Validate-Source': 'client-tokenservice'
        },
        body: JSON.stringify({ token })
      });
      
      if (!response.ok) {
        logger.warn('Server token validation failed', {
          requestId,
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        logger.error('Error parsing validation response', {
          requestId,
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        return false;
      }
      
      if (!result.valid) {
        logger.warn('Server reported token as invalid', {
          requestId,
          reasons: result.errors || result.reasons || ['Unknown reason']
        });
        return false;
      }
      
      logger.debug('Server token validation successful', { requestId });
      return true;
    } catch (error) {
      logger.warn('Error during server token validation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Security best practice - on error, default to invalid token
      // rather than bypassing validation
      return false;
    }
  }
  
  /**
   * Store a token with proper expiration handling
   */
  public setToken(token: string, expiresInSeconds: number = 3600): boolean {
    try {
      // Validate input
      if (!token || typeof token !== 'string') {
        logger.warn('Invalid token provided');
        return false;
      }
      
      if (expiresInSeconds <= 0) {
        logger.warn('Invalid expiration time provided');
        return false;
      }
      
      const now = Date.now();
      const expiry = now + (expiresInSeconds * 1000);
      
      // Update memory state
      this.token = token;
      this.expiresAt = expiry;
      
      // Store in sessionStorage on client-side
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
          sessionStorage.setItem(STORAGE_KEYS.EXPIRY, expiry.toString());
          sessionStorage.setItem(STORAGE_KEYS.TIMESTAMP, now.toString());
          
          logger.debug('Token stored successfully', {
            expiresIn: Math.round(expiresInSeconds) + 's',
            tokenLength: token.length
          });
        } catch (storageError) {
          logger.warn('Error storing token in session storage', {
            error: storageError instanceof Error ? storageError.message : String(storageError)
          });
          // Continue since memory state is updated
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error setting token', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  
  /**
   * Clear all tokens
   */
  public clearTokens(): void {
    // Clear memory state
    this.token = null;
    this.expiresAt = 0;
    
    // Clear storage
    this.clearStorage();
    
    logger.debug('Tokens cleared');
  }
  
  /**
   * Clear token storage
   */
  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        // Clear session storage
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.EXPIRY);
        sessionStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
      } catch (error) {
        // Ignore storage errors
      }
    }
  }
  
  /**
   * Refresh the token
   */
  public async refreshToken(): Promise<RefreshResult> {
    try {
      // Generate request ID for tracking
      const requestId = crypto.randomUUID().substring(0, 8);
      
      logger.debug('Starting token refresh', { requestId });
      
      // Clear existing tokens first
      this.clearTokens();
      
      // Call refresh endpoint
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'X-Request-ID': requestId
        }
      });
      
      // Handle non-success responses
      if (!response.ok) {
        // Get error details
        let errorMessage = `Token refresh failed (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Use default error message
        }
        
        logger.error('Token refresh failed', {
          requestId,
          status: response.status,
          message: errorMessage
        });
        
        return {
          success: false,
          message: errorMessage
        };
      }
      
      // Parse response
      let responseData;
      try {
        const responseText = await response.text();
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        logger.error('Error parsing refresh response', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          requestId
        });
        // Continue to fetch token
      }
      
      // Get the token from API
      const fetchResponse = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'X-Request-ID': requestId
        }
      });
      
      if (!fetchResponse.ok) {
        logger.error('Failed to get token after refresh', {
          requestId,
          status: fetchResponse.status
        });
        
        return {
          success: false,
          message: 'Failed to get token after refresh'
        };
      }
      
      // Parse token response
      const tokenData = await fetchResponse.json();
      
      // Extract token
      let token = null;
      if (tokenData.data?.token) {
        token = tokenData.data.token;
      } else if (tokenData.token) {
        token = tokenData.token;
      }
      
      if (!token) {
        logger.error('No token found in response', { requestId });
        return {
          success: false,
          message: 'No token found in response'
        };
      }
      
      // Validate token
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const expiresInSeconds = decoded.exp - Math.floor(Date.now() / 1000);
        
        if (expiresInSeconds <= 0) {
          logger.error('Received expired token', { requestId });
          return {
            success: false,
            message: 'Received expired token'
          };
        }
        
        // Store token
        this.setToken(token, expiresInSeconds);
        
        logger.debug('Token refresh successful', {
          requestId,
          expiresIn: expiresInSeconds + 's'
        });
        
        return {
          success: true,
          token,
          expiresAt: new Date(decoded.exp * 1000)
        };
      } catch (tokenError) {
        logger.error('Error processing refreshed token', {
          error: tokenError instanceof Error ? tokenError.message : String(tokenError),
          requestId
        });
        
        return {
          success: false,
          message: 'Invalid token received'
        };
      }
    } catch (error) {
      logger.error('Error during token refresh', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown token refresh error'
      };
    }
  }
}

export default TokenService;