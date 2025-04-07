/**
 * Global Middleware für Next.js
 * 
 * Diese Middleware wird für alle Anfragen ausgeführt und implementiert:
 * - Token-basierte Authentifizierung
 * - Token-Refresh
 * - Cross-Origin Resource Sharing (CORS)
 * - Security Header
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, isTokenExpired, refreshAccessToken } from '@/lib/auth';

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh-token',
  '/api/auth/validate',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health',
  '/api/contact',
  '/api/requests/public',
  '/'
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/users',
  '/api/profile',
  '/api/dashboard',
  '/api/customers',
  '/api/projects',
  '/api/appointments',
  '/api/services',
  '/api/notifications',
  '/api/settings',
  '/api/files'
];

/**
 * Middleware configuration
 */
export const config = {
  // Match all request paths except for static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

/**
 * Handle authentication
 * 
 * @param req - HTTP request
 * @returns Whether authentication succeeded
 */
async function handleAuth(req: NextRequest): Promise<boolean> {
  const token = getAccessToken();
  
  // No token available
  if (!token) {
    return false;
  }
  
  // Token is valid
  if (!isTokenExpired(token)) {
    return true;
  }
  
  // Try to refresh token
  const refreshed = await refreshAccessToken();
  return refreshed;
}

/**
 * Add security headers to response
 * 
 * @param response - HTTP response
 * @returns Response with security headers
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Protect against XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
  );
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'same-origin');
  
  return response;
}

/**
 * Add CORS headers to response
 * 
 * @param req - HTTP request
 * @param response - HTTP response
 * @returns Response with CORS headers
 */
function addCorsHeaders(req: NextRequest, response: NextResponse): NextResponse {
  // Only add headers for API routes
  if (!req.nextUrl.pathname.startsWith('/api')) {
    return response;
  }
  
  // CORS headers for API
  response.headers.set('Access-Control-Allow-Origin', '*'); // In production, restrict to specific origins
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

/**
 * Middleware handler
 * 
 * @param req - HTTP request
 */
export async function middleware(req: NextRequest) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(req, response);
  }
  
  // Handle public paths
  const isPublicPath = PUBLIC_PATHS.some(path => req.nextUrl.pathname.startsWith(path));
  
  if (isPublicPath) {
    const response = NextResponse.next();
    return addSecurityHeaders(addCorsHeaders(req, response));
  }
  
  // Handle API routes requiring authentication
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(path => req.nextUrl.pathname.startsWith(path));
  
  if (isProtectedApiRoute) {
    const isAuthenticated = await handleAuth(req);
    
    if (!isAuthenticated) {
      // Redirect API requests to 401 response
      const response = NextResponse.json(
        { success: false, message: 'Authentication required', timestamp: new Date().toISOString() },
        { status: 401 }
      );
      
      return addSecurityHeaders(addCorsHeaders(req, response));
    }
    
    const response = NextResponse.next();
    return addSecurityHeaders(addCorsHeaders(req, response));
  }
  
  // Handle frontend pages requiring authentication
  const isProtectedRoute = !isPublicPath && !req.nextUrl.pathname.startsWith('/_next');
  
  if (isProtectedRoute) {
    const isAuthenticated = await handleAuth(req);
    
    if (!isAuthenticated) {
      // Redirect frontend requests to login page
      const url = new URL('/auth/login', req.url);
      url.searchParams.set('from', req.nextUrl.pathname);
      
      return NextResponse.redirect(url);
    }
  }
  
  // Pass through other requests
  const response = NextResponse.next();
  return addSecurityHeaders(addCorsHeaders(req, response));
}
