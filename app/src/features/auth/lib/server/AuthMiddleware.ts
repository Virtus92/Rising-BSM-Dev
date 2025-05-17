/**
 * Server-side Auth Middleware
 * Lightweight auth middleware for server-side routes and components
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { getTokenFromRequest, verifyAuthToken } from './ServerAuthUtils';
import { AuthInfo } from '@/types/types/auth';

// Logger for auth middleware
const logger = getLogger();

/**
 * Auth middleware options
 */
interface AuthMiddlewareOptions {
  redirectTo?: string;
  roles?: string[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Auth middleware for API routes
 * 
 * @param handler Route handler function
 * @param options Middleware options
 * @returns Wrapped handler
 */
export function withAuthMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: AuthMiddlewareOptions = {}
) {
  // Set default options
  const {
    redirectTo = '/auth/login',
    roles = undefined,
    logLevel = 'info'
  } = options;

  // Return wrapped handler
  return async function authProtectedHandler(req: NextRequest): Promise<NextResponse> {
    // Log request based on log level
    if (logLevel === 'debug') {
      logger.debug(`Auth middleware processing request: ${req.method} ${req.nextUrl.pathname}`);
    } else if (logLevel === 'info') {
      logger.info(`Auth middleware for: ${req.method} ${req.nextUrl.pathname}`);
    }

    // Get token from request
    const token = getTokenFromRequest(req);
    
    // If no token, redirect to login or return unauthorized
    if (!token) {
      if (logLevel !== 'error') { // Only log if not set to error-only
        logger.warn(`No auth token found for ${req.nextUrl.pathname}`);
      }
      
      // For API requests, return 401
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // For page requests, redirect to login
      const returnUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(new URL(`${redirectTo}?returnUrl=${returnUrl}`, req.url));
    }
    
    // Verify token
    const verification = verifyAuthToken(token);
    
    // If token is invalid, redirect to login or return unauthorized
    if (!verification.valid) {
      if (logLevel !== 'error') {
        logger.warn(`Invalid auth token for ${req.nextUrl.pathname}: ${verification.reason}`);
      }
      
      // For API requests, return 401
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: verification.reason || 'Invalid token' },
          { status: 401 }
        );
      }
      
      // For page requests, redirect to login
      const returnUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(new URL(`${redirectTo}?returnUrl=${returnUrl}`, req.url));
    }
    
    // Check roles if specified
    if (roles && verification.role) {
      const hasRequiredRole = roles.includes(verification.role);
      
      if (!hasRequiredRole) {
        if (logLevel !== 'error') {
          logger.warn(`User lacks required role for ${req.nextUrl.pathname}: ${verification.role} not in [${roles.join(', ')}]`);
        }
        
        // For API requests, return 403
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, message: 'Insufficient permissions' },
            { status: 403 }
          );
        }
        
        // For page requests, redirect to dashboard (or other specified page)
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    
    // Create a new request with auth information
    const requestWithAuth = new Request(req.url, {
      headers: req.headers,
      method: req.method,
      body: req.body,
      cache: req.cache,
      credentials: req.credentials,
      integrity: req.integrity,
      keepalive: req.keepalive,
      mode: req.mode,
      redirect: req.redirect,
      referrer: req.referrer,
      referrerPolicy: req.referrerPolicy,
      signal: req.signal
    });
    
    // Create standardized auth info
    const authInfo: AuthInfo = {
      userId: verification.userId as number,
      email: verification.email as string,
      role: verification.role,
      name: verification.name,
      exp: verification.exp,
      permissions: verification.permissions
    };
    
    // Attach auth info to request
    Object.defineProperty(requestWithAuth, 'auth', {
      value: authInfo,
      writable: false,
      enumerable: true,
      configurable: false
    });
    
    // Create a new NextRequest with the same properties
    const url = new URL(requestWithAuth.url);
    const nextRequestWithAuth = new NextRequest(url, {
      method: requestWithAuth.method,
      headers: requestWithAuth.headers,
      body: requestWithAuth.body,
      cache: requestWithAuth.cache,
      credentials: requestWithAuth.credentials,
      integrity: requestWithAuth.integrity,
      keepalive: requestWithAuth.keepalive,
      mode: requestWithAuth.mode,
      redirect: requestWithAuth.redirect,
      referrer: requestWithAuth.referrer,
      referrerPolicy: requestWithAuth.referrerPolicy,
      signal: requestWithAuth.signal
    });
    
    // Attach auth info to new request
    Object.defineProperty(nextRequestWithAuth, 'auth', {
      value: authInfo,
      writable: false,
      configurable: false,
      enumerable: true
    });
    
    // Call the original handler
    return handler(nextRequestWithAuth);
  };
}

export default withAuthMiddleware;
