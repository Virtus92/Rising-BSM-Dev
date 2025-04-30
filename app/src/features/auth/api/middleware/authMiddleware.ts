'use server';

/**
 * Authentication Middleware
 * Provides authentication functionality for API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';
import { AuthenticationError } from '@/core/errors/types/AppError';
import jwt from 'jsonwebtoken';
import { getUserFromToken, validateToken } from '../../lib/clients/token/server';

const logger = getLogger();

/**
 * Authentication options
 */
export interface AuthOptions {
  /** Whether authentication is required */
  requireAuth?: boolean;
  
  /** Allowed roles (if empty, any role is allowed) */
  allowedRoles?: string[];
}

/**
 * Authentication result
 */
export interface AuthResult {
  /** Whether authentication was successful */
  success: boolean;
  
  /** Authenticated user (null if not authenticated) */
  user?: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  } | null;
  
  /** Error message (if authentication failed) */
  message?: string;
  
  /** HTTP status code (if authentication failed) */
  status?: number;
}

/**
 * Authenticate a request
 * 
 * @param request Next.js request
 * @param options Authentication options
 * @returns Authentication result
 */
export async function auth(
  request: NextRequest | Request,
  options: AuthOptions = {}
): Promise<AuthResult> {
  try {
    // Extract token from request
    const token = await extractAuthToken(request);
    
    if (!token) {
      // If auth is not required, return success with null user
      if (options.requireAuth === false) {
        return { success: true, user: null };
      }
      
      // Auth is required but no token provided
      return {
        success: false,
        message: 'Authentication required',
        status: 401
      };
    }
    
    // Validate token
    try {
      // Get JWT secret
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        logger.error('JWT_SECRET environment variable not set');
        throw new AuthenticationError('Server configuration error', 'SERVER_CONFIG_ERROR');
      }
      
      // Verify token using server-side function
      const isValidToken = await validateToken(token, jwtSecret);
      if (!isValidToken) {
        throw new AuthenticationError('Invalid token', 'INVALID_TOKEN');
      }
      
      // Extract user info using server-side function
      const user = getUserFromToken(token, jwtSecret);
      
      if (!user) {
        throw new AuthenticationError('Invalid user data in token', 'INVALID_TOKEN_USER');
      }
      
      // Check roles if specified 
      const rolesToCheck = options.allowedRoles || [];
      if (rolesToCheck.length > 0) {
        if (!user.role || !rolesToCheck.includes(user.role)) {
          return {
            success: false,
            message: 'Insufficient permissions',
            status: 403
          };
        }
      }
      
      // Authentication successful
      return {
        success: true,
        user
      };
    } catch (jwtError) {
      // Token validation failed
      logger.warn('Token validation failed:', jwtError as Error);
      
      if (jwtError instanceof jwt.TokenExpiredError) {
        return {
          success: false,
          message: 'Authentication token expired',
          status: 401
        };
      }
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          message: 'Invalid authentication token',
          status: 401
        };
      }
      
      if (jwtError instanceof AuthenticationError) {
        return {
          success: false,
          message: jwtError.message,
          status: jwtError.statusCode
        };
      }
      
      return {
        success: false,
        message: 'Authentication error',
        status: 401
      };
    }
  } catch (error) {
    // General error
    logger.error('Error in auth middleware:', error as Error);
    
    return {
      success: false,
      message: 'Authentication processing error',
      status: 500
    };
  }
}

/**
 * Extract auth token from request
 * 
 * @param request Next.js request
 * @returns Auth token or null
 */
export async function extractAuthToken(request: NextRequest | Request): Promise<string | null> {
  try {
    // Check Authorization header first (Bearer token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check custom header (for API clients)
    const customHeader = request.headers.get('X-Auth-Token');
    if (customHeader) {
      return customHeader;
    }
    
    // Check cookies as last resort
    const cookieStore = await cookies();
    
    // Try all possible cookie names for compatibility
    const cookieToken = cookieStore.get('auth_token')?.value || 
                       cookieStore.get('auth_token_access')?.value ||
                       cookieStore.get('access_token')?.value;
    
    return cookieToken || null;
  } catch (error) {
    logger.error('Error extracting auth token:', error as Error);
    return null;
  }
}

/**
 * Higher-order function that applies authentication to a route handler
 * 
 * @param handler Route handler function
 * @param options Authentication options
 * @returns Wrapped handler with authentication
 */
export async function withAuth(handler: Function, options: AuthOptions = {}) {
  // Make this function explicitly async since it's being used as a Server Action
  return async function authHandler(request: NextRequest, ...args: any[]): Promise<NextResponse> {
    // Authenticate request
    const authResult = await auth(request, options);
    
    if (!authResult.success) {
      // Authentication failed
      return formatResponse.error(
        authResult.message || 'Authentication required',
        authResult.status || 401,
        'AUTHENTICATION_REQUIRED'
      );
    }
    
    // Attach user to request for downstream use
    const req = request as NextRequest & { auth?: any };
    req.auth = {
      userId: authResult.user?.id,
      email: authResult.user?.email,
      role: authResult.user?.role,
      name: authResult.user?.name
    };
    
    // Call handler with authenticated request
    return handler(req, ...args);
  };
}

/**
 * Enhanced server-side session function
 * 
 * @param request Next.js request
 * @returns Session information
 */
export async function getServerSession(request: NextRequest | Request) {
  try {
    logger.debug('getServerSession called');
    
    // Get token from request (for debugging)
    const token = await extractAuthToken(request);
    logger.debug(`Token present: ${!!token}`);
    
    if (token) {
      // Log headers for debugging
      logger.debug('Request headers for auth:', {
        authHeader: request.headers.get('Authorization'),
        xAuthToken: request.headers.get('X-Auth-Token'),
        cookieHeader: request.headers.get('Cookie')
      });
    }
    
    // Authenticate request
    const authResult = await auth(request, { requireAuth: false });
    
    if (!authResult.success || !authResult.user) {
      logger.debug(`getServerSession authentication failed: ${authResult.message || 'No message'}`);
    } else {
      logger.debug(`getServerSession authentication successful for user ${authResult.user.id}`);
    }
    
    return {
      user: authResult.user,
      isAuthenticated: authResult.success && !!authResult.user
    };
  } catch (error) {
    logger.error('Error in getServerSession', error as Error);
    return {
      user: null,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error in session handling'
    };
  }
}

/**
 * Authentication middleware function for use with API routes
 * 
 * @param request Next.js request
 * @returns AuthResult with authentication status
 */
export async function authMiddleware(request: NextRequest) {
  return await auth(request);
}

// Export the default function for convenience
export default authMiddleware;
