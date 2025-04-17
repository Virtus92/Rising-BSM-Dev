/**
 * API Authentication helpers
 * Uses standardized apiRouteHandler for consistency
 */

import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Wraps an API handler function with authentication
 * Using standardized apiRouteHandler for consistency
 */
export function withAuth(
  handler: (req: NextRequest, user: any, ...args: any[]) => Promise<NextResponse<unknown>>,
  options: { requiresRole?: string[] } = {}
) {
  return apiRouteHandler(async (req: NextRequest, params?: any) => {
    // Handler receives auth info directly from req.auth set by apiRouteHandler
    if (!req.auth) {
      const logger = getLogger();
      logger.error('Authentication required but req.auth is undefined');
      return formatResponse.error('Authentication required', 401);
    }
    
    return await handler(req, req.auth, params);
  }, {
    requiresAuth: true,
    requiresRole: options.requiresRole
  });
}

/**
 * Extracts auth token from request
 * For use in custom auth implementations
 */
export function extractAuthToken(req: Request): string | null {
  const logger = getLogger();
  let token: string | null = null;
  
  try {
    // Check cookies first
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
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
      }
    }
    
    // If no token in cookies, check X-Auth-Token header
    if (!token) {
      const xAuthToken = req.headers.get('x-auth-token');
      if (xAuthToken) {
        token = xAuthToken;
      }
    }
    
    // If still no token, check authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } catch (error) {
    logger.error('Error extracting auth token', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  return token;
}

export default {
  withAuth,
  extractAuthToken
};
