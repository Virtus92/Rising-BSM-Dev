import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getLogger } from '@/infrastructure/common/logging';
import { securityConfig } from '@/infrastructure/common/config/SecurityConfig';
import { tokenBlacklist } from '@/infrastructure/auth/TokenBlacklist';

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
    // Initialize security config
    securityConfig.initialize();
    
    // Get auth token from cookies - use consistent naming
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token')?.value;
    
    if (!authToken) {
      logger.warn('No auth token found in cookies');
      return null;
    }
    
    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(authToken)) {
      logger.warn('Token is blacklisted');
      return null;
    }
    
    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
    
    try {
      // No specific verification options for backward compatibility
      const decoded = jwt.verify(authToken, jwtSecret) as any;
      
      // Check for required fields
      if (!decoded || !decoded.sub) {
        logger.warn('Invalid token payload');
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
      logger.warn('JWT verification failed', { error: jwtError });
      
      if (options.throwOnFail) {
        throw jwtError;
      }
      
      return null;
    }
  } catch (error) {
    logger.error('Error in getServerSession', { error });
    
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
    const session = await getServerSession(req, options);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    return handler(req, session);
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
    // Initialize security config
    securityConfig.initialize();
    
    // Get token from cookies or authorization header
    let token: string | undefined;
    
    // Try to get token from cookies first - use consistent naming
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
      const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
      
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
    
    // If not found in cookies, try authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
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
      logger.warn('JWT verification failed', { error: jwtError });
      
      return {
        success: false,
        message: 'Invalid or expired token',
        status: 401
      };
    }
  } catch (error) {
    logger.error('Error in auth middleware', { error });
    
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

// Export everything as named exports and default
export default {
  getServerSession,
  withAuth,
  auth,
  authMiddleware
};
