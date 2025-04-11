import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';  // Using jose for Edge-compatible JWT validation
import { tokenBlacklist } from './infrastructure/auth/TokenBlacklist';
import { securityConfig } from './infrastructure/common/config/SecurityConfig';

/**
 * Improved JWT verification for Edge Runtime
 * This performs proper cryptographic verification using jose library
 * which is compatible with Edge Runtime
 */
async function isTokenValid(token: string): Promise<boolean> {
  try {
    // Initialize security config
    securityConfig.initialize();
    
    // First check if the token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      console.log('Token is blacklisted');
      return false;
    }
    
    // Get JWT secret from security config
    const jwtSecret = securityConfig.getJwtSecret();
    
    // Create secret key for validation
    const secretKey = new TextEncoder().encode(jwtSecret);
    
    try {
      // First try to verify with required claims (for new tokens)
      try {
        const { payload } = await jose.jwtVerify(token, secretKey, {
          issuer: 'rising-bsm',
          audience: process.env.JWT_AUDIENCE || 'rising-bsm-app'
        });
        
        if (!payload || !payload.sub) {
          console.log('Token missing required fields');
          return false;
        }
        
        console.log('Token validation passed with all required claims');
        return true;
      } catch (claimError) {
        // If it fails due to missing claims, try a more permissive verification
        // This is for backward compatibility with existing tokens
        console.log('Claim validation failed, trying legacy verification:', claimError);
        
        const { payload } = await jose.jwtVerify(token, secretKey, {
          // No issuer or audience requirements for backward compatibility
        });
        
        // Check for expiration
        const exp = payload.exp;
        if (!exp) {
          console.log('Token missing expiration');
          return false;
        }
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (exp < now) {
          console.log(`Token expired at ${new Date(exp * 1000).toISOString()}`);
          return false;
        }
        
        // Basic validation passed for legacy token
        console.log('Legacy token validation passed (no issuer/audience)');
        return true;
      }
    } catch (verifyError) {
      console.log('Token signature verification failed:', verifyError);
      return false;
    }
  } catch (error) {
    console.log('Token validation error:', error);
    return false;
  }
}

/**
 * Fallback JWT structure validation for backward compatibility
 * Only used if cryptographic validation is not possible
 * NOT SECURE - only checks token structure and expiration
 */
function isTokenStructureValid(token: string): boolean {
  try {
    // First check if the token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      console.log('Token is blacklisted');
      return false;
    }
    
    // Parse the token without verifying signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid token structure');
      return false;
    }
    
    // Base64 decode and parse the payload
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );
    
    // Check for expiration
    const exp = payload.exp;
    if (!exp) {
      console.log('Token missing expiration');
      return false;
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) {
      console.log(`Token expired at ${new Date(exp * 1000).toISOString()}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('Token basic validation error:', error);
    return false;
  }
}

/**
 * Middleware for authentication and authorization
 * Uses HTTP-only cookies for secure authentication
 */
export async function middleware(request: NextRequest) {
  // Initialize security config
  securityConfig.initialize();
  
  // USE CONSISTENT TOKEN NAMES
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Debug log the token (for development only)
  console.log(`Middleware checking path: ${pathname}`);
  if (token) {
    console.log(`Token found, length: ${token.length}, prefix: ${token.substring(0, 10)}...`);
  } else {
    console.log(`No auth_token cookie found for path ${pathname}`);
  }
  
  // Skip middleware for all auth API routes to prevent redirect loops and allow proper authentication
  if (pathname.startsWith('/api/auth/')) {
    console.log(`Skipping auth check for auth API route: ${pathname}`);
    const response = NextResponse.next();
    response.headers.set('X-Original-Path', pathname);
    return response;
  }
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/auth/login', 
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/',
    '/api/auth/',  // All auth API endpoints
    '/api/requests/public',
    // Add any other public API endpoints here
  ];
  
  const isPublicPath = publicPaths.some(path => {
    // Exact match or path prefix
    return pathname === path || 
           pathname.startsWith(path + '/') || 
           // Special case for all auth API routes
           (path === '/api/auth/' && pathname.startsWith('/api/auth/'));
  });
  
  console.log(`Path ${pathname} is ${isPublicPath ? 'public' : 'protected'}`);
  
  // Check for asset requests (images, css, etc.)
  const isAssetRequest = /\.(jpg|jpeg|png|gif|svg|css|js)$/.test(pathname);
  
  // Skip middleware for assets
  if (isAssetRequest) {
    return NextResponse.next();
  }

  // If trying to access a protected route without a token, redirect to login
  if (!isPublicPath && !token) {
    console.log(`No token for protected path ${pathname}, redirecting to login`);
    // For protected pages, redirect to login
    if (!pathname.startsWith('/api/')) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('returnUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    } 
    // For API routes, return 401 Unauthorized
    else {
      return new NextResponse(JSON.stringify({ 
        success: false, 
        message: 'Authentication required' 
      }), { 
        status: 401, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache'
        }
      });
    }
  }

  // If logged in and trying to access login/register, redirect to dashboard
  if (isPublicPath && token && (pathname === '/auth/login' || pathname === '/auth/register')) {
    console.log(`Already logged in, redirecting from ${pathname} to dashboard`);
    // Don't redirect to dashboard while processing login - this can create redirect loops
    // Only redirect if they're directly accessing these routes
    if (!request.headers.get('referer')?.includes('/auth/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // If we have a token, do validation
  if (token) {
    try {
      // First try proper cryptographic validation with jose
      let isValid = false;
      try {
        isValid = await isTokenValid(token);
      } catch (e) {
        console.log('Full token validation failed, falling back to basic check:', e);
        // Fall back to basic structure validation if full validation fails
        isValid = isTokenStructureValid(token);
        
        if (isValid) {
          console.warn('WARNING: Using fallback token validation which is less secure');
        }
      }
      
      if (isValid) {
        // Log successful validation
        console.log(`Token validation passed for ${pathname}`);
        
        // Token is valid, we can proceed
        // Add user info to request headers for API routes
        if (pathname.startsWith('/api/') && !isPublicPath) {
          const response = NextResponse.next();
          response.headers.set('X-Auth-Token', token);
          return response;
        }
        
        // For normal pages, just proceed
        return NextResponse.next();
      } else {
        // Token is invalid or expired - handle appropriately
        console.log(`Token appears invalid in middleware for ${pathname}`);
        
        // For protected page routes: redirect to login
        if (!isPublicPath && !pathname.startsWith('/api/')) {
          // Clean the returnUrl to prevent loops
          const cleanPath = pathname.replace(/\/api\/api\//, '/api/');
          const url = new URL('/auth/login', request.url);
          url.searchParams.set('returnUrl', encodeURI(cleanPath));
          
          // Clear the invalid token
          const response = NextResponse.redirect(url);
          response.cookies.delete('auth_token');
          response.cookies.delete('refresh_token');
          return response;
        } 
        // For API routes: return 401 JSON response
        else if (pathname.startsWith('/api/')) {
          return new NextResponse(JSON.stringify({ 
            success: false, 
            message: 'Authentication required - Invalid or expired token' 
          }), { 
            status: 401, 
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache'
            }
          });
        }
      }
    } catch (error) {
      // Token validation error
      console.log(`Token validation error in middleware for ${pathname}:`, error);
      
      // For protected page routes: redirect to login
      if (!isPublicPath && !pathname.startsWith('/api/')) {
        const url = new URL('/auth/login', request.url);
        url.searchParams.set('returnUrl', encodeURI(pathname));
        
        // Clear the invalid token
        const response = NextResponse.redirect(url);
        response.cookies.delete('auth_token');
        response.cookies.delete('refresh_token');
        return response;
      } 
      // For API routes: return 401 JSON response
      else if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ 
          success: false, 
          message: 'Authentication error' 
        }), { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache'
          }
        });
      }
    }
  }

  // Default behavior for routes that don't match any condition
  console.log(`Default middleware behavior for ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - Static files (_next/static)
     * - Image optimization files (_next/image)
     * - Favicon
     * - Assets like fonts, icons, etc.
     */
    '/((?!_next/static|_next/image|favicon\.ico|fonts|images|icons|assets).*)',
  ],
};
