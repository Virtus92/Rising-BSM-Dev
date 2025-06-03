/**
 * Standardized Route Handler
 * Provides a consistent way to handle API routes with proper error handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { AppError, ValidationError, PermissionError } from '@/core/errors/types/AppError';
import { getLogger } from '@/core/logging';
import { ErrorResponse, SuccessResponse } from '@/core/errors/types/ApiTypes';
import { errorHandler } from '@/core/errors/error-handler';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';
import { AuthInfo as AuthInfoType } from '@/types/types/auth';

// Re-export AuthInfo for use in route handlers
export type AuthInfo = AuthInfoType;

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
  
  /** Custom context data */
  [key: string]: any;
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
        return formatResponse.unauthorized('Authentication required', JSON.stringify({
          details: {
            requiredAuth: true,
            requestPath: request.nextUrl.pathname
          }
        }));
      }
      
      // Check role requirements if specified
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        // Skip if no roles required
        if (!request.auth?.role) {
          return formatResponse.unauthorized('Authentication required with role information', JSON.stringify({
            details: {
              requiredRoles: options.requiredRoles,
              requestPath: request.nextUrl.pathname
            }
          }));
        }
        
        // Check if user has any of the required roles
        const hasRequiredRole = options.requiredRoles.includes(request.auth.role);
        
        if (!hasRequiredRole) {
          return formatResponse.forbidden(`Insufficient role permissions. Required: ${options.requiredRoles.join(' or ')}`, JSON.stringify({
            details: {
              userRole: request.auth.role,
              requiredRoles: options.requiredRoles,
              requestPath: request.nextUrl.pathname
            }
          }));
        }
      }
      
      // Check permission requirement if specified
      if (options.requiredPermission) {
        if (!request.auth?.userId) {
          return formatResponse.unauthorized('Authentication required for permission check', JSON.stringify({
            details: {
              requiredPermission: options.requiredPermission,
              requestPath: request.nextUrl.pathname
            }
          }));
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
            JSON.stringify({
              details: {
                requiredPermission: options.requiredPermission,
                permCheckResult: options.detailedErrors ? permCheckResult : undefined
              }
            })
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
        return formatResponse.forbidden(error.message, JSON.stringify({
          details: options.detailedErrors ? {
            errorType: error.errorCode || 'PERMISSION_ERROR',
            requiredPermission: options.requiredPermission
          } : undefined
        }));
      }
      
      if (error instanceof ValidationError) {
        return formatResponse.badRequest(error.message, JSON.stringify({
          details: options.detailedErrors ? {
            validationErrors: error.details 
          } : undefined
        }));
      }
      
      if (error instanceof AppError) {
        return formatResponse.error(error.message, error.statusCode, JSON.stringify({
          details: options.detailedErrors ? {
            errorCode: error.errorCode,
            errorDetails: error.details
          } : undefined
        }));
      }
      
      // Handle generic errors
      return formatResponse.error(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500,
        JSON.stringify({
          details: options.detailedErrors ? {
            errorStack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
          } : undefined
        })
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
  if (options.requiredRoles && options.requiredRoles.length > 0) {
    // If no auth info or no role, access is denied
    if (!request.auth?.role) {
      throw authErrorHandler.createError(
        'Authentication required with role information',
        AuthErrorType.AUTH_REQUIRED,
        {
          requestPath: request.nextUrl.pathname,
          requiredRoles: options.requiredRoles
        }
      );
    }
    
    // If there are no required roles defined, access is granted
    if (options.requiredRoles.length === 0) {
      return true;
    }
    
    // Check if user has any of the required roles
    const hasRequiredRole = options.requiredRoles.includes(request.auth.role);
    
    if (!hasRequiredRole) {
      throw authErrorHandler.createPermissionError(
        `Insufficient role permissions. Required: ${options.requiredRoles.join(' or ')}`,
        {
          userRole: request.auth.role,
          requiredRoles: options.requiredRoles,
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
