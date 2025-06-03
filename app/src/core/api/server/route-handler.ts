/**
 * Enhanced Route Handler - Production-Ready Route Handler for Next.js App Router
 * 
 * Provides comprehensive authentication (JWT + API Key), authorization, error handling,
 * rate limiting, and audit logging for all API routes with consistent response format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { ApiResponse } from '@/core/api/types';
import { authenticateRequest } from '@/features/auth/api/middleware/authMiddleware';
import { apiKeyMiddleware, ApiKeyAuthResult } from '@/features/auth/api/middleware/apiKeyMiddleware';
import { AppError } from '@/core/errors/types/AppError';
import { UserRole } from '@/domain';

const logger = getLogger();

/**
 * Authentication context for route handlers
 */
export interface AuthContext {
  // JWT authentication
  user?: {
    id: number;
    email: string;
    role: UserRole;
    name?: string;
  };
  
  // API key authentication
  apiKey?: {
    id: number;
    type: 'admin' | 'standard';
    environment: 'production' | 'development';
    permissions?: string[];
    keyPreview: string;
  };
  
  // Authentication method used
  authMethod: 'jwt' | 'apikey' | 'both' | 'none';
}

/**
 * Route handler function type
 */
export type RouteHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse | Response | any>;

/**
 * Middleware function type
 */
export type MiddlewareFunction = (
  req: NextRequest,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

/**
 * Route handler configuration options
 */
export interface RouteHandlerOptions {
  // Authentication requirements
  requiresAuth?: boolean;
  allowApiKeyAuth?: boolean;
  allowBothAuth?: boolean; // Allow either JWT or API key
  
  // Authorization requirements
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string | string[];
  
  // API key specific restrictions
  allowedApiKeyTypes?: ('admin' | 'standard')[];
  allowedApiKeyEnvironments?: ('production' | 'development')[];
  
  // HTTP options
  cacheControl?: string;
  
  // Custom middleware
  middleware?: MiddlewareFunction[];
}

/**
 * Format error response to standardized ApiResponse structure
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
 * Enhanced route handler with comprehensive authentication and authorization
 * 
 * @param handler - Route handler function
 * @param options - Configuration options
 * @returns Configured route handler
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
      // Initialize authentication context
      const authContext: AuthContext = {
        authMethod: 'none'
      };
      
      // Handle authentication if required
      if (options.requiresAuth || options.allowApiKeyAuth || options.allowBothAuth) {
        let hasValidAuth = false;
        
        // Try API key authentication if enabled
        if (options.allowApiKeyAuth || options.allowBothAuth) {
          const apiKeyResult = await apiKeyMiddleware(request);
          
          if (apiKeyResult.success && apiKeyResult.apiKeyId) {
            // Validate API key constraints
            if (options.allowedApiKeyTypes?.length && apiKeyResult.type) {
              if (!options.allowedApiKeyTypes.includes(apiKeyResult.type)) {
                return NextResponse.json({
                  success: false,
                  error: `API key type '${apiKeyResult.type}' not allowed for this endpoint`,
                  code: 'INVALID_API_KEY_TYPE',
                  statusCode: 403
                }, { status: 403 });
              }
            }
            
            if (options.allowedApiKeyEnvironments?.length && apiKeyResult.environment) {
              if (!options.allowedApiKeyEnvironments.includes(apiKeyResult.environment)) {
                return NextResponse.json({
                  success: false,
                  error: `API key environment '${apiKeyResult.environment}' not allowed`,
                  code: 'INVALID_API_KEY_ENVIRONMENT',
                  statusCode: 403
                }, { status: 403 });
              }
            }
            
            // Handle rate limiting
            if (apiKeyResult.rateLimitExceeded) {
              return NextResponse.json({
                success: false,
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                message: apiKeyResult.message,
                statusCode: 429,
                rateLimit: {
                  exceeded: true,
                  resetTime: apiKeyResult.rateLimit?.resetTime,
                  remainingRequests: apiKeyResult.rateLimit?.remainingRequests
                }
              }, { 
                status: 429,
                headers: {
                  'X-RateLimit-Limit': apiKeyResult.rateLimit?.currentRequests.toString() || '0',
                  'X-RateLimit-Remaining': apiKeyResult.rateLimit?.remainingRequests.toString() || '0',
                  'X-RateLimit-Reset': apiKeyResult.rateLimit?.resetTime?.toISOString() || ''
                }
              });
            }
            
            // Check API key permissions
            if (options.requiredPermission) {
              const requiredPermissions = Array.isArray(options.requiredPermission) 
                ? options.requiredPermission 
                : [options.requiredPermission];
              
              const hasPermissions = requiredPermissions.every(permission => {
                // Admin keys have all permissions
                if (apiKeyResult.type === 'admin') return true;
                // Standard keys need explicit permissions
                return apiKeyResult.permissions?.includes(permission) || false;
              });
              
              if (!hasPermissions) {
                const missingPermissions = requiredPermissions.filter(permission => 
                  apiKeyResult.type !== 'admin' && !apiKeyResult.permissions?.includes(permission)
                );
                
                return NextResponse.json({
                  success: false,
                  error: 'Insufficient API key permissions',
                  code: 'INSUFFICIENT_PERMISSIONS',
                  message: `Missing permissions: ${missingPermissions.join(', ')}`,
                  statusCode: 403
                }, { status: 403 });
              }
            }
            
            // Set API key authentication context
            authContext.apiKey = {
              id: apiKeyResult.apiKeyId,
              type: apiKeyResult.type!,
              environment: apiKeyResult.environment!,
              permissions: apiKeyResult.permissions,
              keyPreview: apiKeyResult.keyPreview!
            };
            authContext.authMethod = 'apikey';
            hasValidAuth = true;
          }
        }
        
        // Try JWT authentication if not authenticated via API key or both allowed
        if (!hasValidAuth || options.allowBothAuth) {
          const jwtResult = await authenticateRequest(request);
          
          if (jwtResult.success && jwtResult.user) {
            // Check JWT permissions using the permission service
            if (options.requiredPermission) {
              const requiredPermissions = Array.isArray(options.requiredPermission)
                ? options.requiredPermission
                : [options.requiredPermission];
              
              try {
                // Import permission utilities for proper permission checking
                const { checkUserHasAnyPermission } = await import('@/app/api/helpers/permissionUtils');
                
                // Check if user has any of the required permissions
                // 🔑 FIX: Pass the user role to enable admin bypass
                const hasRequiredPermissions = await checkUserHasAnyPermission(
                  jwtResult.user.id,
                  requiredPermissions,
                  jwtResult.user.role // Pass role for admin bypass
                );
                
                if (!hasRequiredPermissions) {
                  return NextResponse.json({
                    success: false,
                    error: 'Insufficient user permissions',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `Missing permissions: ${requiredPermissions.join(', ')}`,
                    statusCode: 403
                  }, { status: 403 });
                }
              } catch (permissionError) {
                logger.error('Error checking user permissions', {
                  error: permissionError instanceof Error ? permissionError.message : String(permissionError),
                  userId: jwtResult.user.id,
                  requiredPermissions
                });
                
                return NextResponse.json({
                  success: false,
                  error: 'Permission check failed',
                  code: 'PERMISSION_CHECK_ERROR',
                  message: 'Unable to verify user permissions',
                  statusCode: 500
                }, { status: 500 });
              }
            }
            
            // Check role requirements
            if (options.requiredRole) {
              const requiredRoles = Array.isArray(options.requiredRole)
                ? options.requiredRole
                : [options.requiredRole];
              
              // Ensure user.role is properly typed as UserRole
              const userRole = jwtResult.user.role as UserRole;
              
              if (!requiredRoles.includes(userRole)) {
                return NextResponse.json({
                  success: false,
                  error: 'Insufficient role permissions',
                  code: 'INSUFFICIENT_ROLE',
                  message: `Required role: ${requiredRoles.join(' or ')}, current: ${userRole}`,
                  statusCode: 403
                }, { status: 403 });
              }
            }
            
            // Set JWT authentication context with proper typing
            authContext.user = {
              id: jwtResult.user.id,
              email: jwtResult.user.email,
              role: jwtResult.user.role as UserRole,
              name: jwtResult.user.name
            };
            authContext.authMethod = hasValidAuth ? 'both' : 'jwt';
            hasValidAuth = true;
          }
        }
        
        // Check if authentication was successful
        if ((options.requiresAuth || options.allowApiKeyAuth) && !hasValidAuth) {
          return NextResponse.json({
            success: false,
            error: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Valid JWT token or API key required',
            statusCode: 401
          }, { status: 401 });
        }
        
        // Attach auth context to request with proper typing
        Object.defineProperty(request, 'auth', {
          value: {
            userId: authContext.user?.id || authContext.apiKey?.id,
            role: authContext.user?.role,
            user: authContext.user,
            apiKey: authContext.apiKey,
            authMethod: authContext.authMethod
          },
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
      
      // Apply custom middleware if provided
      if (options.middleware?.length) {
        const executeMiddleware = async (index: number): Promise<NextResponse> => {
          if (index >= options.middleware!.length) {
            return executeHandler();
          }
          
          const middleware = options.middleware![index];
          return middleware(request, async () => executeMiddleware(index + 1));
        };
        
        return executeMiddleware(0);
      }
      
      // Execute main handler
      return executeHandler();
      
      // Helper function to execute the main handler
      async function executeHandler(): Promise<NextResponse> {
        try {
          const result = await handler(request, context);
          
          // Handle different return types
          let response: NextResponse;
          
          if (result instanceof NextResponse) {
            response = result;
          } else if (result instanceof Response) {
            response = NextResponse.json(
              await result.json(),
              { status: result.status, headers: result.headers }
            );
          } else {
            // Format as ApiResponse
            response = NextResponse.json(
              { success: true, data: result, error: null },
              { status: 200 }
            );
          }
          
          // Add cache control headers if specified
          if (options.cacheControl) {
            response.headers.set('Cache-Control', options.cacheControl);
          }
          
          // Add request ID header
          response.headers.set('X-Request-ID', requestId);
          
          const duration = Date.now() - startTime;
          logger.info(`API Request completed: ${method} ${url}`, {
            requestId,
            method,
            url,
            status: response.status,
            authMethod: authContext.authMethod,
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
          
          const errorResponse = formatErrorResponse(error);
          
          return NextResponse.json(
            errorResponse,
            { 
              status: errorResponse.statusCode || 500,
              headers: { 'X-Request-ID': requestId }
            }
          );
        }
      }
    } catch (error) {
      // Top-level error handling
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
      
      const errorResponse = formatErrorResponse(error);
      
      return NextResponse.json(
        errorResponse,
        { 
          status: errorResponse.statusCode || 500,
          headers: { 'X-Request-ID': requestId }
        }
      );
    }
  };
}

// Export for use in API routes
export default routeHandler;