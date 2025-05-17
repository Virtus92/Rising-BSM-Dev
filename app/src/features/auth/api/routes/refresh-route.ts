/**
 * Token Refresh API Route Handler
 * Completely rewritten to fix all issues with token refresh and authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { jwtDecode } from 'jwt-decode';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { v4 as uuidv4 } from 'uuid';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';
import { RefreshTokenResponseDto } from '@/domain/';

// Get a logger instance
const logger = getLogger();

// Environment variables for configuration
const TOKEN_SECRET = process.env.JWT_SECRET || 'default-secret-for-development-only';
const ACCESS_TOKEN_EXPIRY = parseInt(process.env.ACCESS_TOKEN_EXPIRY || '3600', 10); // 1 hour default
const REFRESH_TOKEN_EXPIRY = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '2592000', 10); // 30 days default

/**
 * Set auth cookies with proper security and expiration settings
 */
function setAuthCookies(response: NextResponse, accessToken: RefreshTokenResponseDto, refreshToken: string, expiresIn: number): void {
  const secure = process.env.NODE_ENV === 'production';

  // Decode the access token to get user information
  const accessTokenString = JSON.stringify(accessToken);
  
  // Set access token cookie
  response.cookies.set({
    name: 'auth_token',
    value: accessTokenString,
    maxAge: expiresIn,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    priority: 'high'
  });
  
  // Set refresh token cookie with longer expiry
  response.cookies.set({
    name: 'refresh_token',
    value: refreshToken,
    maxAge: REFRESH_TOKEN_EXPIRY,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    priority: 'medium'
  });
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}

/**
 * Extract refresh token from request
 */
async function extractRefreshToken(req: NextRequest): Promise<string | undefined> {
  // First try to get from cookie (preferred method)
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (refreshToken) {
    return refreshToken;
  }
  
  // Then try from request body if available
  try {
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const body = await req.json();
      if (body && typeof body.refreshToken === 'string') {
        return body.refreshToken;
      }
    }
  } catch (error) {
    logger.debug('Failed to extract refresh token from request body', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
  
  // Not found
  return undefined;
}

/**
 * Validate a refresh token against the database
 */
async function validateRefreshToken(token: string): Promise<{ valid: boolean, userId?: number }> {
  try {
    // Get RefreshTokenService from the factory
    const serviceFactory = getServiceFactory();
    const refreshTokenService = serviceFactory.createRefreshTokenService();
    
    // Find token in database
    const tokenEntity = await refreshTokenService.findByToken(token);
    
    // If token doesn't exist or is expired/revoked, it's invalid
    if (!tokenEntity || !tokenEntity.isActive()) {
      return { valid: false };
    }
    
    // Return validation result with userId
    return {
      valid: true,
      userId: tokenEntity.userId
    };
  } catch (error) {
    logger.error('Error validating refresh token:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return { valid: false };
  }
}

/**
 * Create a new access token for a user
 */
async function createAccessToken(userId: number): Promise<{ token: RefreshTokenResponseDto, expiresIn: number }> {
  try {
    // Get AuthService from the factory
    const serviceFactory = getServiceFactory();
    const authService = serviceFactory.createAuthService();
    
    // Get UserService to get user details
    const userService = serviceFactory.createUserService();
    const user = await userService.getUserDetails(userId);
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Get refresh token for refreshing
    const refreshTokenService = serviceFactory.createRefreshTokenService();
    const refreshTokens = await refreshTokenService.findByUser(userId);
    
    // Get the most recent active token
    const activeToken = refreshTokens.find(token => token.isActive());
    
    if (!activeToken) {
      throw new Error('No active refresh token found for user');
    }

    // Generate a new access token
    const token = await authService.refreshToken({
      refreshToken: activeToken.token
    });
    
    return {
      token,
      expiresIn: ACCESS_TOKEN_EXPIRY
    };
  } catch (error) {
    logger.error('Error creating access token:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    throw error;
  }
}

/**
 * Rotate refresh token (revoke old one, create new one)
 */
async function rotateRefreshToken(oldToken: string, userId: number, ipAddress?: string): Promise<string> {
  try {
    // Get RefreshTokenService from the factory
    const serviceFactory = getServiceFactory();
    const refreshTokenService = serviceFactory.createRefreshTokenService();
    
    // Find the old token
    const tokenEntity = await refreshTokenService.findByToken(oldToken);
    
    if (!tokenEntity) {
      throw new Error('Invalid refresh token');
    }
    
    // Generate a new token
    const newToken = uuidv4();
    
    // Revoke the old token, linking it to the new one
    await refreshTokenService.revokeToken(oldToken, ipAddress, newToken);
    
    // Create a new refresh token
    const refreshToken = await refreshTokenService.create({
      token: newToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000)
    });
    if (!refreshToken) {
      throw new Error('Failed to create new refresh token');
    }
    
    // Return the new token
    return refreshToken.token;
  } catch (error) {
    logger.error('Error rotating refresh token:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    throw error;
  }
}

/**
 * Handles token refresh requests with proper error boundaries
 */
export async function refreshHandler(req: NextRequest): Promise<NextResponse> {
  const requestId = uuidv4();
  
  try {
    // Extract refresh token from request
    const refreshToken = await extractRefreshToken(req);
    
    if (!refreshToken) {
      logger.warn('Token refresh failed: No refresh token found', { requestId });
      
      // Create error response
      const error = authErrorHandler.createError(
        'No refresh token available',
        AuthErrorType.TOKEN_MISSING,
      );
      
      // Clear cookies in response
      const response = error.toResponse();
      response.cookies.delete('auth_token');
      response.cookies.delete('refresh_token');
      
      return response;
    }
    
    // Validate the refresh token
    const validation = await validateRefreshToken(refreshToken);
    
    if (!validation.valid || !validation.userId) {
      logger.warn('Invalid or expired refresh token', { requestId });
      
      const error = authErrorHandler.createError(
        'Invalid or expired refresh token',
        AuthErrorType.TOKEN_INVALID,
      );
      
      // Clear cookies in response
      const response = error.toResponse();
      response.cookies.delete('auth_token');
      response.cookies.delete('refresh_token');
      
      return response;
    }
    
    // Get IP address for audit
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Generate a new access token
    const { token: accessToken, expiresIn } = await createAccessToken(validation.userId);
    
    // Rotate the refresh token
    const newRefreshToken = await rotateRefreshToken(refreshToken, validation.userId, ipAddress);
    
    // Create the response
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        expiresIn,
        tokenType: 'Bearer',
        updatedAt: new Date().toISOString()
      }
    }, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    // Set cookies in the response
    setAuthCookies(response, accessToken, newRefreshToken, expiresIn);
    
    logger.info('Token refresh completed successfully', {
      requestId,
      userId: validation.userId,
      expiresIn
    });
    
    return response;
  } catch (error) {
    // Log the error
    logger.error('Token refresh error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId
    });
    
    // Handle the error
    const normalizedError = authErrorHandler.normalizeError(error as Error);
    
    // Create error response
    const response = normalizedError.toResponse();
    
    // Clear cookies in response
    response.cookies.delete('auth_token');
    response.cookies.delete('refresh_token');
    
    return response;
  }
}