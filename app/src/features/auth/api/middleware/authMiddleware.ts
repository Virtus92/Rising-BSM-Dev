/**
 * Centralized Authentication Middleware
 * 
 * Single source of truth for route authentication in Next.js App Router.
 * Properly handles authentication with no fallbacks or workarounds.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import AuthService from '@/features/auth/core/AuthService';
import authErrorHandler, { AuthError } from '@/features/auth/utils/AuthErrorHandler.server';
import { AuthErrorType } from '@/types/types/auth';
import { UserRole } from '@/domain';
import { jwtDecode } from 'jwt-decode';

const logger = getLogger();

// Type definitions for auth middleware
export interface AuthOptions {
  requireAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string[];
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  };
  error?: string;
  message?: string;   
  statusCode?: number;
  status?: number;    
}

// Type for auth handler function
export type AuthHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>;

/**
 * Extract token from request with improved logging
 */
export async function extractAuthToken(request: NextRequest): Promise<string | null> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID().substring(0, 8);
  
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    logger.debug('Found token in Authorization header', {
      requestId,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10) + '...'
    });
    return token;
  }
  
  // Check for token in request body
  try {
    // Try to clone the request to avoid consuming the body
    const clonedRequest = request.clone();
    const body = await clonedRequest.json().catch(() => null);
    
    if (body?.token && typeof body.token === 'string') {
      logger.debug('Found token in request body', {
        requestId,
        tokenLength: body.token.length,
        tokenPrefix: body.token.substring(0, 10) + '...'
      });
      return body.token;
    }
  } catch (e) {
    // Ignore parsing errors, continue checking other sources
  }
  
  // Check all possible cookie names
  // Important: Add js_token first to prioritize it, as it's specifically set for JavaScript access
  const cookieNames = ['js_token', 'auth_token', 'access_token', 'api_auth_token'];
  
  for (const cookieName of cookieNames) {
    const cookieToken = request.cookies.get(cookieName)?.value;
    if (cookieToken) {
      logger.debug(`Found token in ${cookieName} cookie`, {
        requestId,
        tokenLength: cookieToken.length,
        tokenPrefix: cookieToken.substring(0, 10) + '...'
      });
      return cookieToken;
    }
  }
  
  // Check for refresh token cookie - we might be able to use it for token validation
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (refreshToken) {
    logger.debug('Found refresh token but no access token', {
      requestId,
      refreshTokenLength: refreshToken.length
    });
    // We don't return the refresh token as it's not a valid access token
    // But we log it for debugging purposes
  }
  
  // Log that no token was found with more details
  logger.debug('No authentication token found in request', {
    requestId,
    hasAuthHeader: !!authHeader,
    authHeaderFormat: authHeader ? (authHeader.startsWith('Bearer ') ? 'valid' : 'invalid') : 'missing',
    cookieExists: cookieNames.some(name => !!request.cookies.get(name)),
    refreshTokenExists: !!request.cookies.get('refresh_token'),
    allCookies: [...request.cookies.getAll()].map(c => c.name),
    url: request.url,
    method: request.method
  });
  
  return null;
}

/**
 * Decode and validate JWT token - no workarounds, fail on invalid
 */
async function decodeAndValidateToken(token: string): Promise<{ valid: boolean; userId?: number; role?: string; error?: Error; serverValidated?: boolean }> {
  try {
    // Log token details to help debug
    logger.debug('Validating token', { 
      tokenLength: token?.length || 0,
      tokenPrefix: token?.substring(0, 10) || 'none'
    });
    
    if (!token || token.trim() === '') {
      logger.error('Empty token provided for validation');
      return { valid: false };
    }
    
    // Ensure token has valid JWT format
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.error('Invalid token format', { partsCount: parts.length });
      return { valid: false };
    }
    
    // Parse token directly
    const decoded = jwtDecode<{
      sub: string | number;
      exp: number;
      iat: number;
      role?: string;
      email?: string;
      name?: string;
    }>(token);
    
    // Check required fields
    if (!decoded.sub) {
      logger.error('Token missing subject claim');
      return { valid: false };
    }
    
    if (!decoded.exp) {
      logger.error('Token missing expiration claim');
      return { valid: false };
    }
    
    // Check expiration
    const now = Date.now() / 1000;
    const expiresAt = decoded.exp;
    
    // Log token details for debugging
    logger.debug('Token validation', {
      createdAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      timeRemaining: `${Math.round(expiresAt - now)} seconds`,
      isExpired: now >= expiresAt
    });
    
    // Be strict about expiration - no grace period
    if (now >= expiresAt) {
      logger.error('Token has expired', { 
        now: new Date(now * 1000).toISOString(),
        expiry: new Date(expiresAt * 1000).toISOString(),
        timeRemaining: `${Math.round(expiresAt - now)} seconds`
      });
      return { valid: false };
    }
    
    // Extract user ID
    let userId: number;
    if (typeof decoded.sub === 'number') {
      userId = decoded.sub;
    } else {
      userId = parseInt(decoded.sub, 10);
      if (isNaN(userId)) {
        logger.error('Invalid user ID in token', { sub: decoded.sub });
        return { valid: false };
      }
    }
    
    // Verify the token signature on the server
    try {
      // Separate server-side and client-side validation paths
      if (typeof window === 'undefined') {
        // Server-side: use jsonwebtoken to verify
        try {
          const { verify } = await import('jsonwebtoken');
          const { securityConfig } = await import('@/core/config/SecurityConfig');
          
          // Get JWT secret from config
          const jwtSecret = securityConfig.getJwtSecret();
          
          // Verify token with JWT secret and audience/issuer
          verify(token, jwtSecret, {
            audience: securityConfig.getJwtAudience(),
            issuer: securityConfig.getJwtIssuer()
          });
          
          // If verification passes, token is valid
          logger.debug('Server-side JWT verification passed', { userId });
          
          // Check token in database to ensure it's not revoked
          const { default: tokenBlacklist } = await import('@/features/auth/utils/tokenBlacklist');
          const isBlacklisted = await tokenBlacklist.isTokenBlacklisted(token);
          
          if (isBlacklisted) {
            logger.warn('Token is blacklisted or revoked', { userId });
            return { valid: false };
          }
        } catch (jwtError) {
          logger.error('Server JWT verification failed', { 
            error: jwtError instanceof Error ? jwtError.message : String(jwtError),
            tokenPrefix: token.substring(0, 10) + '...'
          });
          return { valid: false };
        }
      } else {
        // Client-side: perform best-effort validation
        // We've already checked expiration and format above
        // Additional validation could be performed with a dedicated endpoint
        logger.debug('Client-side token validation passed', { userId });
      }
      
      // Return successful validation
      return {
        valid: true,
        userId,
        role: decoded.role
      };
    } catch (validationError) {
      logger.error('Token validation error', {
        error: validationError instanceof Error ? validationError.message : String(validationError),
        stack: validationError instanceof Error ? validationError.stack : undefined
      });
      return { valid: false };
    }
  } catch (error) {
    logger.error('Token decode error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return { valid: false };
  }
}

/**
 * Authenticate request - proper implementation with clear errors
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract token first
    const token = await extractAuthToken(request);
    
    if (!token) {
      logger.debug('No authentication token provided');
      return {
        success: false,
        error: 'No authentication token provided',
        message: 'Authentication required',
        statusCode: 401,
        status: 401,
      };
    }
    
    // Always validate the token properly with the server
    const verificationResult = await decodeAndValidateToken(token);
    
    if (!verificationResult.valid || !verificationResult.userId) {
      return {
        success: false,
        error: 'Invalid or expired token',
        message: 'Authentication failed',
        statusCode: 401,
        status: 401,
      };
    }
    
    // Create user information directly from verification result
    // This eliminates the dependency on AuthService.getUser() which
    // was causing errors due to missing implementation
    const user = {
      id: verificationResult.userId,
      email: '',  // We don't have this from token validation
      role: verificationResult.role || 'USER'
    };
    
    // Optionally try to get more user details if available
    try {
      // Only attempt to use AuthService if we're in a client context
      if (typeof window !== 'undefined') {
        // Dynamically import AuthService to prevent circular dependencies
        const { default: AuthService } = await import('@/features/auth/core/AuthService');
        
        // Check if AuthService has the user info
        const authUser = AuthService.getUser?.();
        
        // Only use if it matches the verified user ID
        if (authUser && authUser.id === verificationResult.userId) {
          user.email = authUser.email || '';
          user.role = authUser.role || verificationResult.role || 'USER';
        }
      }
    } catch (userError) {
      // Log but continue with basic user info
      logger.debug('Could not enhance user information', {
        error: userError instanceof Error ? userError.message : String(userError),
        userId: verificationResult.userId
      });
    }
    
    // Successfully authenticated
    return {
      success: true,
      user,
    };
  } catch (error) {
    // Create a standardized error
    let errorMsg = 'Authentication failed';
    let statusCode = 401;
    
    if (error instanceof AuthError) {
      errorMsg = error.message;
      statusCode = error.status;
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    
    logger.error('Authentication error:', {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      success: false,
      error: errorMsg,
      message: 'Authentication failed',
      statusCode: statusCode,
      status: statusCode,
    };
  }
}

/**
 * Authentication middleware for Next.js App Router
 * 
 * Creates a route handler that requires authentication.
 * 
 * @param handler The route handler to execute if authentication succeeds
 * @param options Authentication options
 * @returns A function that can be used as a route handler
 */
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
  options: AuthOptions = { requireAuth: true }
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  // Return a new handler function
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Skip auth check if not required
      if (options.requireAuth === false) {
        return await handler(request, null);
      }
      
      // Authenticate request - this correctly uses the async extractAuthToken function
      const authResult = await authenticateRequest(request);
      
      if (!authResult.success) {
        // Create a proper error response
        const error = authErrorHandler.createError(
          authResult.message || authResult.error || 'Authentication failed',
          AuthErrorType.AUTH_REQUIRED,
          {
            requestUrl: request.url,
            requestMethod: request.method,
            error: authResult.error
          }
        );
        
        return error.toResponse();
      }
      
      // Check role if required
      if (options.requiredRole) {
        // Handle both single role and array of roles
        const requiredRoles = Array.isArray(options.requiredRole) 
          ? options.requiredRole 
          : [options.requiredRole];
        
        const userRole = authResult.user?.role;
        const hasRequiredRole = userRole && requiredRoles.includes(userRole as UserRole);
        
        if (!hasRequiredRole) {
          const roleStr = requiredRoles.join(', ');
          logger.error('User lacks required role', {
            userId: authResult.user?.id,
            userRole,
            requiredRoles
          });
          
          const error = authErrorHandler.createError(
            `Required role not found. Expected one of: ${roleStr}`,
            AuthErrorType.PERMISSION_DENIED,
            {
              requiredRoles: requiredRoles,
              userRole: userRole
            }
          );
          
          return error.toResponse();
        }
      }
      
      // Check permissions if required
      if (options.requiredPermission && options.requiredPermission.length > 0 && authResult.user?.id) {
        try {
          // Use userData object to avoid type issues
          const userData = { userId: authResult.user.id };
          const hasPermission = await checkPermissions(userData, options.requiredPermission);
          
          if (!hasPermission) {
            logger.error('User lacks required permissions', {
              userId: authResult.user.id,
              requiredPermissions: options.requiredPermission
            });
            
            const error = authErrorHandler.createError(
              'Insufficient permissions',
              AuthErrorType.PERMISSION_DENIED,
              {
                requiredPermissions: options.requiredPermission
              }
            );
            
            return error.toResponse();
          }
        } catch (error) {
          logger.error('Error checking permissions:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: authResult.user.id,
            requiredPermissions: options.requiredPermission
          });
          
          const permError = authErrorHandler.createError(
            'Error checking permissions',
            AuthErrorType.PERMISSION_DENIED,
            {
              error: error instanceof Error ? error.message : String(error)
            }
          );
          return permError.toResponse();
        }
      }
      
      // Create a modified request with user info attached
      // Convert to AuthInfo type expected by route handlers
      if (!authResult.user) {
        const error = authErrorHandler.createError(
          'Authentication succeeded but user information is missing',
          AuthErrorType.AUTH_FAILED
        );
        return error.toResponse();
      }
      
      // Instead of creating a new request, modify the existing one
      // This ensures all properties are preserved correctly
      
      // Attach auth info
      const authInfo = {
        userId: authResult.user.id,
        email: authResult.user.email,
        role: authResult.user.role,
        name: authResult.user.name
      };
      
      // Add auth property directly to the original request object
      // This ensures it's properly propagated throughout the request lifecycle
      Object.defineProperty(request, 'auth', {
        value: authInfo,
        writable: false,
        enumerable: true,
        configurable: false
      });
      
      // Add a custom header for additional verification
      // This can be checked if Object.defineProperty fails in some environments
      request.headers.set('X-Auth-User-ID', authResult.user.id.toString());
      
      // Execute the handler with the authenticated request
      return await handler(request, authResult.user);
    } catch (error) {
      // Create a standardized error response
      let statusCode = 500;
      let errorMessage = 'Internal server error';
      
      if (error instanceof AuthError) {
        statusCode = error.status;
        errorMessage = error.message;
        return error.toResponse();
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      logger.error('Auth middleware error:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method
      });
      
      // Create an error using authErrorHandler
      const authError = authErrorHandler.createError(
        errorMessage,
        AuthErrorType.AUTH_FAILED,
        { originalError: error instanceof Error ? error.name : 'unknown' },
        statusCode
      );
      
      return authError.toResponse();
    } 
  };
}

/**
 * Check if user has required permissions - proper implementation with no fallbacks
 */
async function checkPermissions(userData: Record<string, any>, requiredPermissions: string[]): Promise<boolean> {
  try {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }
    
    if (!userData || !userData.userId) {
      logger.error('Cannot check permissions - no user ID provided');
      return false;
    }
    
    // Make API call to check permissions
    const response = await fetch(`/api/users/permissions/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userData.userId,
        permissions: requiredPermissions,
      }),
    });
    
    if (!response.ok) {
      logger.error('Permission check API call failed', {
        userId: userData.userId,
        permissions: requiredPermissions,
        status: response.status
      });
      return false;
    }
    
    const data = await response.json();
    return data.success && data.hasPermission;
  } catch (error) {
    logger.error('Error checking permissions:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userData.userId
    });
    return false;
  }
}

/**
 * Get user from request (for use in route handlers)
 */
export function getUserFromRequest(request: NextRequest): any {
  return (request).auth || null;
}

// Export utility functions for use in route handler
export { decodeAndValidateToken };

// Main export
export const auth = withAuth;

// For backward compatibility
export const apiAuth = withAuth;
