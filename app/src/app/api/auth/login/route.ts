/**
 * Login API Route
 * 
 * Direct authentication implementation without circular calls
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';

// Constants for authentication endpoints
const DEFAULT_ACCESS_TOKEN_EXPIRY = 3600; // 1 hour in seconds
const DEFAULT_REFRESH_TOKEN_EXPIRY = 2592000; // 30 days in seconds

const logger = getLogger();

/**
 * POST /api/auth/login
 * Authenticates a user and returns tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request data
    const data = await request.json();
    const { email, password, remember = false } = data;

    // Validate input
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400);
    }

    // Get auth service from factory
    const serviceFactory = getServiceFactory();
    const authService = serviceFactory.createAuthService();
    
    // Prepare context for login
    const context = {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      device: request.headers.get('sec-ch-ua') || 'unknown-device',
      requestId: request.headers.get('x-request-id') || crypto.randomUUID()
    };
    
    // Perform login directly with service
    const result = await authService.login({
      email,
      password,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      rememberMe: remember
    }, { context });
    
    // Get security config for token expiration
    const securityConfig = serviceFactory.createSecurityConfig();
    const accessExpiration = result.accessExpiration || securityConfig.getAccessTokenLifetime();
    const refreshExpiration = result.refreshExpiration || securityConfig.getRefreshTokenLifetime();
    
    // Extract user and tokens with safe checks
    const user = result.data?.user || result.user;
    const accessToken = result.data?.accessToken || result.accessToken;
    const refreshToken = result.data?.refreshToken || result.refreshToken;
    
    if (!user || !accessToken || !refreshToken) {
      throw new Error('Invalid authentication response');
    }
    
    logger.info('User logged in successfully', { userId: user.id });
    
    // Track timing information
    const processingTime = Date.now() - Date.parse(request.headers.get('x-request-time') || Date.now().toString());
    
    // Create response data
    const responseData = {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken: accessToken,
        refreshToken: refreshToken
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    };
    
    // Calculate appropriate maxAge values for cookies in seconds
    const now = Date.now();
    const accessExpirySeconds = accessExpiration && accessExpiration > now
      ? Math.floor((accessExpiration - now) / 1000) 
      : DEFAULT_ACCESS_TOKEN_EXPIRY;
    
    const refreshExpirySeconds = refreshExpiration && refreshExpiration > now
      ? Math.floor((refreshExpiration - now) / 1000) 
      : DEFAULT_REFRESH_TOKEN_EXPIRY;
    
    // Normalized expiration values for headers and logs
    const normalizedAccessExpiration = accessExpiration || (now + (accessExpirySeconds * 1000));
    const normalizedRefreshExpiration = refreshExpiration || (now + (refreshExpirySeconds * 1000));
    
    // Log detailed debug information
    logger.debug('Token expiration details', {
      accessExpiration: accessExpiration ? new Date(accessExpiration).toISOString() : 'undefined',
      refreshExpiration: refreshExpiration ? new Date(refreshExpiration).toISOString() : 'undefined',
      now: new Date(now).toISOString(),
      accessExpirySeconds,
      refreshExpirySeconds
    });
      
    // Ensure tokens are valid JWTs to avoid issues
    if (!accessToken || accessToken.split('.').length !== 3) {
      logger.error('Invalid access token format after login', { userId: user.id });
      return createErrorResponse('Authentication failed: invalid token format', 500);
    }
    
    // Log cookie settings for debugging
    logger.debug('Setting authentication cookies', {
      accessTokenMaxAge: accessExpirySeconds,
      refreshTokenMaxAge: refreshExpirySeconds,
      userId: user.id
    });
    
    // Create the response directly with all necessary headers for cross-browser compatibility
    const response = new NextResponse(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Token-Set': 'true',
          'X-Auth-User-ID': user.id.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'X-Processing-Time': `${processingTime}ms`,
          'X-Auth-Token-Expires-In': accessExpirySeconds.toString(),
          'X-Auth-Token-Type': 'Bearer',
        }
      }
    );
    
    // Generate a stronger cookie security setting
    // Use 'none' for local development, but otherwise enforce proper security
    const secureSetting = process.env.NODE_ENV === 'development' ? false : true;
    const sameSiteSetting = process.env.NODE_ENV === 'development' ? 'lax' : 'strict';
    
    // Enhanced logging for cookie setup
    logger.debug('Setting cookies with security parameters', {
      secure: secureSetting,
      sameSite: sameSiteSetting,
      path: '/',
      accessExpirySeconds,
      refreshExpirySeconds
    });
    
    // Set the main auth token with security settings
    try {
      response.cookies.set({
        name: 'auth_token',
        value: accessToken,
        httpOnly: true,
        secure: secureSetting,
        sameSite: sameSiteSetting,
        path: '/',
        maxAge: accessExpirySeconds
      });
      
      // Set a JavaScript-accessible version of the token
      // This cookie is accessible to client-side JavaScript for direct use
      response.cookies.set({
        name: 'js_token',
        value: accessToken,
        httpOnly: false, // Allows JavaScript access
        secure: secureSetting, 
        sameSite: sameSiteSetting,
        path: '/',
        maxAge: accessExpirySeconds
      });
      
      // Set the DOM accessible version of the token with proper encoding
      const jsTokenCookie = `js_token=${encodeURIComponent(accessToken)}; path=/; max-age=${accessExpirySeconds}; ${secureSetting ? 'secure;' : ''} SameSite=${sameSiteSetting}`;      
      response.headers.append('Set-Cookie', jsTokenCookie);
      
      // Redundant cookie as a fallback for compatibility
      response.cookies.set({
        name: 'access_token',
        value: accessToken,
        httpOnly: true,
        secure: secureSetting,
        sameSite: sameSiteSetting,
        path: '/',
        maxAge: accessExpirySeconds
      });
      
      // Refresh token with longer expiration
      response.cookies.set({
        name: 'refresh_token',
        value: refreshToken,
        httpOnly: true,
        secure: secureSetting,
        sameSite: sameSiteSetting,
        path: '/',
        maxAge: refreshExpirySeconds
      });
      
      // Also set token in cookie string for older browsers
      // This is a fallback method
      const expires = new Date(Date.now() + (accessExpirySeconds * 1000));
      const cookieValue = `js_token=${accessToken}; path=/; expires=${expires.toUTCString()}; ${secureSetting ? 'secure;' : ''} SameSite=${sameSiteSetting}`;
      response.headers.append('Set-Cookie', cookieValue);
      
    } catch (cookieError) {
      logger.error('Error setting cookies', {
        error: cookieError instanceof Error ? cookieError.message : String(cookieError),
        stack: cookieError instanceof Error ? cookieError.stack : undefined
      });
      // Continue - response will still contain token in body
    }
    
    // Debug log for final cookie list
    logger.debug('Final set cookies', {
      cookies: [...response.cookies.getAll()].map(c => c.name),
      cookieCount: response.cookies.getAll().length,
      userId: user.id
    });
    
    return response;
  } catch (error) {
    logger.error('Login error:', error as Error);
    
    // Determine appropriate error message and status
    let message = 'An error occurred during login';
    let status = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials') || 
          error.message.includes('not found') || 
          error.message.includes('invalid password')) {
        message = 'Invalid email or password';
        status = 401;
      } else if (error.message.includes('not active')) {
        message = 'Account is not active. Please contact admin.';
        status = 403;
      }
    }
    
    return createErrorResponse(message, status);
  }
}

/**
 * Helper function to create an error response
 */
function createErrorResponse(message: string, status: number = 500, code: string = 'ERROR') {
  return NextResponse.json({
    success: false,
    message,
    error: {
      code,
      message
    },
    timestamp: new Date().toISOString()
  }, { status });
}
