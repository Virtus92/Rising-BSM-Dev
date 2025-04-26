/**
 * Authentication Middleware - CLIENT-SAFE VERSION
 * 
 * This file contains only the client-safe parts of the auth middleware
 * It does not import server-only APIs like next/headers
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

export interface AuthOptions {
  requiredRoles?: string[];
  throwOnFail?: boolean;
}

export const authOptions: AuthOptions = {
  requiredRoles: ['admin', 'employee'],
  throwOnFail: true,
};

/**
 * Auth function for API routes - CLIENT SAFE VERSION
 * This version does not do actual authentication but provides types for client components
 */
export async function auth(request: Request, options: AuthOptions = {}) {
  return {
    success: false,
    message: 'Client-side auth is not supported',
    status: 401
  };
}

/**
 * Extracts authentication token from a request - CLIENT SAFE VERSION
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
 * Client-safe exports that don't include server-only functionality
 */

// Export named exports
export const authMiddleware = null;
export const getServerSession = null;
export const withAuth = null;
export const withApiAuth = null;
export const requireAuth = null;

// Export aliased versions for backward compatibility
export const withApiAuthLegacy = withApiAuth;
export const withApiAuthOld = withApiAuth;

// Export everything as named exports and default
const authMiddlewareExports = {
  getServerSession: null,
  withAuth: null,
  auth,
  authMiddleware: null,
  withApiAuth: null,
  requireAuth: null,
  extractAuthToken
};

export default authMiddlewareExports;