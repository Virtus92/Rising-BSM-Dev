/**
 * Authentication Middleware
 * Provides utilities for securing API routes and managing user sessions
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';  // Server-only API - only use in Route Handlers
import { getLogger } from '@/core/logging';
import { tokenBlacklist } from '@/features/auth/lib/clients/token/blacklist';
import { db } from '@/core/db';
import { formatResponse } from '@/core/errors';

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
      const cookieStore = await cookies();
      authToken = cookieStore.get('auth_token')?.value;
      
      if (!authToken) {
        logger.warn('No auth token found in X-Auth-Token header or cookies');
        return null;
      }
    }
    
    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(authToken)) {
      logger.warn('Token is blacklisted');
      return null;
    }
    
    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
    
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
      
      // No specific verification options for backward compatibility
      const decoded = jwt.verify(authToken, jwtSecret) as any;
      
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
    // Log detailed error information
    logger.error('Error in getServerSession', { 
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error
    });
    
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
    // Get token from cookies or authorization header
    let token: string | undefined;
    
    // Try to get token from cookies first - use consistent naming
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
      const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
      
      if (authCookie) {
        token = authCookie.split('=')[1];
        logger.debug('Found token in auth_token cookie');
      }
    }
    
    // If not found in cookies, try authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        logger.debug('Found token in Authorization header');
      }
    }
    
    // Also check for X-Auth-Token header (set by middleware)
    if (!token) {
      const xAuthToken = request.headers.get('x-auth-token');
      if (xAuthToken) {
        token = xAuthToken;
        logger.debug('Found token in X-Auth-Token header');
      }
    }
    
    // If no token found in either location
    if (!token) {
      logger.warn('No token provided for protected route');
      return {
        success: false,
        message: 'Authentication required',
        status: 401
      };
    }
    
    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      logger.warn('Token is blacklisted');
      return {
        success: false,
        message: 'Invalid token - token has been revoked',
        status: 401
      };
    }
    
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
    
    try {
      // Debug log for token verification
      logger.debug('About to verify token in auth function', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...'
      });
      
      // No verification options for backward compatibility
      const decoded = jwt.verify(token, jwtSecret) as any;
      
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
            role: true,
            name: true,
            email: true
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
        
        logger.debug('Auth successful for user', { id: user.id, role: user.role });
        
        // Return success with user information from database (safer than using token data)
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name || decoded.name, // Fallback to token data if missing
            email: user.email || decoded.email, // Fallback to token data if missing
            role: user.role // Always use role from database
          }
        };
      } catch (dbError) {
        // Log detailed error
        const errorDetails = dbError instanceof Error ? {
          message: dbError.message,
          stack: dbError.stack,
          name: dbError.name
        } : String(dbError);
        
        logger.error('Database error checking user existence in auth function:', { 
          error: errorDetails,
          userId: decoded.sub
        });
        
        return {
          success: false,
          message: 'Database error during authentication',
          status: 500
        };
      }
      
    } catch (jwtError) {
      // Log detailed error
      const errorDetails = jwtError instanceof Error ? {
        message: jwtError.message,
        name: jwtError.name,
        stack: jwtError.stack
      } : String(jwtError);
      
      logger.warn('JWT verification failed in auth function', { error: errorDetails });
      
      return {
        success: false,
        message: 'Invalid or expired token',
        status: 401
      };
    }
  } catch (error) {
    // Ensure error details are always properly formatted for logging
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : String(error);
    
    logger.error('Error in auth middleware', { error: errorDetails });
    
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
 * Extracts authentication token from a request
 * Checks multiple sources for the token
 * 
 * @param req - The request
 * @returns The token if found, null otherwise
 */
export function extractAuthToken(req: Request): string | null {
  // Check authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check X-Auth-Token header
  const xAuthToken = req.headers.get('x-auth-token');
  if (xAuthToken) {
    return xAuthToken;
  }
  
  // Check cookies
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
    if (authCookie) {
      return authCookie.split('=')[1];
    }
  }
  
  return null;
}

/**
 * Route handler middleware for API routes
 * Wraps an API handler function with authentication
 * 
 * @param handler - The API handler function to wrap
 * @param options - Authentication options
 * @returns The wrapped handler with authentication
 */
export function withApiAuth<T extends any[]>(
  handler: (req: Request, user: any, ...args: T) => Promise<Response>,
  options: AuthOptions = {}
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    const logger = getLogger();
    
    try {
      // Authenticate user
      const authResult = await auth(req, options);
      
      // If not authenticated, return error
      if (!authResult.success) {
        logger.warn(`API authentication failed: ${authResult.message}`, { 
          path: req.url,
          status: authResult.status
        });
        
        return Response.json({ 
          success: false, 
          message: authResult.message || 'Authentication required' 
        }, { 
          status: authResult.status || 401 
        });
      }
      
      // Call handler with authenticated user info
      return handler(req, authResult.user, ...args);
    } catch (error) {
      logger.error('API authentication error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        path: req.url
      });
      
      return Response.json({ 
        success: false, 
        message: 'Authentication error' 
      }, { 
        status: 500 
      });
    }
  };
}

/**
 * Checks if a request is authenticated
 * Returns the authenticated user or throws an error
 * 
 * @param req - The request to check
 * @param options - Authentication options
 * @returns The authenticated user
 * @throws Error if not authenticated
 */
export async function requireAuth(req: Request, options: AuthOptions = {}) {
  const authResult = await auth(req, options);
  
  if (!authResult.success) {
    throw new Error(authResult.message || 'Authentication required');
  }
  
  return authResult.user;
}

// Export everything as named exports and default
const authMiddlewareExports = {
  getServerSession,
  withAuth,
  auth,
  authMiddleware,
  withApiAuth,
  requireAuth,
  extractAuthToken
};

// For backward compatibility
export { withApiAuth as withApiAuthLegacy };
export { withApiAuth as withApiAuthOld };

export default authMiddlewareExports;