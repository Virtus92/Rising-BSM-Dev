/**
 * API Authentication helpers
 * Simplified utilities for securing API routes
 */

import { auth, AuthOptions } from '../auth/middleware/authMiddleware';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * Wraps an API handler function with authentication
 * @param handler The API handler function to wrap
 * @param options Authentication options
 * @returns The wrapped handler with authentication
 */
export function withAuth<T extends any[]>(
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
 * @param req The request to check
 * @param options Authentication options
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

/**
 * Extract authentication token from a request
 * Checks multiple sources for the token
 * 
 * @param req The request
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

export default {
  withAuth,
  requireAuth,
  extractAuthToken
};
