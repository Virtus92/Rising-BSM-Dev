/**
 * Server Token Manager
 * Properly implemented token management for server-side use
 */
// Server-side implementation - only use in API routes, not in components
// This file should never be imported directly in components
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { TokenPayloadDto } from '@/domain/dtos/AuthDtos';
import { getLogger } from '@/core/logging';
import { AuthenticationError } from '@/core/errors/types/AppError';
import { 
  ITokenManager, 
  TokenUser, 
  TokenRefreshResult, 
  TokenValidationResult, 
  TokenStatus 
} from './interfaces/ITokenManager';
import jwt from 'jsonwebtoken';

// Extended JwtPayload interface to include our custom properties
interface ExtendedJwtPayload extends JwtPayload {
  name?: string;
  email?: string;
  role?: string;
}

/**
 * Server-side Token Manager implementation
 * Handles token management on the server with proper error handling
 */
export class ServerTokenManager implements ITokenManager {
  private logger = getLogger();
  private jwtSecret: string;
  
  constructor() {
    // Get JWT secret from environment
    this.jwtSecret = process.env.JWT_SECRET || '';
    
    if (!this.jwtSecret) {
      this.logger.error('JWT_SECRET environment variable not set');
    }
  }
  
  /**
   * Get token from cookies - REQUIRES A REQUEST OBJECT
   * This method is for backward compatibility only.
   * You should use the server.ts utilities instead.
   */
  async getToken(): Promise<string | null> {
    this.logger.warn('TokenManager.server.ts getToken() called without a request object');
    return null;
  }
  
  /**
   * Get token from request cookies
   * @param req NextRequest object
   */
  getTokenFromRequest(req: any): string | null {
    try {
      if (!req || !req.cookies) {
        this.logger.error('No request object provided to getTokenFromRequest');
        return null;
      }
      
      // Try all possible cookie names for compatibility
      const authToken = req.cookies.get('auth_token')?.value || 
                        req.cookies.get('auth_token_access')?.value ||
                        req.cookies.get('access_token')?.value;
      
      return authToken || null;
    } catch (error) {
      this.logger.error('Error getting token from request cookies:', error as Error);
      return null;
    }
  }
  
  /**
   * Validate a token - should use validateTokenFromRequest instead
   * @param token Token to validate (must be provided, no longer reads from cookies)
   */
  async validateToken(token?: string): Promise<TokenValidationResult> {
    try {
      // Token must be provided, we can no longer read from cookies directly
      if (!token) {
        return { 
          valid: false,
          reason: 'No token provided to validateToken'
        };
      }
      
      // Verify token
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as ExtendedJwtPayload;
        
        // Check required claims
        if (!decoded.sub || !decoded.exp) {
          return {
            valid: false,
            reason: 'Invalid token format: missing required claims'
          };
        }
        
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now) {
          return {
            valid: false,
            expired: true,
            reason: 'Token expired'
          };
        }
        
        // Valid token
        // Convert sub from string to number before casting to TokenPayloadDto
        const payloadWithNumberSub = {
          ...decoded,
          sub: typeof decoded.sub === 'string' ? parseInt(decoded.sub, 10) : decoded.sub
        };
        
        return {
          valid: true,
          payload: payloadWithNumberSub as TokenPayloadDto
        };
      } catch (jwtError) {
        if (jwtError instanceof jwt.TokenExpiredError) {
          return {
            valid: false,
            expired: true,
            reason: 'Token expired'
          };
        }
        
        if (jwtError instanceof jwt.JsonWebTokenError) {
          return {
            valid: false,
            reason: jwtError.message
          };
        }
        
        throw jwtError; // Re-throw other errors
      }
    } catch (error) {
      this.logger.error('Error validating token:', error as Error);
      
      return {
        valid: false,
        reason: error instanceof Error ? error.message : 'Unknown error during validation'
      };
    }
  }
  
  /**
   * Validate a token from request
   * @param req NextRequest object
   */
  async validateTokenFromRequest(req: any): Promise<TokenValidationResult> {
    try {
      if (!req || !req.cookies) {
        return {
          valid: false,
          reason: 'No request object provided to validateTokenFromRequest'
        };
      }
      
      // Get token from request
      const authToken = this.getTokenFromRequest(req);
      
      if (!authToken) {
        return { 
          valid: false,
          reason: 'No token found in request'
        };
      }
      
      // Use the existing validation logic with the token
      return await this.validateToken(authToken);
    } catch (error) {
      this.logger.error('Error validating token from request:', error as Error);
      
      return {
        valid: false,
        reason: error instanceof Error ? error.message : 'Unknown error during validation'
      };
    }
  }
  
  /**
   * Refresh the access token
   * This should be implemented in the auth service on the server
   * Here we just return a failed result since we can't directly refresh on server
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    // Server-side can't directly refresh tokens
    // This should be done through an API endpoint that this implementation would call
    return {
      success: false,
      message: 'Token refresh should be done through an API endpoint'
    };
  }
  
  /**
   * Clear tokens from cookies - REQUIRES RESPONSE OBJECT
   * This method cannot be used as-is anymore.
   * Use server.ts utilities or API endpoints instead.
   */
  async clearTokens(): Promise<void> {
    this.logger.warn('TokenManager.server.ts clearTokens() called without a response object');
    // This method should be replaced with the clearTokenCookies() function from server.ts
    // which takes a NextResponse object
  }
  
  /**
   * Clear tokens from response cookies
   * @param res NextResponse object
   */
  clearTokensFromResponse(res: any): void {
    try {
      if (!res || !res.cookies) {
        this.logger.error('No response object provided to clearTokensFromResponse');
        return;
      }
      
      // Clear all possible token cookies
      const cookiesToClear = [
        'auth_token',
        'auth_token_access',
        'access_token',
        'refresh_token',
        'refresh_token_access'
      ];
      
      for (const cookieName of cookiesToClear) {
        res.cookies.delete(cookieName);
      }
    } catch (error) {
      this.logger.error('Error clearing tokens from response:', error as Error);
    }
  }
  
  /**
   * Get user information from a token
   * @param token JWT token
   * @returns User information or null
   */
  getUserFromToken(token: string): TokenUser | null {
    try {
      // Verify token with JWT library for proper validation
      const decoded = jwt.verify(token, this.jwtSecret) as ExtendedJwtPayload;
      
      if (!decoded || !decoded.sub) {
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
      if (isNaN(userId)) {
        return null;
      }
      
      return {
        id: userId,
        name: decoded.name || '',
        email: decoded.email || '',
        role: decoded.role || ''
      };
    } catch (error) {
      this.logger.error('Error decoding token:', error as Error);
      
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired', 'TOKEN_EXPIRED');
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token', 'INVALID_TOKEN');
      }
      
      return null;
    }
  }
  
  /**
   * Get token status - REQUIRES REQUEST OBJECT
   * This method should not be used directly.
   * Use the getTokenStatusFromRequest method instead.
   */
  async getTokenStatus(): Promise<TokenStatus> {
    this.logger.warn('TokenManager.server.ts getTokenStatus() called without a request object');
    return {
      hasAuthToken: false,
      hasRefreshToken: false,
      authExpiration: null
    };
  }
  
  /**
   * Get token status from request
   * @param req NextRequest object
   */
  getTokenStatusFromRequest(req: any): TokenStatus {
    try {
      if (!req || !req.cookies) {
        this.logger.error('No request object provided to getTokenStatusFromRequest');
        return {
          hasAuthToken: false,
          hasRefreshToken: false,
          authExpiration: null
        };
      }
      
      // Check for auth token
      const hasAuthToken = !!(req.cookies.get('auth_token')?.value || 
                            req.cookies.get('auth_token_access')?.value ||
                            req.cookies.get('access_token')?.value);
      
      // Check for refresh token
      const hasRefreshToken = !!(req.cookies.get('refresh_token')?.value || 
                               req.cookies.get('refresh_token_access')?.value);
      
      // Get expiration from token if present
      let authExpiration: string | null = null;
      
      if (hasAuthToken) {
        const token = req.cookies.get('auth_token')?.value || 
                     req.cookies.get('auth_token_access')?.value ||
                     req.cookies.get('access_token')?.value;
        
        if (token) {
          try {
            const decoded = jwtDecode<ExtendedJwtPayload>(token);
            if (decoded && decoded.exp) {
              authExpiration = new Date(decoded.exp * 1000).toISOString();
            }
          } catch (e) {
            // Ignore decoding errors
          }
        }
      }
      
      return {
        hasAuthToken,
        hasRefreshToken,
        authExpiration
      };
    } catch (error) {
      this.logger.error('Error getting token status from request:', error as Error);
      
      return {
        hasAuthToken: false,
        hasRefreshToken: false,
        authExpiration: null
      };
    }
  }
  
  /**
   * Notify about authentication state changes
   * This is a no-op on the server
   */
  async notifyAuthChange(isAuthenticated: boolean): Promise<void> {
    // No-op on server
  }
  
  /**
   * Notify about user logout
   * This is a no-op on the server
   */
  async notifyLogout(): Promise<void> {
    // No-op on server
  }
}

// Export a singleton instance
export const serverTokenManager = new ServerTokenManager();
export default serverTokenManager;
