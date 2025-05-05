// Enhanced verification cache with user data
const USER_VERIFICATION_CACHE: Record<string, { 
  timestamp: number, 
  isValid: boolean,
  userData?: { id: number, role: string, status: string },
  requestId?: string
}> = {};

// Standard cache TTL of 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';  // Using jose for Edge-compatible JWT validation
import { isBlacklisted } from '@/features/auth/lib/clients/token/blacklist/TokenBlacklistServer';
import { securityConfigEdge } from '@/core/config/SecurityConfigEdge';

/**
 * Token validation for Edge Runtime using jose library
 */
async function isTokenValid(token: string): Promise<boolean> {
  try {
    const requestId = `validate-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`Token validation started with request ID: ${requestId}`);
    
    // Initialize security config
    securityConfigEdge.initialize();
    
    // Check if the token is blacklisted - FIX: Properly await the async method
    const blacklistCheck = await isBlacklisted(token);
    if (blacklistCheck) {
      console.log(`Token is blacklisted [${requestId}]`);
      return false;
    }
    
    // Get JWT secret from security config
    const jwtSecret = securityConfigEdge.getJwtSecret();
    const secretKey = new TextEncoder().encode(jwtSecret);
    
    // Verify token with required claims
    const { payload } = await jose.jwtVerify(token, secretKey, {
      issuer: 'rising-bsm',
      audience: process.env.JWT_AUDIENCE || 'rising-bsm-app'
    });
    
    if (!payload || !payload.sub) {
      console.log(`Token missing required fields [${requestId}]`);
      return false;
    }
    
    // Check token expiration with 5-minute grace period for clock skew
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expTime = payload.exp as number;
      const hasExpired = expTime < (now - 300); // 5-minute grace period
      
      if (hasExpired) {
        console.log(`Token expired at ${new Date(expTime * 1000).toISOString()} [${requestId}]`);
        return false;
      }
    }
    
    // Verify that the user referenced in the token still exists and is active
    const userId = payload.sub;
    const isUserValid = await verifyUserExists(userId.toString());
    if (!isUserValid) {
      console.log(`User ${userId} not found or inactive [${requestId}]`);
      return false;
    }
    
    console.log(`Token validation passed [${requestId}]`);
    return true;
  } catch (error) {
    console.log('Token validation error:', 
               error instanceof Error ? {
                 message: error.message,
                 name: error.name,
                 stack: error.stack
               } : String(error));
    return false;
  }
}

/**
 * Verify that the user referenced in the token exists and is active
 */
async function verifyUserExists(userId: string): Promise<boolean> {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  try {
    // Check cache first to reduce API calls
    const cacheEntry = USER_VERIFICATION_CACHE[userId];
    const now = Date.now();
    
    // If we have a recent cache hit, use it
    if (cacheEntry && now - cacheEntry.timestamp < CACHE_TTL) {
      console.log(`[${requestId}] Using cached verification for user ${userId} (valid: ${cacheEntry.isValid})`);
      return cacheEntry.isValid;
    }
    
    // Create URL for the verify-user endpoint
    const url = new URL('/api/auth/verify-user', 
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    url.searchParams.append('userId', userId);
    
    // Call the verify-user API endpoint
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Auth-Skip': 'true', // Prevent middleware recursion
        'Cache-Control': 'max-age=300',
        'X-Request-ID': requestId,
        'Accept': 'application/json'
      }
    });
    
    // Check if the verification request succeeded
    if (!response) {
      console.error(`[${requestId}] User ${userId} verification failed: No response from API`);
      return false;
    }
    
    // Get user data from headers if available
    const userIdFromHeader = response.headers.get('X-User-Id');
    const userRole = response.headers.get('X-User-Role');
    const userStatus = response.headers.get('X-User-Status');
    const isVerified = response.headers.get('X-User-Verified') === 'true';
    
    // If we have the verification data in headers, use it directly
    if (isVerified && userIdFromHeader && userRole && userStatus) {
      console.log(`[${requestId}] User ${userIdFromHeader} verified via headers`);
      
      // Store in cache
      USER_VERIFICATION_CACHE[userIdFromHeader] = {
        timestamp: now,
        isValid: true,
        userData: {
          id: parseInt(userIdFromHeader, 10),
          role: userRole,
          status: userStatus
        },
        requestId
      };
      
      return true;
    }
    
    // Otherwise parse response body
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      console.error(`[${requestId}] User ${userId} verification failed: Invalid JSON response`);
      return false;
    }
    
    // Extract success flag
    const isSuccess = responseData && typeof responseData.success === 'boolean' ? responseData.success : false;
    const isValid = response.ok && isSuccess;
    
    // Extract user data if available
    let userData = undefined;
    if (isValid && responseData?.data?.user) {
      userData = responseData.data.user;
    }
    
    // Store verification result in cache
    USER_VERIFICATION_CACHE[userId] = {
      timestamp: now,
      isValid,
      userData,
      requestId
    };
    
    if (!isValid) {
      console.error(`[${requestId}] User ${userId} verification failed: ${responseData?.message || 'Unknown error'}`);
    } else {
      console.log(`[${requestId}] User ${userId} verified successfully`);
    }
    
    return isValid;
  } catch (error) {
    console.error(`[${requestId}] Error verifying user ${userId}:`, 
      error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Clear the user verification cache - useful for testing
 */
function clearUserVerificationCache() {
  Object.keys(USER_VERIFICATION_CACHE).forEach(key => {
    delete USER_VERIFICATION_CACHE[key];
  });
}

/**
 * Middleware for authentication and authorization
 */
export async function middleware(request: NextRequest) {
  // Initialize security config
  securityConfigEdge.initialize();
  
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // More comprehensive checks for auth-related API routes
  // Skip middleware for BOTH verify-user endpoint and ALL auth API routes
  const isAuthApiRoute = pathname.startsWith('/api/auth/');
  const isVerifyUserFromMiddleware = pathname === '/api/auth/verify-user' && request.headers.get('X-Auth-Skip') === 'true';
  
  // Skip for any auth API route or when verification is called from middleware itself
  if (isAuthApiRoute || isVerifyUserFromMiddleware) {
    console.log(`Skipping auth check for ${isVerifyUserFromMiddleware ? 'verify-user API call from middleware' : 'auth API route'}: ${pathname}`);
    return NextResponse.next();
  }

  console.log(`Middleware checking path: ${pathname}`);
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/auth/login', 
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/',
    '/api/requests/public'
  ];
  
  const isPublicPath = publicPaths.some(path => {
    return pathname === path || 
           pathname.startsWith(path + '/');
  });
  
  console.log(`Path ${pathname} is ${isPublicPath ? 'public' : 'protected'}`);
  
  // Skip middleware for assets
  const isAssetRequest = /\.(jpg|jpeg|png|gif|svg|css|js)$/.test(pathname);
  if (isAssetRequest) {
    return NextResponse.next();
  }

  // If trying to access a protected route without a token, redirect to login
  if (!isPublicPath && !token) {
    console.log(`No token for protected path ${pathname}, redirecting to login`);
    
    // For protected pages, redirect to login
    if (!pathname.startsWith('/api/')) {
      const cleanPath = pathname.replace(/\/api\/api\//g, '/api/');
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('returnUrl', encodeURI(cleanPath));
      return NextResponse.redirect(url);
    } 
    // For API routes, return 401 Unauthorized
    else {
      return new NextResponse(JSON.stringify({ 
        success: false, 
        message: 'Authentication required' 
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // If logged in and trying to access login/register, redirect to dashboard
  if (isPublicPath && token && (pathname === '/auth/login' || pathname === '/auth/register')) {
    console.log(`Already logged in, redirecting to dashboard`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If we have a token, validate it
  if (token) {
    try {
      const isValid = await isTokenValid(token);
      
      if (isValid) {
        console.log(`Token validation passed for ${pathname}`);
        
        const response = NextResponse.next();
        
        // Add token to headers for API routes
        if (pathname.startsWith('/api/')) {
          console.log(`Adding X-Auth-Token header for API route: ${pathname}`);
          response.headers.set('X-Auth-Token', token);
          
          // Add decoded JWT data to headers
          try {
            const jwtSecret = securityConfigEdge.getJwtSecret();
            const secretKey = new TextEncoder().encode(jwtSecret);
            const decoded = await jose.jwtVerify(token, secretKey);
            
            if (decoded && decoded.payload && decoded.payload.sub) {
              response.headers.set('X-Auth-User-Id', decoded.payload.sub.toString());
              if (decoded.payload.role) {
                response.headers.set('X-Auth-User-Role', decoded.payload.role as string);
              }
              if (decoded.payload.name) {
                response.headers.set('X-Auth-User-Name', decoded.payload.name as string);
              }
              if (decoded.payload.email) {
                response.headers.set('X-Auth-User-Email', decoded.payload.email as string);
              }
            }
          } catch (error) {
            console.log('Could not decode token for headers', 
                      error instanceof Error ? error.message : 'Unknown error');
          }
        }
        
        return response;
      } else {
        // Token is invalid - handle appropriately
        console.log(`Token is invalid in middleware for ${pathname}`);
        
        // For protected pages: redirect to login
        if (!isPublicPath && !pathname.startsWith('/api/')) {
          const url = new URL('/auth/login', request.url);
          const response = NextResponse.redirect(url);
          response.cookies.delete('auth_token');
          return response;
        }
        // For API routes: return 401
        else if (pathname.startsWith('/api/')) {
          return new NextResponse(JSON.stringify({ 
            success: false, 
            message: 'Invalid authentication token' 
          }), { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    } catch (error) {
      console.log(`Token validation error in middleware: ${error}`);
      
      // For protected pages: redirect to login
      if (!isPublicPath && !pathname.startsWith('/api/')) {
        const url = new URL('/auth/login', request.url);
        const response = NextResponse.redirect(url);
        response.cookies.delete('auth_token');
        return response;
      } 
      // For API routes: return 401
      else if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ 
          success: false, 
          message: 'Authentication error' 
        }), { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  // Default behavior
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\.ico|fonts|images|icons|assets).*)',
  ],
};
