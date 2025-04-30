/**
 * Standardized Route Handler
 * Provides a consistent way to handle API routes with proper error handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { AppError, ValidationError, PermissionError } from '@/core/errors/types/AppError';
import { getLogger } from '@/core/logging';
// Import error types
import { ErrorResponse, SuccessResponse } from '@/core/errors/types/ApiTypes';
import { errorHandler } from '@/core/errors/error-handler';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';

const logger = getLogger();

/**
 * Context for route handlers
 */
export interface RouteContext {
  /** Request tracking ID */
  requestId: string;
  
  /** Start time for performance tracking */
  startTime: number;
  
  /** Request path */
  path: string;
  
  /** HTTP method */
  method: string;
  
  /** Authentication information */
  auth?: {
    /** User ID if authenticated */
    userId?: number;
    
    /** User email if available */
    userEmail?: string;
    
    /** User role if available */
    userRole?: string;
  };
  
  /** Custom context data */
  [key: string]: any;
}

/**
 * Auth information added to request by middleware
 */
export interface AuthInfo {
  /**
   * User ID
   */
  userId: number;
  
  /**
   * User role
   */
  role?: string;
  
  /**
   * User name
   */
  name?: string;
  
  /**
   * User email
   */
  email?: string;
  
  /**
   * Token expiration timestamp
   */
  exp?: number;
}

// Extend the NextRequest type to include auth information
declare module 'next/server' {
  interface NextRequest {
    auth?: AuthInfo;
  }
}

/**
 * Route handler options
 */
export interface RouteHandlerOptions {
  /**
   * Whether the route requires authentication
   */
  requiresAuth?: boolean;
  
  /**
   * Required roles for accessing this route
   */
  requiredRoles?: string[];
  
  /**
   * Legacy alias for requiredRoles (for backward compatibility)
   */
  requiresRole?: string[];
  
  /**
   * Whether to skip the default error handler
   */
  skipErrorHandler?: boolean;
  
  /** Required permission */
  requiredPermission?: string | string[];
  
  /**
   * Whether to include detailed error information
   */
  detailedErrors?: boolean;
}

/**
 * Route handler type
 * Ensures consistent response types
 */
export type RouteHandler<T = any> = (request: NextRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * Create a route handler with enhanced error handling
 * This function creates a handler that properly propagates authentication and permission errors
 * 
 * @param handler Handler function
 * @param options Route handler options
 * @returns Wrapped handler with error handling
 */
export function routeHandler<T>(
  handler: RouteHandler<T>,
  options: RouteHandlerOptions = {}
): RouteHandler<T> {
  // Create a wrapper that checks auth and permissions first
  const wrappedHandler = async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Check if authentication is required
      if (options.requiresAuth && !request.auth?.userId) {
        return formatResponse.unauthorized('Authentication required', {
          details: {
            requiredAuth: true,
            requestPath: request.nextUrl.pathname
          }
        }.toString());
      }
      
      // Check role requirements if specified
      if ((options.requiredRoles && options.requiredRoles.length > 0) || 
          (options.requiresRole && options.requiresRole.length > 0)) {
        
        // For backward compatibility, support both property names
        const requiredRoles = options.requiredRoles || options.requiresRole || [];
        
        // Skip if no roles required
        if (requiredRoles.length > 0) {
          // If no auth info or no role, access is denied
          if (!request.auth?.role) {
            return formatResponse.unauthorized('Authentication required with role information', {
              details: {
                requiredRoles,
                requestPath: request.nextUrl.pathname
              }
            }.toString());
          }
          
          // Check if user has any of the required roles
          const hasRequiredRole = requiredRoles.includes(request.auth.role);
          
          if (!hasRequiredRole) {
            return formatResponse.forbidden(`Insufficient role permissions. Required: ${requiredRoles.join(' or ')}`, {
              details: {
                userRole: request.auth.role,
                requiredRoles,
                requestPath: request.nextUrl.pathname
              }
            }.toString());
          }
        }
      }
      
      // Check permission requirement if specified
      if (options.requiredPermission) {
        if (!request.auth?.userId) {
          return formatResponse.unauthorized('Authentication required for permission check', {
            details: {
              requiredPermission: options.requiredPermission,
              requestPath: request.nextUrl.pathname
            }
          }.toString());
        }
        
        // Check permission using permissionMiddleware
        const permCheckResult = await permissionMiddleware.checkPermission(
          request, 
          options.requiredPermission
        );
        
        if (!permCheckResult.success) {
          // Return formatted permission error with details
          return formatResponse.forbidden(
            permCheckResult.message || 'Permission denied',
            {
              details: {
                requiredPermission: options.requiredPermission,
                permCheckResult: options.detailedErrors ? permCheckResult : undefined
              }
            }.toString()
          );
        }
      }
      
      // If we pass all checks, execute the handler
      return await handler(request, ...args);
    } catch (error) {
      // Log the error with full details
      logger.error('Error in route handler:', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        options
      });
      
      // Handle different error types
      if (error instanceof PermissionError) {
        return formatResponse.forbidden(error.message, {
          details: options.detailedErrors ? {
            errorType: error.errorCode || 'PERMISSION_ERROR',
            requiredPermission: options.requiredPermission
          } : undefined
        }.toString());
      }
      
      if (error instanceof ValidationError) {
        return formatResponse.badRequest(error.message, {
          details: options.detailedErrors ? {
            validationErrors: error 
          } : undefined
        }.toString());
      }
      
      if (error instanceof AppError) {
        return formatResponse.error(error.message, error.statusCode, {
          details: options.detailedErrors ? {
            errorCode: error.errorCode,
            errorDetails: error.details
          } : undefined
        }.toString());
      }
      
      // Handle generic errors
      return formatResponse.error(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500,
        {
          details: options.detailedErrors ? {
            errorStack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
          } : undefined
        }.toString()
      );
    }
  };
  
  // Skip standard error handler if specified
  if (options.skipErrorHandler) {
    return wrappedHandler;
  }
  
  // Wrap with error handler for additional safety
  return errorHandler(wrappedHandler);
}

/**
 * Validate user permissions for a route
 * This function checks authentication and role requirements
 * 
 * @param request Next request object
 * @param options Route handler options
 * @returns Whether the user is authorized
 * @throws AuthError if validation fails
 */
export function validateAuth(
  request: NextRequest,
  options: RouteHandlerOptions
): boolean {
  // Check if authentication is required
  if (options.requiresAuth && !request.auth?.userId) {
    throw authErrorHandler.createError(
      'Authentication required',
      AuthErrorType.AUTH_REQUIRED,
      {
        requestPath: request.nextUrl.pathname,
        requiresAuth: options.requiresAuth
      }
    );
  }
  
  // Check if specific roles are required
  if ((options.requiredRoles && options.requiredRoles.length > 0) || 
      (options.requiresRole && options.requiresRole.length > 0)) {
    // For backward compatibility, support both property names
    const requiredRoles = options.requiredRoles || options.requiresRole || [];
    
    // If no auth info or no role, access is denied
    if (!request.auth?.role) {
      throw authErrorHandler.createError(
        'Authentication required with role information',
        AuthErrorType.AUTH_REQUIRED,
        {
          requestPath: request.nextUrl.pathname,
          requiredRoles
        }
      );
    }
    
    // If there are no required roles defined, access is granted
    if (requiredRoles.length === 0) {
      return true;
    }
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.includes(request.auth.role);
    
    if (!hasRequiredRole) {
      throw authErrorHandler.createPermissionError(
        `Insufficient role permissions. Required: ${requiredRoles.join(' or ')}`,
        {
          userRole: request.auth.role,
          requiredRoles,
          requestPath: request.nextUrl.pathname
        }
      );
    }
  }
  
  // No special requirements, authentication is valid
  return true;
}

// Export convenience functions
export const createGetHandler = routeHandler;
export const createPostHandler = routeHandler;
export const createPutHandler = routeHandler;
export const createDeleteHandler = routeHandler;
