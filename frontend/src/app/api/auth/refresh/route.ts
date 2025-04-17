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

/**
 * Handles token refresh requests with improved security
 */
async function refreshHandler(req: NextRequest) {
  const logger = getLogger();
  const prisma = getPrismaClient();
  
  try {
    // Log security configuration on refresh attempts for debugging
    logger.info('JWT security configuration loaded successfully.');
    
    // Get refresh token from cookies
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      logger.warn('Token refresh failed: No refresh token in cookies');
      // Clear any invalid tokens to prevent further issues
      const response = NextResponse.json(
        formatResponse.error('No refresh token available', 401),
        { status: 401 }
      );
      
      response.cookies.delete('auth_token');
      response.cookies.delete('refresh_token');
      
      return response;
    }

    // Find the refresh token in the database
    const storedToken = await prisma.refreshToken.findFirst({
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
    
    if (!storedToken) {
      logger.warn('Refresh token not found or expired');
      
      // Clear invalid tokens
      const response = NextResponse.json(
        formatResponse.error('Invalid or expired refresh token', 401),
        { status: 401 }
      );
      
      response.cookies.delete('auth_token');
      response.cookies.delete('refresh_token');
      
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
      logger.error('JWT_SECRET not properly configured');
      return NextResponse.json(
        formatResponse.error('Authentication service unavailable', 500),
        { status: 500 }
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
        jti: tokenId
      },
      jwtSecret,
      { 
        expiresIn: `${Math.floor(accessTokenLifetime / 60)}m`,
        issuer: jwtOptions.issuer,
        audience: jwtOptions.audience
      }
    );
    
    // Generate new refresh token
    const newRefreshToken = require('crypto').randomBytes(40).toString('hex');
    
    // Store new refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshTokenLifetime * 1000),
        createdByIp: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { 
        isRevoked: true,
        revokedAt: new Date(),
        revokedByIp: req.headers.get('x-forwarded-for') || 'unknown',
        replacedByToken: newRefreshToken
      }
    });
    
    // If the old token had a tokenId reference, add that to the blacklist
    const oldJwtExpiry = storedToken.expiresAt.getTime();
    tokenBlacklist.add(tokenId, oldJwtExpiry, 'token-rotation');
    
    logger.info('Token refreshed successfully', { userId: user.id });
    
    // Create response with tokens as cookies
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        // Include tokens in response for client-side backup
        accessToken: accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
    
    // Set HTTP-only cookies with standardized names
    response.cookies.set({
      name: 'auth_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from strict to lax for better compatibility
      path: '/',
      maxAge: accessTokenLifetime
    });
    
    response.cookies.set({
      name: 'refresh_token',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
      details: error
    });
    
    return NextResponse.json(
      formatResponse.error(errorMessage, 500),
      { status: 500 }
    );
  }
}

// Export with rate limiting
export const POST = withRateLimit(refreshHandler);
