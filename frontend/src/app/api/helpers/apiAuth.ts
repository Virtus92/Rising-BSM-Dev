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
  const logger = getLogger();
  let token: string | null = null;
  let tokenSource = 'none';
  
  try {
    // Check cookies first - this is the most reliable source
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
      // Check for multiple possible cookie names for better compatibility
      const authCookie = cookies.find(cookie => 
          cookie.startsWith('auth_token=') ||
          cookie.startsWith('token=') ||
          cookie.startsWith('authorization=') ||
          cookie.startsWith('auth='));
      if (authCookie) {
        token = authCookie.split('=')[1];
        // Handle URL-encoded values
        if (token?.startsWith('%22') && token?.endsWith('%22')) {
          token = decodeURIComponent(token);
        }
        // Remove surrounding quotes if present
        if (token?.startsWith('"') && token?.endsWith('"')) {
          token = token.slice(1, -1);
        }
        tokenSource = 'cookie';
        logger.debug('API Helper: Found token in auth cookie', { cookieName: authCookie.split('=')[0] });
      }
    }
    
    // If no token in cookies, check X-Auth-Token header
    if (!token) {
      const xAuthToken = req.headers.get('x-auth-token');
      if (xAuthToken) {
        token = xAuthToken;
        tokenSource = 'x-auth-token';
        logger.debug('API Helper: Found token in X-Auth-Token header');
      }
    }
    
    // If still no token, check authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        tokenSource = 'authorization';
        logger.debug('API Helper: Found token in Authorization header');
      }
    }
    
    // Check session-related headers if we still don't have a token
    if (!token) {
      const sessionToken = req.headers.get('session-token') || req.headers.get('session');
      if (sessionToken) {
        token = sessionToken;
        tokenSource = 'session-token';
        logger.debug('API Helper: Found token in session-token header');
      }
    }
    
    // Log token extraction result
    logger.debug('API Helper: Token extraction result', {
      found: !!token,
      source: tokenSource,
      path: req.url
    });
    
  } catch (error) {
    logger.error('API Helper: Error extracting auth token', {
      error: error instanceof Error ? error.message : String(error),
      path: req.url
    });
  }
  
  return token;
}

export default {
  withAuth,
  requireAuth,
  extractAuthToken
};
