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

/**
 * Handle response cookies for authentication
 * Standardized cookie approach:
 * 1. auth_token: HTTP-only cookie for API security
 * 2. js_token: Non-HTTP-only cookie for JavaScript framework access
 * 3. refresh_token: HTTP-only cookie for token refresh
 */
async function setAuthCookies(
  response: NextResponse, 
  accessToken: string, 
  refreshToken: string, 
  accessExpirySeconds: number, 
  refreshExpirySeconds: number,
  userId: number
): Promise<void> {
  const logger = getLogger();
  
  // Set sameSite based on environment
  const sameSite = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
  const secure = process.env.NODE_ENV === 'production';
  
  // Log the cookie settings for debugging
  logger.debug('Setting cookies with security parameters', {
    secure,
    sameSite,
    path: '/',
    accessExpirySeconds,
    refreshExpirySeconds
  });
  
  // 1. Primary auth cookie - HTTP-only for API requests
  response.cookies.set('auth_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: accessExpirySeconds,
  });
  
  // 2. JavaScript accessible cookie for client-side framework
  response.cookies.set('js_token', accessToken, {
    httpOnly: false, // Accessible to JavaScript
    secure,
    sameSite,
    path: '/',
    maxAge: accessExpirySeconds,
  });
  
  // 3. Access token cookie - compatibility with older code
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: accessExpirySeconds,
  });
  
  // 4. Refresh token cookie - dedicated for refresh operations
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: refreshExpirySeconds,
  });
  
  // Log the cookies being set
  logger.debug('Final set cookies', {
    cookies: ['auth_token', 'js_token', 'access_token', 'refresh_token'],
    cookieCount: 4,
    userId
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
    
    // Log login attempt
    logger.info('AuthService.server: Login attempt', {
      email,
      ipAddress: context.ipAddress,
      context: requestId
    });
    
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
    const now = new Date();
    
    // Get token expiry details
    const accessExpiration = tokenInfo.expiresAt 
      ? new Date(tokenInfo.expiresAt) 
      : new Date(now.getTime() + 900000); // 15 minutes default
    
    const refreshExpiration = new Date(now.getTime() + 2592000000); // 30 days default
    
    // Calculate seconds until expiry
    const accessExpirySeconds = Math.max(1, Math.floor((accessExpiration.getTime() - now.getTime()) / 1000));
    const refreshExpirySeconds = Math.max(1, Math.floor((refreshExpiration.getTime() - now.getTime()) / 1000));
    
    // Log token expiration details
    logger.debug('Token expiration details', {
      accessExpiration: accessExpiration.toISOString(),
      refreshExpiration: refreshExpiration.toISOString(),
      now: now.toISOString(),
      accessExpirySeconds,
      refreshExpirySeconds
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
      }
    }, 'Login successful');
    
    // Log cookie information
    logger.debug('Setting authentication cookies', {
      accessTokenMaxAge: accessExpirySeconds,
      refreshTokenMaxAge: refreshExpirySeconds,
      userId: user.id
    });
    
    // Set HTTP-only cookies and security headers
    await setAuthCookies(
      response, 
      token, 
      refreshToken, 
      accessExpirySeconds, 
      refreshExpirySeconds,
      user.id
    );
    
    // Add expiration details in header for monitoring/debugging
    response.headers.set('X-Token-Expires', accessExpirySeconds.toString());
    
    // Add additional headers
    response.headers.set('X-Auth-User-ID', user.id.toString());
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Session-ID', sessionId);
    
    // Log successful login for monitoring
    logger.info('AuthService.server: Login successful', { 
      userId: user.id,
      tokenExpiry: accessExpiration.toISOString()
    });
    
    logger.info('User logged in successfully', { userId: user.id });
    
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
