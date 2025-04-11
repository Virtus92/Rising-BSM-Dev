import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as jwtUtils from '../utils/jwt-utils';
import { cookies } from 'next/headers';
import { getLogger } from '@/infrastructure/common/logging';
import { securityConfig } from '@/infrastructure/common/config/SecurityConfig';
import { tokenBlacklist } from '@/infrastructure/auth/TokenBlacklist';
import { db } from '@/infrastructure/db';

export interface AuthOptions {
  requiredRoles?: string[];
  throwOnFail?: boolean;
}

export const authOptions: AuthOptions = {
  requiredRoles: ['admin', 'employee'],
  throwOnFail: true,
};

/**
 * Middleware to authenticate requests using JWT tokens from cookies
 * Used as a replacement for [...nextauth] functionality
 * 
 * @param req - Next.js request object
 * @param options - Authentication options
 * @returns Session information if authenticated, null otherwise
 */
export async function getServerSession(req?: NextRequest, options: AuthOptions = {}) {
  const logger = getLogger();
  
  try {
    // Skip security config initialization on the server side
    // Get JWT secret from the utility function or fallback to environment variable
    const jwtSecret = jwtUtils.getJwtSecret() || process.env.JWT_SECRET || 'default-secret-change-me';
    
    // FIRST check X-Auth-Token header from middleware
    let authToken = null;
    
    if (req) {
      // Check for token passed from middleware
      authToken = req.headers.get('X-Auth-Token');
      if (authToken) {
        logger.debug('Found auth token in X-Auth-Token header from middleware');
      }
    }
    
    // If no token in X-Auth-Token, THEN check cookies (as fallback)
    if (!authToken) {
      const cookieStore = cookies();
      authToken = cookieStore.get('auth_token')?.value;
      
      if (!authToken) {
        logger.warn('No auth token found in X-Auth-Token header or cookies');
        return null;
      }
    }
    
    // Check if token is blacklisted - skip on server-side if needed
    try {
      if (tokenBlacklist.isBlacklisted && typeof tokenBlacklist.isBlacklisted === 'function') {
        if (tokenBlacklist.isBlacklisted(authToken)) {
          logger.warn('Token is blacklisted');
          return null;
        }
      }
    } catch (blacklistError) {
      logger.warn('Error checking token blacklist:', { error: String(blacklistError) });
      // Continue even if blacklist check fails
    }
    
    try {
      logger.debug('Processing auth token', {
        tokenPrefix: authToken.substring(0, 10) + '...',
        tokenLength: authToken.length
      });
      
      logger.debug('Attempting to verify token', {
        tokenLength: authToken.length,
        tokenPrefix: authToken.substring(0, 10) + '...',
        secretPrefix: jwtSecret.substring(0, 3) + '...'
      });
      
      // Use server-compatible verification with our utility
      const decoded = jwtUtils.verifyToken(authToken);
      
      // If verification failed
      if (!decoded) {
        logger.warn('JWT verification failed');
        return null;
      }
      
      logger.debug('Token verification successful', {
        sub: decoded.sub,
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : undefined
      });
      
      // Check for required fields
      if (!decoded || !decoded.sub) {
        logger.warn('Invalid token payload');
        return null;
      }
      
      // Check if user exists and is active in database
      try {
        // Verify user exists and is active
        const user = await db.user.findUnique({
          where: { id: Number(decoded.sub) },
          select: { 
            id: true, 
            status: true,
            role: true
          }
        });
        
        if (!user) {
          logger.warn(`User not found in database for ID: ${decoded.sub}`);
          // Blacklist this token since the user doesn't exist
          tokenBlacklist.blacklistUser(decoded.sub);
          return null;
        }
        
        if (user.status !== 'active') {
          logger.warn(`User account is not active: ${decoded.sub}, status: ${user.status}`);
          // Blacklist tokens for inactive users
          tokenBlacklist.blacklistUser(decoded.sub);
          return null;
        }
        
        // Use the role from the database rather than the token for better security
        decoded.role = user.role;
      } catch (dbError) {
        // Log the full error details
        logger.error('Database error checking user existence:', { 
          error: dbError instanceof Error ? {
            message: dbError.message,
            stack: dbError.stack,
            name: dbError.name
          } : dbError,
          userId: decoded.sub
        });
        
        // Don't proceed on database errors - security first
        return null;
      }
      
      // Check for required roles if specified
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        if (!decoded.role || !options.requiredRoles.includes(decoded.role)) {
          logger.warn(`User has insufficient role: ${decoded.role}`);
          
          if (options.throwOnFail) {
            throw new Error('Insufficient permissions');
          }
          
          return null;
        }
      }
      
      // Create session object
      return {
        user: {
          id: decoded.sub,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        }
      };
    } catch (jwtError) {
      // Log detailed error information
      logger.warn('JWT verification failed', { 
        error: jwtError instanceof Error ? {
          message: jwtError.message,
          name: jwtError.name,
          stack: jwtError.stack
        } : jwtError
      });
      
      if (options.throwOnFail) {
        throw jwtError;
      }
      
      return null;
    }
  } catch (error) {
    // Log detailed error information with better serialization
    let errorDetails = {};
    
    try {
      if (error instanceof Error) {
        errorDetails = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          code: (error as any).code
        };
      } else if (error !== null && typeof error === 'object') {
        errorDetails = Object.getOwnPropertyNames(error).reduce((acc, key) => {
          try {
            acc[key] = (error as any)[key];
          } catch (e) {
            acc[key] = 'Error accessing property';
          }
          return acc;
        }, {} as Record<string, any>);
      } else {
        errorDetails = { rawError: String(error) };
      }
    } catch (e) {
      errorDetails = { serializationError: 'Error serializing the error object', originalError: String(error) };
    }
    
    logger.error('Error in getServerSession', { errorDetails });
    
    if (options.throwOnFail) {
      throw error;
    }
    
    return null;
  }
}

/**
 * Route handler middleware to check authentication
 * 
 * @param handler - Next.js route handler
 * @param options - Authentication options
 * @returns Wrapped route handler with authentication
 */
export function withAuth(handler: (req: NextRequest, session: any) => Promise<NextResponse>, options: AuthOptions = {}) {
  return async (req: NextRequest) => {
    const logger = getLogger();
    
    try {
      const session = await getServerSession(req, options);
      
      if (!session) {
        logger.warn('Authentication failed in withAuth middleware');
        return NextResponse.json(
          { success: false, message: 'Not authenticated' },
          { status: 401 }
        );
      }
      
      return handler(req, session);
    } catch (error) {
      // Log detailed error
      logger.error('Error in withAuth middleware', {
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error,
        path: req.nextUrl.pathname
      });
      
      return NextResponse.json(
        { success: false, message: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Auth function for API routes
 * 
 * @param request - Request object
 * @param options - Auth options
 * @returns Auth result with success flag, message, and status code
 */
export async function auth(request: Request, options: AuthOptions = {}) {
  const logger = getLogger();
  
  try {
    // Skip security config initialization on the server side
    // Get JWT secret from the utility function
    const jwtSecret = jwtUtils.getJwtSecret();
    
    // Get token from cookies or authorization header with improved extraction
    let token: string | undefined;
    let tokenSource = 'none';
    
    // Try to get token from cookies first - use consistent naming
    try {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
        const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
        
        if (authCookie) {
          token = authCookie.split('=')[1];
          tokenSource = 'cookie';
          logger.debug('Found token in auth_token cookie');
        }
      }
    } catch (cookieError) {
      logger.warn('Error extracting token from cookies', { error: String(cookieError) });
    }
    
    // If not found in cookies, try authorization header
    if (!token) {
      try {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
          tokenSource = 'authorization';
          logger.debug('Found token in Authorization header');
        }
      } catch (authHeaderError) {
        logger.warn('Error extracting token from Authorization header', { error: String(authHeaderError) });
      }
    }
    
    // Also check for X-Auth-Token header (set by middleware)
    if (!token) {
      try {
        const xAuthToken = request.headers.get('x-auth-token');
        if (xAuthToken) {
          token = xAuthToken;
          tokenSource = 'x-auth-token';
          logger.debug('Found token in X-Auth-Token header');
        }
      } catch (xAuthError) {
        logger.warn('Error extracting token from X-Auth-Token header', { error: String(xAuthError) });
      }
    }
    
    // Log token extraction results for debugging
    logger.debug('Token extraction result', {
      found: !!token,
      source: tokenSource,
      path: request.url
    });
    
    // If no token found in either location
    if (!token) {
      logger.warn('No token provided for protected route');
      return {
        success: false,
        message: 'Authentication required',
        status: 401
      };
    }
    
    // Check if token is blacklisted - skip on server-side if needed
    try {
      if (tokenBlacklist.isBlacklisted && typeof tokenBlacklist.isBlacklisted === 'function') {
        if (tokenBlacklist.isBlacklisted(token)) {
          logger.warn('Token is blacklisted');
          return {
            success: false,
            message: 'Invalid token - token has been revoked',
            status: 401
          };
        }
      }
    } catch (blacklistError) {
      logger.warn('Error checking token blacklist:', { error: String(blacklistError) });
      // Continue even if blacklist check fails
    }
    
    // Verify token
    try {
      // Debug log for token verification with additional context
      logger.debug('About to verify token in auth function', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + '...',
        tokenSource: 'from cookies or headers',
        path: request.url
      });
      
      // Use server-compatible verification with our utility
      const decoded = jwtUtils.verifyToken(token);
      
      // If verification failed
      if (!decoded) {
        logger.warn('JWT verification failed');
        return {
          success: false,
          message: 'Invalid token format',
          status: 401
        };
      }
      
      // Log successful verification
      logger.debug('JWT verification successful', {
        hasValidToken: true,
        tokenSource,
        path: request.url
      });
      
      // Check for required fields
      if (!decoded || !decoded.sub) {
        logger.warn('Invalid token format');
        return {
          success: false,
          message: 'Invalid token format',
          status: 401
        };
      }
      
      // Check if user exists in database
      try {
        const user = await db.user.findUnique({
          where: { id: Number(decoded.sub) },
          select: { 
            id: true, 
            status: true,
            role: true
          }
        });
        
        if (!user) {
          logger.warn(`User not found in database for ID: ${decoded.sub}`);
          // Blacklist this token since the user doesn't exist
          tokenBlacklist.blacklistUser(decoded.sub);
          return {
            success: false,
            message: 'User not found',
            status: 404
          };
        }
        
        if (user.status !== 'active') {
          logger.warn(`User account is not active: ${decoded.sub}, status: ${user.status}`);
          // Blacklist tokens for inactive users
          tokenBlacklist.blacklistUser(decoded.sub);
          return {
            success: false,
            message: 'User account is not active',
            status: 403
          };
        }
        
        // Use the role from the database rather than the token for better security
        decoded.role = user.role;
      } catch (dbError) {
        // Log detailed error
        logger.error('Database error checking user existence in auth function:', { 
          error: dbError instanceof Error ? {
            message: dbError.message,
            stack: dbError.stack,
            name: dbError.name
          } : dbError,
          userId: decoded.sub
        });
        
        return {
          success: false,
          message: 'Database error during authentication',
          status: 500
        };
      }
      
      // Check for required roles if specified
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        if (!decoded.role || !options.requiredRoles.includes(decoded.role)) {
          logger.warn(`User has insufficient role: ${decoded.role}`);
          
          return {
            success: false,
            message: 'Insufficient permissions',
            status: 403
          };
        }
      }
      
      logger.debug('Auth successful for user', { id: decoded.sub, role: decoded.role });
      
      // Return success with user information
      return {
        success: true,
        user: {
          id: decoded.sub,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        }
      };
    } catch (jwtError) {
      // Log detailed error
      logger.warn('JWT verification failed in auth function', { 
        error: jwtError instanceof Error ? {
          message: jwtError.message,
          name: jwtError.name,
          stack: jwtError.stack
        } : jwtError
      });
      
      return {
        success: false,
        message: 'Invalid or expired token',
        status: 401
      };
    }
  } catch (error) {
    // Log detailed error with better error serialization
    let errorDetails = {};
    
    try {
      if (error instanceof Error) {
        errorDetails = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          code: (error as any).code
        };
      } else if (error !== null && typeof error === 'object') {
        errorDetails = Object.getOwnPropertyNames(error).reduce((acc, key) => {
          try {
            acc[key] = (error as any)[key];
          } catch (e) {
            acc[key] = 'Error accessing property';
          }
          return acc;
        }, {} as Record<string, any>);
      } else {
        errorDetails = { rawError: String(error) };
      }
    } catch (e) {
      errorDetails = { serializationError: 'Error serializing the error object', originalError: String(error) };
    }
    
    logger.error('Error in auth middleware', { errorDetails });
    
    return {
      success: false,
      message: 'Authentication error',
      status: 500
    };
  }
}

/**
 * Simple middleware for Next.js Route Handlers
 * Verifies the JWT token and returns the user session
 * @param req The NextRequest object
 * @returns User session or null
 */
export async function authMiddleware(req: NextRequest) {
  return getServerSession(req);
}

/**
 * Route handler middleware for API routes
 * This is a simplified version of withAuth that's optimized for API routes
 * 
 * @param handler - API route handler function
 * @returns - Wrapped handler with authentication
 */
export function withApiAuth(handler: Function, options: AuthOptions = {}) {
  return async (req: Request, ...args: any[]) => {
    const logger = getLogger();
    
    try {
      // Auth user
      const authResult = await auth(req, options);
      
      // If not authenticated, return error
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: authResult.message || 'Authentication required' 
          }),
          { 
            status: authResult.status || 401, 
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache'  
            }
          }
        );
      }
      
      // Call the handler with the authenticated user
      return handler(req, authResult.user, ...args);
    } catch (error) {
      logger.error('API route authentication error:', { 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        path: req.url
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Internal server error during authentication' 
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache'  
          }
        }
      );
    }
  };
}

// Export everything as named exports and default
export default {
  getServerSession,
  withAuth,
  auth,
  authMiddleware,
  withApiAuth
};
