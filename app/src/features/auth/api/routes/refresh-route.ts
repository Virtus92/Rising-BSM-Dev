/**
 * Token Refresh API Route Handler
 * Refreshes access tokens using a valid refresh token from HTTP-only cookie
 * Updated with improved security and blacklist integration
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { v4 as uuidv4 } from 'uuid';
import { ServerTokenManager, setTokenCookie } from '../../lib/clients/token/server';
import { blacklistToken } from '../../lib/clients/token/blacklist/TokenBlacklistServer';

// Redis client would be imported here for distributed rate limiting
// import { redisClient } from '@/core/redis';

/**
 * Handles token refresh requests with proper error handling
 */
export async function refreshHandler(req: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const requestId = uuidv4();
  
  try {
    // Get the auth service
    const serviceFactory = getServiceFactory();
    const authService = serviceFactory.createAuthService();
    
    // Extract refresh token from request
    const refreshToken = await extractRefreshToken(req);
    
    if (!refreshToken) {
      logger.warn('Token refresh failed: No refresh token found', { requestId });
      
      // Clear any invalid tokens
      const response = formatResponse.unauthorized('No refresh token available');
      const cookieStore = await cookies();
      cookieStore.delete('auth_token');
      cookieStore.delete('refresh_token');
      
      return response;
    }

    // Get IP address for audit
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Use auth service to refresh the token
    const refreshResult = await authService.refreshToken(
      { refreshToken },
      { context: { ipAddress, userAgent, requestId } }
    );
    
    // Extract data from the refresh result
    const { accessToken, refreshToken: newRefreshToken, expiresIn } = refreshResult;
    
    // Create response with security headers and include tokens in response body
    // This ensures ClientTokenManager can find the new refresh token
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        // Include all token information in response data
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        tokenType: 'Bearer',
        updatedAt: new Date().toISOString()
      }
    },
    {
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    // Set HTTP-only cookies with enhanced security
    setTokenCookie(response, accessToken, 'auth_token', expiresIn, {
      sameSite: 'strict',
      path: '/',
      priority: 'high'
    });
    
    setTokenCookie(response, newRefreshToken, 'refresh_token', expiresIn * 5, {
      sameSite: 'strict',
      path: '/api/auth/refresh', // Limit refresh token to the refresh endpoint only
      priority: 'medium'
    });
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Add debug log showing what tokens are being returned
    logger.debug('Token refresh successful, returning new tokens', {
      requestId,
      accessTokenLength: accessToken.length,
      refreshTokenLength: newRefreshToken.length,
      expiresIn
    });
    
    return response;
  } catch (error) {
    // Enhanced error logging with proper error details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Token refresh error:', {
      error: errorMessage,
      requestId
    });
    
    // Create error response
    const response = formatResponse.unauthorized(errorMessage);
    
    // Clear cookies on error
    response.cookies.delete('auth_token');
    response.cookies.delete('refresh_token');
    
    // Only blacklist the old token if it's a proper authentication error
    // This prevents unnecessary blacklisting when there are other issues
    if (error instanceof Error && 
        (error.message.includes('revoked') || 
         error.message.includes('expired') || 
         error.message.includes('Invalid refresh token'))) {
      
      const oldRefreshToken = await extractRefreshToken(req);
      
      if (oldRefreshToken) {
        try {
          // Add strict validation before blacklisting
          if (typeof oldRefreshToken === 'string' && oldRefreshToken.length > 30) {
            logger.debug('Blacklisting invalid refresh token', { 
              requestId,
              reason: error.message,
              tokenFirstChars: oldRefreshToken.substring(0, 8)
            });
            await blacklistToken(oldRefreshToken);
          } else {
            logger.debug('Skipped blacklisting due to invalid token format', { 
              requestId, 
              tokenLength: oldRefreshToken?.length 
            });
          }
        } catch (e) {
          logger.debug('Failed to blacklist token', { 
            requestId, 
            error: e instanceof Error ? e.message : String(e)
          });
        }
      }
    } else {
      // Log other types of errors without blacklisting
      logger.debug('Skipped token blacklisting for non-auth error', { 
        requestId,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      });
    }
    
    return response;
  }
}

/**
 * Helper function to extract refresh token from different sources
 */
async function extractRefreshToken(req: NextRequest): Promise<string | null> {
  const logger = getLogger();
  
  // Get refresh token from cookies first (preferred method)
  const cookieStore = await cookies();
  const token = cookieStore.get('refresh_token')?.value;
  
  if (token) {
    return token;
  }
  
  // If no token in cookies, try request body
  try {
    // Check for Content-Type
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.json();
      
      if (body && typeof body.refreshToken === 'string') {
        return body.refreshToken;
      }
    }
  } catch (error) {
    logger.debug('Failed to extract refresh token from request body');
  }
  
  // No refresh token found
  return null;
}