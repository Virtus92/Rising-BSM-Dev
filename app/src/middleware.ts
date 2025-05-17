/**
 * Enhanced Global Middleware with Centralized Authentication
 * 
 * Key improvements:
 * 1. Uses centralized AuthService for all authentication operations
 * 2. Robust token expiration handling
 * 3. Detailed authentication response headers for client-side handling
 * 4. Better error recovery with fallback mechanisms
 * 5. Proactive token refresh signaling
 * 6. Improved performance with selective validation
 * 7. Comprehensive security headers
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, extractAuthToken } from '@/features/auth/api/middleware/authMiddleware';
import AuthService from '@/features/auth/core';
import { jwtDecode } from 'jwt-decode';
import { decodeJwt, isTokenExpired } from '@/features/auth/utils/jwt-edge';
import { securityConfigEdge } from '@/core/config/SecurityConfigEdge';

/**
 * Server-side compatible token verification for middleware
 * Uses Edge-compatible utilities to validate the token
 */
async function verifyTokenServer(token: string): Promise<{ valid: boolean; userId?: number; role?: string }> {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('Invalid token provided for verification');
      return { valid: false };
    }

    // Decode token without verification (Edge compatible)
    const decoded = decodeJwt(token);
    
    // Verify required claims
    if (!decoded || !decoded.sub) {
      console.error('Token missing subject claim');
      return { valid: false };
    }
    
    // Check expiration
    if (isTokenExpired(decoded)) {
      console.error('Token has expired');
      return { valid: false };
    }
    
    // Extract user information
    let userId: number;
    if (typeof decoded.sub === 'number') {
      userId = decoded.sub;
    } else {
      userId = parseInt(decoded.sub, 10);
      if (isNaN(userId)) {
        console.error('Invalid user ID in token');
        return { valid: false };
      }
    }
    
    // Return validation result
    return {
      valid: true,
      userId,
      role: decoded.role
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false };
  }
}
/**
 * Helper to check if token is near expiry
 * Edge-compatible implementation
 */
async function isTokenNearExpiry(token: string | null): Promise<boolean> {
  try {
    if (!token) return false;
    
    // Decode token using Edge-compatible utility
    const decoded = decodeJwt(token);
    
    // Check if token has expiration
    if (!decoded.exp) {
      return false;
    }
    
    // Calculate time until expiration
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeRemaining = expirationTime - currentTime;
    
    // Consider token near expiry if it expires within 5 minutes
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    return timeRemaining > 0 && timeRemaining < expiryBuffer;
  } catch (error) {
    console.error('[AUTH] Error checking token expiry:', error);
    return false;
  }
}

/**
 * Create a function to handle token expiration redirects
 */
function getExpiredTokenRedirectUrl(request: NextRequest): URL {
  const url = new URL('/auth/login', request.url);
  url.searchParams.set('returnUrl', request.nextUrl.pathname);
  url.searchParams.set('reason', 'token_expired');
  url.searchParams.set('tokenStatus', 'expired');
  
  return url;
}

/**
 * Public paths that don't require authentication
 */
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/favicon.ico',
];

/**
 * API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/validate',         // Public validation endpoint
  '/api/auth/validate-token',   // Edge middleware token validation
  '/api/auth/token',            // Token retrieval endpoint
  '/api/auth/refresh',          // Allow token refresh without authentication
  '/api/auth/status',           // Auth status endpoint
  '/api/requests/public',       // Public requests endpoint
  '/api/webhooks/',             // Webhook endpoints
  '/api/bootstrap',             // Bootstrap endpoint
];

/**
 * Static resource paths to skip
 */
const STATIC_PATHS = [
  '/_next/',
  '/api/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/images/',
  '/fonts/',
];

/**
 * Check if a path is for a static resource
 */
function isStaticPath(pathname: string): boolean {
  // Check for file extensions
  if (pathname.includes('.')) {
    const fileExtension = pathname.split('.').pop()?.toLowerCase();
    const staticExtensions = ['js', 'css', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'];
    if (fileExtension && staticExtensions.includes(fileExtension)) {
      return true;
    }
  }
  
  // Check static path prefixes
  return STATIC_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Check if path is public
 */
function isPublicPath(pathname: string): boolean {
  // Root path is public
  if (pathname === '/') {
    return true;
  }
  
  // Check public pages
  for (const path of PUBLIC_PATHS) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return true;
    }
  }
  
  // Check public API routes
  for (const route of PUBLIC_API_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Add security and performance headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent caching of authenticated routes
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

/**
 * Add user information to response headers
 */
function addUserHeaders(response: NextResponse, user: any): NextResponse {
  if (user) {
    response.headers.set('X-User-Id', user.id.toString());
    response.headers.set('X-User-Email', user.email);
    
    if (user.name) {
      response.headers.set('X-User-Name', user.name);
    }
    
    if (user.role) {
      response.headers.set('X-User-Role', user.role);
    }
  }
  
  return response;
}

/**
 * Handle token expiration for API routes
 */
function handleApiTokenExpiration(pathname: string): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      message: 'Authentication token expired',
      path: pathname,
      timestamp: new Date().toISOString(),
      code: 'TOKEN_EXPIRED',
      error: 'Token expired'
    },
    { 
      status: 401,
      headers: {
        'X-Auth-Status': 'token-expired',
        'X-Auth-Needs-Refresh': 'true',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache'
      }
    }
  );

  return response;
}

/**
 * Global middleware with enhanced token handling
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files and Next.js internals
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }
  
  // Check if path is public
  const isPublic = isPublicPath(pathname);
  
  // For public paths, allow access but add basic security headers
  if (isPublic) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }
  
  // Extract token first - making sure to use await
  const token = await extractAuthToken(request);

  if (!token) {
    // If no token is found, handle authentication failure
    if (pathname.startsWith('/api/')) {
      return handleApiTokenExpiration(pathname);
    }
    
    // For pages, redirect to login
    return NextResponse.redirect(getExpiredTokenRedirectUrl(request));
  }
  
  // Use server-compatible token verification
  const tokenVerification = await verifyTokenServer(token);
  // If token is invalid, handle authentication failure
  if (!tokenVerification.valid) {
    // For API routes, return 401 with proper headers
    if (pathname.startsWith('/api/')) {
      return handleApiTokenExpiration(pathname);
    }
    
    // For pages, redirect to login
    return NextResponse.redirect(getExpiredTokenRedirectUrl(request));
  }
  
  // Token is valid, proceed with request
  const response = NextResponse.next();
  
  // Add security headers
  addSecurityHeaders(response);
  
  // Get user info from token verification
  const user = tokenVerification.userId ? {
    id: tokenVerification.userId,
    role: tokenVerification.role,
    // Other user fields may not be available from just verification
  } : null;
  
  // Add user information to headers if available
  if (user) {
    addUserHeaders(response, user);
  }
  
  // Add token status headers with explicit information
  response.headers.set('X-Token-Status', 'valid');
  response.headers.set('X-Auth-Status', 'valid');
  response.headers.set('X-Auth-User-Id', String(tokenVerification.userId || ''));
  response.headers.set('X-Auth-User-Role', String(tokenVerification.role || ''));
  response.headers.set('X-Auth-Timestamp', String(Date.now()));
  
  // Check if token is near expiry
  const isNearExpiry = await isTokenNearExpiry(token);
  if (isNearExpiry) {
    response.headers.set('X-Auth-Needs-Refresh', 'true');
    response.headers.set('X-Auth-Refresh-Before', String(Date.now() + 60000)); // Refresh within 1 minute
  }
  
  return response;
}

/**
 * Configure middleware matcher
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for static resources
     * and specific paths that should be skipped
     */
    '/((?!_next/static|_next/image|favicon\\.ico|public).*)',
  ],
};