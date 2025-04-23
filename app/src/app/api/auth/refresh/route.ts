/**
 * Token Refresh API Route
 * Refreshes access tokens using a valid refresh token from HTTP-only cookie
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { formatResponse } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { securityConfig } from '@/infrastructure/common/config/SecurityConfig';
import { tokenBlacklist } from '@/infrastructure/auth/TokenBlacklist';
import { withRateLimit } from '@/infrastructure/api/middleware/rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';

/**
 * Handles token refresh requests with improved security
 */
/**
 * The refresh handler for token refresh
 * This is the main business logic for refreshing tokens
 */
async function refreshHandler(req: NextRequest) {
  // Track request start time for performance monitoring
  const requestStartTime = Date.now();
  // Get request headers for debugging
  const headersList = headers();
  const requestId = headersList.get('x-request-id') || uuidv4();
  const userAgent = headersList.get('user-agent') || 'unknown';
  const logger = getLogger();
  const prisma = getPrismaClient();
  
  // Log request details for debugging
  logger.debug('Token refresh request received', {
    requestId,
    userAgent,
    method: req.method,
    path: req.nextUrl.pathname
  });
  
  try {
    // Initialize security configuration
    await securityConfig.initialize();
    
    // Log security configuration on refresh attempts for debugging
    logger.info('JWT security configuration loaded successfully.', {
      requestId,
      timeTaken: Date.now() - requestStartTime,
    });
    
    // Get refresh token from cookies or request body
    const cookieStore = await cookies();
    let refreshToken = cookieStore.get('refresh_token')?.value;
    
    // Check for other possible cookie names
    if (!refreshToken) {
      // Look for alternative cookie names
      refreshToken = cookieStore.get('refresh_token_access')?.value ||
                   cookieStore.get('refreshToken')?.value ||
                   cookieStore.get('refresh')?.value;
    }
    
    // Log all cookies for debugging
    const allCookies = Array.from(cookieStore.getAll()).map(c => c.name);
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

    // Find the refresh token in the database
    let storedToken;
    try {
      storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          expiresAt: {
            gt: new Date()
          },
          isRevoked: false // Make sure token hasn't been revoked
        },
        include: {
          user: true
        }
      });
      
      // Log refresh token lookup result for debugging
      logger.debug('Refresh token database lookup result', {
        requestId,
        tokenFound: !!storedToken,
        hasUserData: storedToken?.user ? true : false
      });
    } catch (dbError) {
      logger.error('Database error during refresh token lookup', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        requestId
      });
      
      return NextResponse.json(
        formatResponse.error('Internal server error during token refresh', 500),
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        }
      );
    }
    
    if (!storedToken) {
      logger.warn('Refresh token not found or expired', {
        requestId,
        refreshTokenFirstChars: refreshToken ? refreshToken.substring(0, 8) + '...' : 'none'
      });
      
      // Clear invalid tokens
      const response = NextResponse.json(
        formatResponse.error('Invalid or expired refresh token', 401),
        { 
          status: 401,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
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
    
    const user = storedToken.user;
    
    // Check if user is active
    if (user.status !== 'active') {
      logger.warn('Token refresh failed: Inactive user', { userId: user.id });
      
      // Clear tokens
      const response = NextResponse.json(
        formatResponse.error('User account is not active', 403),
        { status: 403 }
      );
      
      response.cookies.delete('auth_token');
      response.cookies.delete('refresh_token');
      
      return response;
    }
    
    // Validate security configuration
    if (!securityConfig.isJwtSecretConfigured()) {
      logger.error('JWT_SECRET not properly configured', { 
        requestId,
        env: process.env.NODE_ENV,
        timeTaken: Date.now() - requestStartTime 
      });
      return NextResponse.json(
        formatResponse.error('Authentication service unavailable', 500),
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        }
      );
    }
    
    // Get security configuration
    const jwtSecret = securityConfig.getJwtSecret();
    const jwtOptions = securityConfig.getJwtOptions();
    
    // Generate a new token ID
    const tokenId = uuidv4();
    
    // Get token lifetimes
    const accessTokenLifetime = securityConfig.getAccessTokenLifetime();
    const refreshTokenLifetime = securityConfig.getRefreshTokenLifetime();
    
    // Generate new access token
    const accessToken = jwt.sign(
      { 
        sub: user.id, 
        email: user.email,
        name: user.name,
        role: user.role,
        jti: tokenId,
        // Add iat (issued at) claim for better tracking
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { 
        expiresIn: `${Math.floor(accessTokenLifetime / 60)}m`,
        issuer: jwtOptions.issuer,
        audience: jwtOptions.audience
      }
    );
    
    // Log token generation (without the actual tokens)
    logger.debug('Generated new tokens', {
      requestId,
      userId: user.id,
      tokenId,
      accessTokenExpiry: `${Math.floor(accessTokenLifetime / 60)} minutes`,
      refreshTokenExpiry: `${Math.floor(refreshTokenLifetime / 60)} minutes`
    });
    
    // Generate new refresh token
    const newRefreshToken = require('crypto').randomBytes(40).toString('hex');
    
    // Create expiration date for new refresh token
    const refreshTokenExpiry = new Date(Date.now() + refreshTokenLifetime * 1000);
    
    // Store new refresh token in database
    try {
      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: refreshTokenExpiry,
          createdByIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown'
        }
      });
      
      logger.debug('New refresh token stored in database', {
        requestId,
        userId: user.id,
        expiryDate: refreshTokenExpiry.toISOString()
      });
    } catch (createError) {
      logger.error('Failed to store new refresh token', {
        error: createError instanceof Error ? createError.message : String(createError),
        stack: createError instanceof Error ? createError.stack : undefined,
        requestId,
        userId: user.id
      });
      
      return NextResponse.json(
        formatResponse.error('Failed to generate new refresh token', 500),
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          }
        }
      );
    }
    
    // Revoke old refresh token
    try {
      // Use upsert instead of update to handle potential race conditions
      await prisma.refreshToken.upsert({
        where: { token: refreshToken },
        update: { 
          isRevoked: true,
          revokedAt: new Date(),
          revokedByIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          replacedByToken: newRefreshToken
        },
        create: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + refreshTokenLifetime * 1000),
          createdByIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          isRevoked: true,
          revokedAt: new Date(),
          revokedByIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          replacedByToken: newRefreshToken
        }
      });
      
      logger.debug('Old refresh token revoked', {
        requestId,
        userId: user.id
      });
    } catch (updateError) {
      // Log but don't fail - this is not critical
      logger.warn('Failed to revoke old refresh token', {
        error: updateError instanceof Error ? updateError.message : String(updateError),
        requestId,
        userId: user.id
      });
      // Continue processing - not a critical error
    }
    
    // If the old token had a tokenId reference, add that to the blacklist
    try {
      const oldJwtExpiry = storedToken.expiresAt.getTime();
      tokenBlacklist.add(tokenId, oldJwtExpiry, 'token-rotation');
      
      logger.debug('Added old token ID to blacklist', {
        requestId,
        tokenId,
        expiryTimestamp: oldJwtExpiry
      });
    } catch (blacklistError) {
      // Log but don't fail - blacklist is just an extra security measure
      logger.warn('Failed to add token to blacklist', {
        error: blacklistError instanceof Error ? blacklistError.message : String(blacklistError),
        requestId
      });
      // Continue processing - not a critical error
    }
    
    logger.info('Token refreshed successfully', { 
      userId: user.id,
      requestId,
      userAgent: req.headers.get('user-agent') || 'unknown'
    });
    
    // Log performance metrics
    logger.debug('Token refresh completed successfully', {
      requestId,
      timeTaken: Date.now() - requestStartTime,
      userId: user.id
    });
    
    // Create response with tokens as cookies
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        // Include tokens in response for client-side backup
        accessToken: accessToken,
        refreshToken: newRefreshToken,
        // Add expiration data for better client-side handling
        expiresIn: accessTokenLifetime,
        refreshExpiresIn: refreshTokenLifetime,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          // Add updated timestamp for cache control
          updatedAt: new Date().toISOString()
        }
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
      maxAge: accessTokenLifetime
    });
    
    response.cookies.set({
      name: 'auth_token_access',
      value: accessToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: accessTokenLifetime
    });
    
    response.cookies.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: accessTokenLifetime
    });
    
    // Set refresh token cookies (multiple variants for compatibility)
    response.cookies.set({
      name: 'refresh_token',
      value: newRefreshToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshTokenLifetime
    });
    
    response.cookies.set({
      name: 'refresh_token_access',
      value: newRefreshToken,
      httpOnly: true,
      secure: secure,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshTokenLifetime
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
    
    return NextResponse.json(
      formatResponse.error(errorMessage, 500),
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  }
}

// Export with rate limiting
export const POST = withRateLimit(refreshHandler);
