import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthService } from '@/core/factories/serviceFactory';
import { formatError } from '@/core/errors';
import { getLogger } from '@/core/logging';

/**
 * Authentication middleware for API routes
 * Verifies authentication and attaches user information to the request
 */
export const authMiddleware = {
  /**
   * Verify that a request is authenticated
   * 
   * @param request - Next.js request object
   * @returns Whether the request is authenticated
   */
  async isAuthenticated(request: NextRequest): Promise<boolean> {
    try {
      const authToken = await getAuthToken(request);
      
      if (!authToken) {
        return false;
      }
      
      const authService = getAuthService();
      const verificationResult = await authService.verifyToken(authToken);
      
      return verificationResult.valid && !!verificationResult.userId;
    } catch (error) {
      getLogger().error('Error in authMiddleware.isAuthenticated:', error as Error);
      return false;
    }
  },
  
  /**
   * Middleware handler that requires authentication
   * 
   * @param handler - Route handler function
   * @returns Wrapped handler function
   */
  requireAuth<T>(handler: (request: NextRequest) => Promise<NextResponse<T>>) {
    return async (request: NextRequest): Promise<NextResponse<T>> => {
      try {
        const authToken = await getAuthToken(request);
        
        if (!authToken) {
          return formatError('Authentication required', 401) as NextResponse<T>;
        }
        
        const authService = getAuthService();
        const verificationResult = await authService.verifyToken(authToken);
        
        if (!verificationResult.valid || !verificationResult.userId) {
          return formatError('Invalid or expired authentication token', 401) as NextResponse<T>;
        }
        
        // Attach user ID to request for use in handler
        (request as any).auth = { 
          userId: verificationResult.userId
        };
        
        return handler(request);
      } catch (error) {
        getLogger().error('Error in authMiddleware.requireAuth:', error as Error);
        return formatError('Authentication error', 401) as NextResponse<T>;
      }
    };
  },
  
  /**
   * Middleware handler that requires a specific role
   * 
   * @param handler - Route handler function
   * @param roles - Required roles (any match is sufficient)
   * @returns Wrapped handler function
   */
  requireRole<T>(
    handler: (request: NextRequest) => Promise<NextResponse<T>>,
    roles: string[]
  ) {
    return this.requireAuth(async (request: NextRequest): Promise<NextResponse<T>> => {
      try {
        const userId = (request as any).auth?.userId;
        const role = (request as any).auth?.role;
        
        if (!userId) {
          return formatError('Authentication required', 401) as NextResponse<T>;
        }
        
        // For admin users, automatic pass
        if (role === 'admin' || role === 'ADMIN') {
          return handler(request);
        }
        
        // Check if user has any of the required roles
        const authService = getAuthService();
        let hasRequiredRole = false;
        
        for (const requiredRole of roles) {
          const hasRole = await authService.hasRole(userId, requiredRole);
          if (hasRole) {
            hasRequiredRole = true;
            break;
          }
        }
        
        if (!hasRequiredRole) {
          getLogger().warn(`User ${userId} does not have required roles [${roles.join(', ')}]`);
          return formatError('Insufficient permissions', 403) as NextResponse<T>;
        }
        
        return handler(request);
      } catch (error) {
        getLogger().error('Error in authMiddleware.requireRole:', error as Error);
        return formatError('Authorization error', 403) as NextResponse<T>;
      }
    });
  }
};

/**
 * Get auth token from cookies or authorization header
 * 
 * @param request - Next.js request object
 * @returns Auth token or null
 */
async function getAuthToken(request: NextRequest): Promise<string | null> {
  try {
    // Try to get from cookies first
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (token) {
      return token;
    }
    
    // Then try to get from authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }
    
    return null;
  } catch (error) {
    getLogger().error('Error getting auth token:', error as Error);
    return null;
  }
}

export default authMiddleware;