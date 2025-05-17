/**
 * Login API Route Handler
 * Handles user authentication and token generation
 * Centralized implementation using AuthService as the single source of truth
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import AuthService from '@/features/auth/core/AuthService';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';
import { cookies } from 'next/headers';
import { UserRole } from '@/domain/enums/UserEnums';

/**
 * Handle response cookies for authentication
 */
async function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string, accessExpiration: number, refreshExpiration: number): Promise<void> {
  // Set HTTP-only cookies with proper security settings
  response.cookies.set('auth_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: accessExpiration,
  });
  
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: refreshExpiration,
  });
  
  // Add security headers
  response.headers.set('X-Token-Set', 'true');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
}

// Simplified request tracker to prevent recursive calls
const requestTracker = new Set<string>();
const REQUEST_TIMEOUT = 30000; // 30 seconds

export async function loginHandler(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  
  // Generate a unique request ID
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  
  // Check if we're already processing this request (prevents recursion)
  if (requestTracker.has(requestId)) {
    logger.warn('Detected recursive login call, aborting', { requestId });
    const error = authErrorHandler.createError(
      'Internal server error: recursive login detected',
      AuthErrorType.SERVER_ERROR
    );
    return error.toResponse();
  }
  
  // Add request to ongoing set with proper cleanup
  requestTracker.add(requestId);
  setTimeout(() => requestTracker.delete(requestId), REQUEST_TIMEOUT);
  
  try {
    // Parse request data
    const data = await request.json();
    const { email, password, remember = false } = data;

    // Validate input
    if (!email || !password) {
      const error = authErrorHandler.createError(
        'Email and password are required',
        AuthErrorType.INVALID_REQUEST
      );
      return error.toResponse();
    }

    // Prepare context for login
    const context = {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      device: request.headers.get('sec-ch-ua') || 'unknown-device',
      requestId
    };
    
    // Use AuthService directly
    const result = await AuthService.signIn(email, password);
    
    if (!result.success) {
      const error = authErrorHandler.createError(
        result.message || 'Invalid credentials',
        AuthErrorType.LOGIN_FAILED,
      );
      return error.toResponse();
    }
    
    // Get token and user info
    const token = await AuthService.getToken();
    const user = AuthService.getUser();
    
    if (!token || !user) {
      const error = authErrorHandler.createError(
        'Authentication successful but failed to get user information',
        AuthErrorType.SERVER_ERROR
      );
      return error.toResponse();
    }
    
    // Get token expiration time from current token
    const tokenInfo = await AuthService.getTokenInfo();
    const retrievedExpiresIn = tokenInfo.expiresAt 
      ? Math.floor((tokenInfo.expiresAt.getTime() - Date.now()) / 1000) 
      : 3600;
    
    // Standardized minimum token durations
    const MIN_ACCESS_TOKEN_DURATION = 1800; // 30 minutes minimum
    const MIN_REFRESH_TOKEN_DURATION = 86400; // 24 hours minimum
    
    // Get token expiration from security config for refresh token
    const securityConfig = getServiceFactory().createSecurityConfig();
    
    // Ensure access token has appropriate duration regardless of what was received
    const accessExpiration = Math.max(MIN_ACCESS_TOKEN_DURATION, retrievedExpiresIn);
    
    // Get refresh token duration from config but ensure minimum
    const configRefreshDuration = securityConfig.getRefreshTokenLifetime(); // default 30 days
    const refreshExpiration = Math.max(MIN_REFRESH_TOKEN_DURATION, configRefreshDuration);
    
    // Final sanitized values
    const accessExpirationSeconds = Math.floor(accessExpiration);
    const refreshExpirationSeconds = Math.floor(refreshExpiration);
    
    // Log the standardized token durations for monitoring
    logger.debug('Setting standardized token durations', {
      originalExpiresIn: retrievedExpiresIn,
      finalAccessExpiration: accessExpirationSeconds,
      finalRefreshExpiration: refreshExpirationSeconds
    });
    
    // Create a refresh token
    let refreshToken = '';
    
    try {
      const refreshResult = await AuthService.refreshToken();
      refreshToken = refreshResult.data?.refreshToken || '';
    } catch (refreshError) {
      logger.warn('Failed to generate refresh token, continuing with access token only', { 
        error: refreshError instanceof Error ? refreshError.message : String(refreshError) 
      });
    }
    
    // Generate a sessionId for tracking
    const sessionId = crypto.randomUUID().split('-')[0];
    
    // Create response
    const response = formatResponse.success({
      user: {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role
      },
      // Include tokens in response body for client-side storage backup
      accessToken: token,
      refreshToken
    }, 'Login successful');
    
    // Set HTTP-only cookies and security headers
    await setAuthCookies(response, token, refreshToken, accessExpirationSeconds, refreshExpirationSeconds);
    
    // Add expiration details in header for monitoring/debugging
    response.headers.set('X-Token-Expires', accessExpirationSeconds.toString());
    
    // Add additional headers
    response.headers.set('X-Auth-User-ID', user.id.toString());
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Session-ID', sessionId);
    
    // Log successful login for monitoring
    logger.info('User authenticated successfully', { 
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      requestId
    });
    
    return response;
  } catch (error) {
    // Use AuthErrorHandler to normalize and handle errors
    const normalizedError = authErrorHandler.normalizeError(error as Error);
    
    logger.error('Login error:', { 
      error: normalizedError.message,
      type: normalizedError.type,
      status: normalizedError.status
    });
    
    return normalizedError.toResponse();
  } finally {
    // Ensure we clean up even if there's an unexpected error
    requestTracker.delete(requestId);
  }
}
