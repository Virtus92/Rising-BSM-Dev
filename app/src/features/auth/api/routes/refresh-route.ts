/**
 * Token Refresh API Route Handler
 * Refreshes access tokens using a valid refresh token from HTTP-only cookie
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';

/**
 * Handles token refresh requests with improved security
 */
export async function refreshHandler(req: NextRequest): Promise<NextResponse> {
  // Track request start time for performance monitoring
  const requestStartTime = Date.now();
  // Get request headers for debugging - await the headers() promise
  const headersList = await headers();
  const requestId = headersList.get('x-request-id') || uuidv4();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  // Log request details for debugging
  logger.debug('Token refresh request received', {
    requestId,
    userAgent,
    method: req.method,
    path: req.nextUrl.pathname
  });
  
  try {
    // Get the auth service
    const authService = serviceFactory.createAuthService();
    
    // Get refresh token from cookies or request body
    const cookieStore = await cookies();
    // Use proper cookies() handling - synchronous in current Next.js
    let refreshToken = cookieStore.get('refresh_token')?.value;
    
    // Check for other possible cookie names
    if (!refreshToken) {
      // Look for alternative cookie names 
      refreshToken = cookieStore.get('refresh_token_access')?.value ||
                   cookieStore.get('refreshToken')?.value ||
                   cookieStore.get('refresh')?.value;
    }
    
    // Log all cookies for debugging
    const allCookies = cookieStore.getAll().map(c => c.name);
    logger.debug('Available cookies in refresh request', { cookies: allCookies });
    
    // If still no token from cookies, try to get from request body
    if (!refreshToken) {
      try {
        // Check for Content-Type
        const contentType = req.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Clone the request to prevent 'Body already used' error
          const clonedReq = req.clone();
          const body = await clonedReq.json();
          if (body && typeof body.refreshToken === 'string') {
            refreshToken = body.refreshToken;
            logger.info('Using refresh token from request body');
          }
        } else {
          logger.debug('Request Content-Type is not application/json', {
            contentType: contentType || 'not specified'
          });
        }
      } catch (parseError) {
        logger.warn('Failed to parse request body for refresh token', {
          error: parseError instanceof Error ? parseError.message : String(parseError)
        });
        // Continue with null refreshToken
      }
    }
    
    if (!refreshToken) {
      logger.warn('Token refresh failed: No refresh token in cookies or body', {
        requestId,
        path: req.nextUrl.pathname
      });
      // Clear any invalid tokens to prevent further issues
      const response = NextResponse.json(
        formatResponse.error('No refresh token available', 401),
        { 
          status: 401,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
      
      // Clear all known auth and refresh token cookie variants
      response.cookies.delete('auth_token');
      response.cookies.delete('auth_token_access');
      response.cookies.delete('access_token');
      response.cookies.delete('accessToken');
      response.cookies.delete('refresh_token');
      response.cookies.delete('refresh_token_access');
      response.cookies.delete('refreshToken');
      response.cookies.delete('refresh');
      
      return response;
    }

    // Get IP address for audit
    const ipAddress = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Use auth service to refresh the token
    const refreshResult = await authService.refreshToken(
      { refreshToken },
      { context: { ipAddress, userAgent } }
    );
    
    // Extract data from the refresh result
    const { accessToken, refreshToken: newRefreshToken, expiresIn, id: userId } = refreshResult;
    
    // Log performance metrics
    logger.debug('Token refresh completed successfully', {
      requestId,
      timeTaken: Date.now() - requestStartTime,
      userId
    });
    
    // Create response with tokens as cookies
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        // Include tokens in response for client-side backup
        accessToken,
        refreshToken: newRefreshToken,
        // Add expiration data for better client-side handling
        expiresIn,
        refreshExpiresIn: 30 * 24 * 60 * 60, // 30 days default
        tokenType: 'Bearer',
        // Updated timestamp for cache control
        updatedAt: new Date().toISOString()
      }
    },
    {
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    // Set HTTP-only cookies with standardized names
    const secure = process.env.NODE_ENV === 'production';
    
    // Set access token cookies (multiple variants for compatibility)
    response.cookies.set({
      name: 'auth_token',
      value: accessToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax', // Changed from strict to lax for better compatibility
      path: '/',
      maxAge: expiresIn
    });
    
    response.cookies.set({
      name: 'auth_token_access',
      value: accessToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn
    });
    
    response.cookies.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn
    });
    
    // Set refresh token cookies (multiple variants for compatibility)
    const refreshExpiration = 30 * 24 * 60 * 60; // 30 days default
    
    response.cookies.set({
      name: 'refresh_token',
      value: newRefreshToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshExpiration
    });
    
    response.cookies.set({
      name: 'refresh_token_access',
      value: newRefreshToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshExpiration
    });
    
    return response;
  } catch (error) {
    // Enhanced error logging with proper error details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('Token refresh error:', {
      error: errorMessage,
      stack: errorStack,
      details: error,
      requestId,
      userAgent,
      path: req.nextUrl.pathname,
      method: req.method
    });
    
    // Create error response
    const response = NextResponse.json(
      formatResponse.error(errorMessage, 401),
      { 
        status: 401,
        headers: {
          'X-Request-ID': requestId,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
    
    // Clear cookies on error
    response.cookies.delete('auth_token');
    response.cookies.delete('auth_token_access');
    response.cookies.delete('access_token');
    response.cookies.delete('accessToken');
    response.cookies.delete('refresh_token');
    response.cookies.delete('refresh_token_access');
    response.cookies.delete('refreshToken');
    response.cookies.delete('refresh');
    
    return response;
  }
}
