/**
 * Route Handler - Standardized Route Handler for Next.js App Router
 * 
 * Provides consistent error handling, authentication, and logging
 * for all API routes with the standardized ApiResponse structure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { ApiResponse } from '@/core/api/types';
import { auth, authenticateRequest } from '@/features/auth/api/middleware/authMiddleware';
import { AppError } from '@/core/errors/types/AppError';
import { UserRole } from '@/domain';
import { getPermissionService } from '@/core/factories/serviceFactory.server';

const logger = getLogger();

/**
 * Check if user has required permissions
 */
async function checkUserPermissions(userId: number, requiredPermissions: string[]): Promise<boolean> {
  try {
    const permissionService = getPermissionService();
    
    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasPermission = await permissionService.hasPermission(userId, permission);
      if (!hasPermission) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error checking user permissions:', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      requiredPermissions
    });
    return false;
  }
}

// Handler types
export type RouteHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse | Response | any>;

export type MiddlewareFunction = (
  req: NextRequest,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

// Route handler options
export interface RouteHandlerOptions {
  // Authentication options
  requiresAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string | string[];
  requiredPermissions?: string | string[];  // Support both for backward compatibility
  
  // Cache control
  cacheControl?: string;
  
  // Middleware
  middleware?: MiddlewareFunction[];
}

// New interface for object-style route handler configuration
export interface RouteHandlerConfig {
  requiredPermissions?: string[];
  requiredPermission?: string | string[];
  requiresAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
  cacheControl?: string;
  middleware?: MiddlewareFunction[];
  handler: RouteHandler;
}

/**
 * Format error to standardized ApiResponse structure
 */
function formatErrorResponse(error: unknown): ApiResponse<null> {
  let errorMessage = 'An unexpected error occurred';
  let statusCode = 500;
  
  if (error instanceof AppError) {
    errorMessage = error.message;
    statusCode = error.statusCode || 500;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  return {
    success: false,
    data: null,
    error: errorMessage,
    statusCode
  };
}

/**
 * Standard route handler with proper error handling, authentication, and logging
 * 
 * @param handler Route handler function
 * @param options Options for authentication and middleware
 */
export function routeHandler(
  handler: RouteHandler,
  options: RouteHandlerOptions = { requiresAuth: true }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    const method = request.method;
    const url = request.url;
    
    logger.info(`API Request started: ${method} ${url}`, { requestId, method, url });
    
    try {
      // Apply auth middleware if required
      if (options.requiresAuth !== false) {
        try {
          // Get authentication result directly
          const authResult = await authenticateRequest(request);
          
          // If auth failed, return the error response
          if (!authResult.success) {
            const duration = Date.now() - startTime;
            logger.info(`API Auth rejected: ${method} ${url}`, {
              requestId,
              method,
              url,
              status: authResult.statusCode || 401,
              duration: `${duration}ms`
            });
            
            // Return consistent error response
            return NextResponse.json({
              success: false,
              error: authResult.error || 'Authentication required',
              code: 'AUTHENTICATION_REQUIRED',
              message: authResult.message || 'Authentication required',
              statusCode: authResult.statusCode || 401
            }, { status: authResult.statusCode || 401 });
          }
          
          // Authentication successful - attach user info to request
          if (authResult.user) {
            // Explicitly set auth properties on request object
            if (!request.auth) {
              // Create auth object if it doesn't exist
              Object.defineProperty(request, 'auth', {
                value: {
                  userId: authResult.user.id,
                  role: authResult.user.role,
                  user: authResult.user
                },
                writable: true,
                enumerable: true
              });
            } else {
              // Update existing auth object
              request.auth.userId = authResult.user.id;
              request.auth.role = authResult.user.role;
              request.auth.user = authResult.user;
            }
            
            // Also set headers for backup authentication propagation
            request.headers.set('X-Auth-User-ID', authResult.user.id.toString());
            if (authResult.user.role) {
              request.headers.set('X-Auth-User-Role', authResult.user.role);
            }
            
            // Check permissions if required
            const requiredPerms = options.requiredPermissions || options.requiredPermission;
            if (requiredPerms) {
              const permsArray = Array.isArray(requiredPerms) ? requiredPerms : [requiredPerms];
              const hasPermissions = await checkUserPermissions(authResult.user.id, permsArray);
              
              if (!hasPermissions) {
                const duration = Date.now() - startTime;
                logger.info(`API Permission denied: ${method} ${url}`, {
                  requestId,
                  method,
                  url,
                  userId: authResult.user.id,
                  requiredPermissions: permsArray,
                  status: 403,
                  duration: `${duration}ms`
                });
                
                return NextResponse.json({
                  success: false,
                  error: 'Permission denied',
                  code: 'PERMISSION_DENIED',
                  message: 'You do not have the required permissions to access this resource',
                  statusCode: 403
                }, { status: 403 });
              }
            }
          }
        } catch (authError) {
          // Handle auth errors gracefully
          logger.error(`Auth middleware error: ${method} ${url}`, {
            error: authError instanceof Error ? authError.message : String(authError),
            stack: authError instanceof Error ? authError.stack : undefined,
            requestId
          });
          
          return NextResponse.json({
            success: false,
            error: 'Authentication error',
            code: 'AUTHENTICATION_ERROR',
            message: authError instanceof Error ? authError.message : 'Authentication error occurred',
            statusCode: 500
          }, { status: 500 });
        }
      }
      
      // Apply custom middleware if provided
      if (options.middleware && options.middleware.length > 0) {
        // Chain middleware
        const executeMiddleware = async (index: number): Promise<NextResponse> => {
          if (index >= (options.middleware?.length || 0)) {
            // All middleware executed, call handler
            return executeHandler(request, context);
          }
          
          // Execute middleware
          const middleware = options.middleware![index];
          return middleware(request, async () => {
            return executeMiddleware(index + 1);
          });
        };
        
        // Start middleware chain
        return executeMiddleware(0);
      }
      
      // No middleware, just execute handler
      return executeHandler(request, context);
      
      // Helper function to execute the main handler with proper response formatting
      async function executeHandler(req: NextRequest, ctx: any): Promise<NextResponse> {
        try {
          const result = await handler(req, ctx);
          
          // Handle different return types
          if (result instanceof NextResponse) {
            // Already a NextResponse, return it
            const duration = Date.now() - startTime;
            logger.info(`API Request completed: ${method} ${url}`, {
              requestId,
              method,
              url,
              status: result.status,
              duration: `${duration}ms`
            });
            return result;
          }
          
          if (result instanceof Response) {
            // Convert Response to NextResponse
            const nextResponse = NextResponse.json(
              await result.json(),
              { status: result.status, headers: result.headers }
            );
            
            const duration = Date.now() - startTime;
            logger.info(`API Request completed: ${method} ${url}`, {
              requestId,
              method,
              url,
              status: nextResponse.status,
              duration: `${duration}ms`
            });
            
            return nextResponse;
          }
          
          // Format direct return values in ApiResponse format
          const response = NextResponse.json(
            { success: true, data: result, error: null },
            { status: 200 }
          );
          
          const duration = Date.now() - startTime;
          logger.info(`API Request completed: ${method} ${url}`, {
            requestId,
            method,
            url,
            status: response.status,
            duration: `${duration}ms`
          });
          
          return response;
        } catch (error) {
          logger.error(`API Error in route handler: ${method} ${url}`, {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : String(error),
            requestId,
            method,
            url
          });
          
          // Format error in standardized ApiResponse structure
          const errorResponse = formatErrorResponse(error);
          
          return NextResponse.json(
            errorResponse,
            { status: errorResponse.statusCode || 500 }
          );
        }
      }
    } catch (error) {
      // Log error
      logger.error(`API Request failed: ${method} ${url}`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        requestId,
        method,
        url
      });
      
      // Format error in standardized ApiResponse structure
      const errorResponse = formatErrorResponse(error);
      
      return NextResponse.json(
        errorResponse,
        { status: errorResponse.statusCode || 500 }
      );
    }
  };
}

// Enhanced createRouteHandler that supports both old and new patterns
export function createRouteHandler(
  handlerOrConfig: RouteHandler | RouteHandlerConfig,
  options?: RouteHandlerOptions
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  // Check if first argument is a config object (new pattern)
  if (typeof handlerOrConfig === 'object' && 'handler' in handlerOrConfig) {
    const config = handlerOrConfig as RouteHandlerConfig;
    const handler = config.handler;
    const routeOptions: RouteHandlerOptions = {
      requiresAuth: config.requiresAuth,
      requiredRole: config.requiredRole,
      requiredPermission: config.requiredPermission || config.requiredPermissions,
      requiredPermissions: config.requiredPermissions,
      cacheControl: config.cacheControl,
      middleware: config.middleware
    };
    return routeHandler(handler, routeOptions);
  }
  
  // Old pattern - direct handler function
  return routeHandler(handlerOrConfig as RouteHandler, options);
}

// Export for backward compatibility
export { createRouteHandler as default };