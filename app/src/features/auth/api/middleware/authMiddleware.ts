/**
 * Centralized Authentication Middleware
 * 
 * Single source of truth for route authentication in Next.js App Router.
 * Properly handles authentication with strict error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
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
 * Extract token from request with consistent logic and better debugging
 */
export async function extractAuthToken(request: NextRequest): Promise<string | null> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID().substring(0, 8);
  
  // Check Authorization header first (highest priority)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token && token.trim() !== '') {
      logger.debug('Found token in Authorization header', {
        requestId,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...'
      });
      return token;
    }
    logger.debug('Empty token in Authorization header', { requestId });
  }
  
  // Check cookies - prioritize js_token which is specifically for JavaScript access
  const cookieNames = ['js_token', 'auth_token', 'access_token'];
  
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
  
  // Check for token in request body for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      // Clone request to avoid consuming body
      const clonedRequest = request.clone();
      const contentType = request.headers.get('content-type');
      
      // Only try to parse JSON content
      if (contentType?.includes('application/json')) {
        const body = await clonedRequest.json().catch(() => null);
        
        if (body?.token && typeof body.token === 'string') {
          logger.debug('Found token in request body', {
            requestId,
            tokenLength: body.token.length,
            tokenPrefix: body.token.substring(0, 10) + '...'
          });
          return body.token;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  // Log that no token was found
  logger.debug('No authentication token found in request', {
    requestId,
    url: request.url,
    method: request.method,
    hasAuthHeader: !!authHeader,
    cookiesFound: [...request.cookies.getAll()].map(c => c.name),
    headers: Object.fromEntries([...request.headers.entries()].filter(
      ([key]) => !['cookie', 'authorization'].includes(key.toLowerCase())
    ))
  });
  
  return null;
}

/**
 * Decode and validate JWT token with strict validation
 */
async function decodeAndValidateToken(token: string): Promise<{ valid: boolean; userId?: number; role?: string; error?: Error; serverValidated?: boolean; expiresAt?: number }> {
  try {
    // Basic validation
    if (!token || token.trim() === '') {
      return { valid: false, error: new Error('Empty token provided') };
    }
    
    // Check token format
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: new Error('Invalid token format') };
    }
    
    // Decode token
    const decoded = jwtDecode<{
      sub: string | number;
      exp: number;
      iat: number;
      role?: string;
      email?: string;
      name?: string;
    }>(token);
    
    // Validate required claims
    if (!decoded.sub) {
      return { valid: false, error: new Error('Token missing subject claim') };
    }
    
    if (!decoded.exp) {
      return { valid: false, error: new Error('Token missing expiration claim') };
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = decoded.exp;
    
    // Log token details for debugging
    logger.debug('Token validation', {
      createdAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      timeRemaining: `${Math.round(expiresAt - now)} seconds`,
      isExpired: now >= expiresAt
    });
    
    // Strict expiration check
    if (now >= expiresAt) {
      return { 
        valid: false, 
        error: new Error(`Token expired at ${new Date(expiresAt * 1000).toISOString()}`)
      };
    }
    
    // Extract user ID with validation
    let userId: number;
    if (typeof decoded.sub === 'number') {
      userId = decoded.sub;
    } else {
      userId = parseInt(decoded.sub, 10);
      if (isNaN(userId) || userId <= 0) {
        return { 
          valid: false, 
          error: new Error(`Invalid user ID in token: ${decoded.sub}`)
        };
      }
    }
    
    // Server-side validation with signature check
    if (typeof window === 'undefined') {
      try {
        // Load verification tools - use standard jsonwebtoken
        const { verify } = await import('jsonwebtoken');
        const { securityConfig } = await import('@/core/config/SecurityConfig');
        
        // Get config
        const jwtSecret = securityConfig.getJwtSecret();
        const audience = securityConfig.getJwtAudience();
        const issuer = securityConfig.getJwtIssuer();
        
        // Verify token with all options
        verify(token, jwtSecret, {
          audience,
          issuer,
          complete: true
        });
        
        // Check blacklist
        const { default: tokenBlacklist } = await import('@/features/auth/utils/tokenBlacklist');
        const isBlacklisted = await tokenBlacklist.isTokenBlacklisted(token);
        
        if (isBlacklisted) {
          return { 
            valid: false, 
            error: new Error('Token is revoked or blacklisted'),
            serverValidated: true
          };
        }
        
        // Mark as server-validated
        logger.debug('Server-side JWT verification passed', { userId });
        return {
          valid: true,
          userId,
          role: decoded.role,
          serverValidated: true,
          expiresAt: decoded.exp * 1000  // Convert to milliseconds
        };
      } catch (jwtError) {
        return { 
          valid: false, 
          error: jwtError as Error,
          serverValidated: true
        };
      }
    } else {
      // Client-side validation (limited to expiration check)
      return {
        valid: true,
        userId,
        role: decoded.role,
        serverValidated: false,
        expiresAt: decoded.exp * 1000  // Convert to milliseconds
      };
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error as Error
    };
  }
}

/**
 * Authenticate request with proper error handling and diagnostics
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID().substring(0, 8);
  
  try {
    // Extract token
    const token = await extractAuthToken(request);
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided',
        message: 'Authentication required',
        statusCode: 401,
        status: 401,
      };
    }
    
    // Validate token
    const verificationResult = await decodeAndValidateToken(token);
    
    if (!verificationResult.valid || !verificationResult.userId) {
      logger.debug('Token validation failed', {
        requestId,
        error: verificationResult.error?.message || 'Unknown validation error',
        serverValidated: verificationResult.serverValidated
      });
      
      return {
        success: false,
        error: verificationResult.error?.message || 'Invalid or expired token',
        message: 'Authentication failed',
        statusCode: 401,
        status: 401,
      };
    }
    
    // Create user information directly from token validation
    const user = {
      id: verificationResult.userId,
      email: '',  // Will be populated later if available
      role: verificationResult.role || 'USER'
    };
    
    // Successfully authenticated
    logger.debug('Authentication successful', {
      requestId,
      userId: user.id,
      role: user.role,
      serverValidated: verificationResult.serverValidated
    });
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    // Standardize error format
    let errorMsg = 'Authentication failed';
    let statusCode = 401;
    
    if (error instanceof AuthError) {
      errorMsg = error.message;
      statusCode = error.status;
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    
    logger.error('Authentication error:', {
      requestId,
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      method: request.method
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
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID().substring(0, 8);
    
    try {
      // Skip auth check if not required
      if (options.requireAuth === false) {
        return await handler(request, null);
      }
      
      // Authenticate request
      const authResult = await authenticateRequest(request);
      
      if (!authResult.success) {
        // Create proper error response
        const error = authErrorHandler.createError(
          authResult.message || authResult.error || 'Authentication failed',
          AuthErrorType.AUTH_REQUIRED,
          {
            requestId,
            requestUrl: request.url,
            requestMethod: request.method
          }
        );
        
        return error.toResponse();
      }
      
      // Check role if required
      if (options.requiredRole && authResult.user) {
        // Handle both single role and array of roles
        const requiredRoles = Array.isArray(options.requiredRole) 
          ? options.requiredRole 
          : [options.requiredRole];
        
        const userRole = authResult.user.role;
        const hasRequiredRole = userRole && requiredRoles.includes(userRole as UserRole);
        
        if (!hasRequiredRole) {
          const roleStr = requiredRoles.join(', ');
          logger.error('User lacks required role', {
            requestId,
            userId: authResult.user.id,
            userRole,
            requiredRoles
          });
          
          const error = authErrorHandler.createError(
            `Required role not found. Expected one of: ${roleStr}`,
            AuthErrorType.PERMISSION_DENIED,
            {
              requiredRoles,
              userRole
            }
          );
          
          return error.toResponse();
        }
      }
      
      // Check permissions if required
      if (options.requiredPermission && options.requiredPermission.length > 0 && authResult.user?.id) {
        try {
          const userData = { userId: authResult.user.id };
          const hasPermission = await checkPermissions(userData, options.requiredPermission, requestId);
          
          if (!hasPermission) {
            logger.error('User lacks required permissions', {
              requestId,
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
            requestId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId: authResult.user.id,
            requiredPermissions: options.requiredPermission
          });
          
          const permError = authErrorHandler.createError(
            'Error checking permissions',
            AuthErrorType.PERMISSION_DENIED,
            { error: error instanceof Error ? error.message : String(error) }
          );
          
          return permError.toResponse();
        }
      }
      
      // Verify user exists in auth result
      if (!authResult.user) {
        const error = authErrorHandler.createError(
          'Authentication succeeded but user information is missing',
          AuthErrorType.AUTH_FAILED
        );
        return error.toResponse();
      }
      
      // Create auth info object with a consistent structure
      const authInfo = {
        userId: authResult.user.id,
        email: authResult.user.email || '',
        role: authResult.user.role || 'USER', // Always provide a default role
        name: authResult.user.name || '',
        user: { // Add a nested user object with consistent properties
          id: authResult.user.id,
          email: authResult.user.email || '',
          role: authResult.user.role || 'USER',
          name: authResult.user.name || ''
        }
      };
      
      // Attach user authentication info to request
      // First, check if auth property already exists to avoid errors
      if (!request.auth) {
        Object.defineProperty(request, 'auth', {
          value: authInfo,
          writable: true, // Make writable to avoid issues
          enumerable: true,
          configurable: true
        });
      } else {
        // Update existing auth object safely
        request.auth = { ...request.auth, ...authInfo };
      }
      
      // Log auth attachment for debugging
      logger.debug('Attached auth data to request', {
        requestId,
        userId: authInfo.userId,
        role: authInfo.role,
        hasAuth: !!request.auth
      });
      
      // Also set headers for backup authentication propagation
      request.headers.set('X-Auth-User-ID', authResult.user.id.toString());
      request.headers.set('X-Auth-User-Role', authResult.user.role || 'USER');
      
      // Execute handler with authenticated request
      return await handler(request, authResult.user);
    } catch (error) {
      // Handle errors
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
        requestId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
        method: request.method
      });
      
      // Create standardized error response
      const authError = authErrorHandler.createError(
        errorMessage,
        AuthErrorType.AUTH_FAILED,
        { 
          requestId,
          originalError: error instanceof Error ? error.name : 'unknown'
        },
        statusCode
      );
      
      return authError.toResponse();
    } 
  };
}

/**
 * Check if user has required permissions with proper error handling
 */
async function checkPermissions(
  userData: Record<string, any>, 
  requiredPermissions: string[],
  requestId?: string
): Promise<boolean> {
  try {
    // Validate inputs
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }
    
    if (!userData || !userData.userId) {
      logger.error('Cannot check permissions - no user ID provided', { requestId });
      return false;
    }
    
    // Determine base URL for API calls
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    // Set up auth headers for permission check
    const headers = {
      'Content-Type': 'application/json',
      'X-Auth-User-ID': userData.userId.toString(),
      'X-Request-ID': requestId || crypto.randomUUID().substring(0, 8)
    };
    
    // Use batch endpoint for efficiency
    const batchUrl = `${baseUrl}/api/users/permissions/check`;
    
    try {
      const batchResponse = await fetch(batchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: userData.userId,
          permissions: requiredPermissions,
        }),
      });
      
      if (batchResponse.ok) {
        const data = await batchResponse.json();
        
        if (data.success && data.data && data.data.hasPermission) {
          logger.debug('Permission check successful - user has required permissions', {
            requestId,
            userId: userData.userId,
            permissionResults: data.data.permissionResults
          });
          return true;
        }
        
        // If batch check returns success: false, user doesn't have permissions
        logger.debug('User lacks required permissions (batch check)', {
          requestId,
          userId: userData.userId,
          requiredPermissions
        });
        return false;
      }
      
      // If batch endpoint fails, check permissions individually
      logger.warn('Batch permission check failed, checking individually', {
        requestId,
        userId: userData.userId,
        status: batchResponse.status
      });
    } catch (error) {
      logger.warn('Error in batch permission check, falling back to individual checks', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        userId: userData.userId
      });
    }
    
    // Individual permission checks
    for (const permission of requiredPermissions) {
      try {
        const params = new URLSearchParams();
        params.append('userId', userData.userId.toString());
        params.append('permission', permission);
        
        const url = `${baseUrl}/api/users/permissions/check?${params.toString()}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data === true) {
            logger.debug(`User has permission: ${permission}`, {
              requestId,
              userId: userData.userId
            });
            return true;
          }
        }
      } catch (error) {
        logger.warn(`Error checking permission ${permission}:`, {
          requestId,
          error: error instanceof Error ? error.message : String(error),
          userId: userData.userId
        });
      }
    }
    
    // If we get here, the user doesn't have any of the required permissions
    logger.debug('User lacks all required permissions', {
      requestId,
      userId: userData.userId,
      requiredPermissions
    });
    return false;
  } catch (error) {
    logger.error('Error in permission checking process:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userData?.userId,
      requiredPermissions
    });
    
    // Throw rather than silently failing
    throw error;
  }
}

/**
 * Get user from request (for use in route handlers)
 */
export function getUserFromRequest(request: NextRequest): any {
  return (request).auth || null;
}

// Export utility functions
export { decodeAndValidateToken };

// Main export
export const auth = withAuth;

// For backward compatibility
export const apiAuth = withAuth;