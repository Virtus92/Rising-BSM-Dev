/**
 * Clean Token Refresh Handler
 * 
 * Design principles:
 * 1. Use new auth service
 * 2. Handle token refresh cleanly
 * 3. Proper error responses
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@/core/factories/serviceFactory.server';
const authService = getAuthService();
import { getLogger } from '@/core/logging';
import { runWithContext } from '@/shared/utils/asyncLocalStorage';

const logger = getLogger();

export async function refreshHandler(request: NextRequest): Promise<NextResponse> {
  // Create context to pass to the async local storage with detailed metrics
  const context: Record<string, any> = {
    requestId: crypto.randomUUID(),
    path: request.nextUrl.pathname,
    timestamp: Date.now(),
    metrics: {
      parseStart: 0,
      parseEnd: 0,
      tokenStart: 0,
      tokenEnd: 0,
      refreshStart: 0,
      refreshEnd: 0
    }
  };
  
  // Run the handler with context
  return runWithContext(context, async () => {
    try {
      // Get refresh token from cookies or request body with better error handling
      context.metrics.parseStart = Date.now();
      let requestData: { refreshToken?: string } = {};
      try {
        requestData = await request.json();
      } catch (e) {
      // JSON parsing failed, continue with empty object
        logger.debug('Request body parsing failed, continuing with cookie-based refresh', { 
        requestId: context.requestId,
        error: e instanceof Error ? e.message : 'Unknown error' 
      });
    }
    context.metrics.parseEnd = Date.now();
      
      // Try multiple possible refresh token sources with metrics
      context.metrics.tokenStart = Date.now();
      let refreshToken = null;
      let tokenSource = 'none';
      
      // First try from request body
      if (requestData.refreshToken) {
        refreshToken = requestData.refreshToken;
        tokenSource = 'body';
        logger.debug('Using refresh token from request body', { 
          requestId: context.requestId,
          tokenLength: refreshToken.length 
        });
      }
      
      // Then try from cookies with multiple possible names
      if (!refreshToken) {
        const possibleCookieNames = ['refresh_token', 'refresh_token_backup'];
        
        for (const cookieName of possibleCookieNames) {
          const cookie = request.cookies.get(cookieName);
          if (cookie?.value) {
            refreshToken = cookie.value;
            tokenSource = `cookie:${cookieName}`;
            logger.debug(`Using refresh token from cookie: ${cookieName}`, { 
              requestId: context.requestId,
              tokenLength: refreshToken.length 
            });
            break;
          }
        }
      }
      
      // Last resort: Try to extract from authorization header
      if (!refreshToken) {
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          refreshToken = authHeader.substring(7);
          tokenSource = 'header';
          logger.debug('Using token from Authorization header', { 
            requestId: context.requestId,
            tokenLength: refreshToken.length 
          });
        }
      }
      
      context.metrics.tokenEnd = Date.now();
      
      if (!refreshToken) {
        logger.warn('No refresh token found in request');
        return NextResponse.json(
          {
            success: false,
            message: 'Refresh token not provided',
          },
          { 
            status: 401,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );
      }
      
      logger.debug('Finding refresh token', {
        tokenLength: refreshToken.length,
        tokenPrefix: refreshToken.substring(0, 8),
        requestId: context.requestId
      });
      
      // Refresh token with performance metrics
      context.metrics.refreshStart = Date.now();
      const authResponse = await authService.refreshToken({
        refreshToken,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown'
      });
      
      if (!authResponse.success) {
        logger.warn('Token refresh operation failed', {
          message: authResponse.message,
          status: 401,
          requestId: context.requestId
        });
        
        return NextResponse.json(
          {
            success: false,
            message: authResponse.message || 'Token refresh failed',
            code: 'TOKEN_REFRESH_FAILED',
            timestamp: new Date().toISOString()
          },
          { 
            status: 401,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache',
              'X-Auth-Status': 'token-refresh-failed'
            }
          }
        );
      }
      
      // Use the user data from the token response if getCurrentUser fails
      let user;
      try {
        // Try to get current user after refresh
        user = await authService.getCurrentUser();
      } catch (error) {
        logger.warn('Error getting current user, using token data instead:', error as Error);
        user = authResponse.data?.user;
      }
      
      if (!user) {
        logger.warn('No user data available in refresh response');
        return NextResponse.json({
          success: true,
          message: 'Token refreshed but user data not available',
        });
      }
      
      // Make sure to include token info in the response
      const tokenDetails = authResponse.data;
      if (!tokenDetails) {
        logger.warn('No token details available in refresh response');
        return NextResponse.json({
          success: true,
          message: 'Token refreshed but no token details available',
        });
      }
      
      // Use authResponse.accessToken as fallback if tokenDetails.token is not available
      const accessToken = tokenDetails.token || authResponse.accessToken || '';
      
      // Get the refreshToken from the response if available or keep using the existing one
      const newRefreshToken = tokenDetails.refreshToken || authResponse.refreshToken || refreshToken;
      const expiresIn = tokenDetails.expiresIn || 900; // Default 15 minutes
      
      logger.info('Token refreshed successfully', { userId: user.id });
      context.metrics.refreshEnd = Date.now();
      
      // Calculate performance metrics
      const totalTime = Date.now() - context.timestamp;
      const parseTime = context.metrics.parseEnd - context.metrics.parseStart;
      const tokenTime = context.metrics.tokenEnd - context.metrics.tokenStart;
      const refreshTime = context.metrics.refreshEnd - context.metrics.refreshStart;
      
      logger.info('Token refresh completed successfully', {
        requestId: context.requestId,
        totalTimeMs: totalTime,
        parseTimeMs: parseTime,
        tokenTimeMs: tokenTime,
        refreshTimeMs: refreshTime,
        tokenSource: tokenSource,
        userId: user.id
      });
      
      // Create a proper HTTP-only cookie for the auth token
      const responseObj = NextResponse.json({
        success: true,
        data: {
          accessToken: accessToken, // Include token in response
          refreshToken: newRefreshToken,
          expiresIn: expiresIn,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        message: 'Token refreshed successfully',
      });
      
      // Set HTTP-only cookies with standardized security settings and multiple cookie names for compatibility
      // Set primary auth_token cookie
      responseObj.cookies.set('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: expiresIn,
      });
      
      // Set duplicate access_token cookie for compatibility
      responseObj.cookies.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: expiresIn,
      });
      
      // Set refresh_token cookie
      responseObj.cookies.set('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: expiresIn * 30, // Refresh token lives longer
      });
      
      // Add special cookie for API paths with less restrictive path
      responseObj.cookies.set('api_auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/',
        maxAge: expiresIn,
      });
      
      // Add better cache control headers and performance metrics
      responseObj.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      responseObj.headers.set('Pragma', 'no-cache');
      responseObj.headers.set('Expires', '0');
      responseObj.headers.set('X-Auth-Status', 'refreshed');
      responseObj.headers.set('X-Request-Duration', `${totalTime}ms`);
      responseObj.headers.set('X-Token-Source', tokenSource);
      responseObj.headers.set('X-Request-ID', context.requestId);
      
      return responseObj;
    } catch (error) {
      logger.error('Token refresh error:', error as Error);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Token refresh failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          code: 'TOKEN_REFRESH_ERROR'
        },
        { 
          status: 401, 
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'X-Auth-Status': 'token-refresh-error'
          }
        }
      );
    }
  });
}
