/**
 * Clean Authentication Middleware
 * 
 * Centralized authentication middleware that uses AuthService as the single source
 * of truth for authentication. Provides consistent validation logic across the application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { AuthService } from '@/features/auth/core/AuthService';
import { getPermissionService, getServiceFactory } from '@/core/factories';

const logger = getLogger();

// Type definitions for auth middleware
export interface AuthOptions {
  requireAuth?: boolean;
  requiredRole?: string;
  requiredPermission?: string[];
}

export interface AuthResult {
  success: boolean;
  req?: NextRequest;
  ctx?: any;
  user?: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  };
  error?: string;
  statusCode?: number;
}

/**
 * Extract token from request
 * 
 * This function extracts the auth token from different sources in the request
 * with a consistent priority order:
 * 1. HTTP-only cookies (primary and secure method)
 * 2. Authorization header (Bearer token)
 * 3. Custom auth headers
 */
export function extractAuthToken(request: NextRequest): string | null {
  // Check cookies first (primary method)
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check additional possible headers for edge cases
  const altHeaders = [
    'x-auth-token',
    'x-access-token',
    'api-token'
  ];
  
  for (const header of altHeaders) {
    const headerToken = request.headers.get(header);
    if (headerToken) {
      return headerToken;
    }
  }
  
  return null;
}

/**
 * Authenticate request using AuthService
 * 
 * This function provides a robust authentication check using the centralized AuthService.
 * It handles initialization, token validation, and user extraction with proper error handling.
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Check if AuthService is initialized
    if (!AuthService.isInitialized()) {
      logger.debug('AuthService not initialized, initializing now');
      await AuthService.initialize();
    }
    
    // Extract token information for diagnostics (only log minimal info)
    const token = extractAuthToken(request);
    const hasToken = !!token;
    
    // Log request authentication attempt with minimal info (no tokens)
    logger.debug('Processing authentication request', { 
      hasToken,
      path: request.nextUrl?.pathname,
      method: request.method 
    });
    
    // Use AuthService to validate token
    const isValid = await AuthService.validateToken();
    
    if (!isValid) {
      // If token validation failed, try to refresh token once
      try {
        logger.debug('Token validation failed, attempting token refresh');
        const refreshResult = await AuthService.refreshToken();
        
        if (!refreshResult.success) {
          return {
            success: false,
            error: 'Invalid authentication token and refresh failed',
            statusCode: 401,
          };
        }
        
        // Check if token is now valid after refresh
        const isValidAfterRefresh = await AuthService.validateToken();
        if (!isValidAfterRefresh) {
          return {
            success: false,
            error: 'Authentication failed after token refresh',
            statusCode: 401,
          };
        }
      } catch (refreshError) {
        // Token refresh failed
        logger.debug('Token refresh failed', { 
          error: refreshError instanceof Error ? refreshError.message : String(refreshError)
        });
        
        return {
          success: false,
          error: 'Invalid authentication token',
          statusCode: 401,
        };
      }
    }
    
    // Get user from AuthService
    const user = AuthService.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not found in token',
        statusCode: 401,
      };
    }
    
    // Create a new request object with user info attached
    const newReq = request.clone();
    (newReq as any).user = user;
    
    // Log successful authentication
    logger.debug('Authentication successful', { userId: user.id });
    
    return {
      success: true,
      req: newReq,
      user,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Authentication error:', { error: errorMessage });
    
    // Provide specific error message based on the type of error
    let statusCode = 401;
    let message = 'Authentication failed';
    
    if (errorMessage.includes('token') && errorMessage.includes('expired')) {
      message = 'Authentication token has expired';
    } else if (errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
      message = 'Invalid authentication token format';
    } else if (errorMessage.includes('revoked')) {
      message = 'Authentication token has been revoked';
    }
    
    return {
      success: false,
      error: message,
      statusCode,
    };
  }
}

/**
 * Authentication middleware factory for Next.js App Router
 * 
 * This middleware provides a robust authentication check for API routes
 * with support for role and permission checks.
 * 
 * @param options Auth options including authentication requirements and permissions
 */
export function auth(options: AuthOptions = { requireAuth: true }) {
  return async (
    request: NextRequest, 
    context?: any
  ): Promise<NextResponse | AuthResult> => {
    const logger = getLogger();
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    const path = request.nextUrl?.pathname || 'unknown';
    
    // Log middleware execution with minimal request info
    logger.debug('Auth middleware executing', { 
      path,
      method: request.method, 
      requireAuth: options.requireAuth,
      requiredRole: options.requiredRole,
      hasPermissionRequirements: options.requiredPermission?.length > 0,
      requestId
    });
    
    // Skip auth check if not required
    if (options.requireAuth === false) {
      return {
        success: true,
        req: request,
        ctx: context
      };
    }
    
    // Authenticate request
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success) {
      // Add request ID and path to error response for tracking
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          message: authResult.error,
          requestId // Include for diagnostic tracking
        },
        {
          status: authResult.statusCode || 401,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }
    
    // Check role if required
    if (options.requiredRole && authResult.user?.role !== options.requiredRole) {
      logger.warn('Permission denied: role check failed', { 
        path,
        userId: authResult.user?.id,
        userRole: authResult.user?.role,
        requiredRole: options.requiredRole,
        requestId
      });
      
      return NextResponse.json(
        {
          success: false,
          error: `Required role "${options.requiredRole}" not found`,
          message: `You don't have the required role to access this resource`,
          requestId
        },
        {
          status: 403,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }
    
    // Check permissions if required
    if (options.requiredPermission && options.requiredPermission.length > 0) {
      try {
        const hasPermission = await checkPermissions(authResult.user!.id, options.requiredPermission);
        
        if (!hasPermission) {
          logger.warn('Permission denied: permission check failed', { 
            path,
            userId: authResult.user?.id,
            requiredPermissions: options.requiredPermission,
            requestId
          });
          
          return NextResponse.json(
            {
              success: false,
              error: 'Insufficient permissions',
              message: 'You don\'t have the required permissions to access this resource',
              requestId
            },
            {
              status: 403,
              headers: {
                'X-Request-ID': requestId,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache'
              }
            }
          );
        }
      } catch (error) {
        // If permission check fails with an error, log and deny access
        logger.error('Error during permission check', { 
          error: error instanceof Error ? error.message : String(error),
          path,
          userId: authResult.user?.id,
          requestId
        });
        
        return NextResponse.json(
          {
            success: false,
            error: 'Error validating permissions',
            message: 'There was an error validating your permissions',
            requestId
          },
          {
            status: 500,
            headers: {
              'X-Request-ID': requestId,
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache'
            }
          }
        );
      }
    }
    
    // Log successful authentication
    logger.debug('Authentication successful', {
      path,
      userId: authResult.user?.id,
      requestId
    });
    
    // Update context with user info
    const newContext = {
      ...context,
      user: authResult.user,
      requestId
    };
    
    // Return updated request and context
    return {
      success: true,
      req: authResult.req,
      ctx: newContext,
      user: authResult.user
    };
  };
}

/**
 * Check if user has required permissions
 * 
 * This function checks if a user has the specified permissions by making a request
 * to the permissions API. It includes proper error handling and logging.
 * 
 * @param userId The ID of the user to check permissions for
 * @param requiredPermissions Array of permission codes to check
 * @returns Promise resolving to true if the user has all required permissions, false otherwise
 */
async function checkPermissions(userId: number, requiredPermissions: string[]): Promise<boolean> {
  if (!userId || !requiredPermissions || requiredPermissions.length === 0) {
    logger.warn('Invalid parameters for permission check', { userId, permissionsCount: requiredPermissions?.length });
    return false;
  }
  
  try {
    // First try with AuthService - this will only work if the permission system is available client-side
    // and might be faster than making another API call
    try {
      const permissionService = getPermissionService();
      if (permissionService) {
        const result = await permissionService.checkUserPermissions(userId, requiredPermissions);
        if (typeof result === 'boolean') {
          return result;
        }
      }
    } catch (localCheckError) {
      // Silently fall back to API check if local check fails
      logger.debug('Local permission check failed, falling back to API', {
        userId,
        error: localCheckError instanceof Error ? localCheckError.message : String(localCheckError)
      });
    }
    
    // Fall back to API check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    // Get user permissions via API
    const response = await fetch(`/api/users/permissions/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        userId,
        permissions: requiredPermissions,
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      logger.warn('Permission check API returned error', { 
        userId, 
        status: response.status,
        statusText,
        permissions: requiredPermissions 
      });
      return false;
    }
    
    const data = await response.json();
    
    // Log result for debugging
    if (!data.success || !data.hasPermission) {
      logger.debug('Permission check failed', { 
        userId, 
        permissions: requiredPermissions,
        result: data
      });
    }
    
    return data.success && data.hasPermission === true;
  } catch (error) {
    // Improved error logging with specific error details
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    
    logger.error('Error checking permissions:', { 
      userId, 
      permissions: requiredPermissions,
      error: errorMessage,
      isTimeout
    });
    
    if (isTimeout) {
      logger.warn('Permission check timed out after 5 seconds');
    }
    
    return false;
  }
}

/**
 * Get user from request (for use in route handlers)
 */
export function getUserFromRequest(request: Request | NextRequest): any {
  return (request as any).user || null;
}

// Legacy compatibility
export const withAuth = auth;
export const apiAuth = auth;
