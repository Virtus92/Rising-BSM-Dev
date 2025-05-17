/**
 * Route Handler - Standardized Route Handler for Next.js App Router
 * 
 * Provides consistent error handling, authentication, and logging
 * for all API routes with the standardized ApiResponse structure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { ApiResponse } from '@/core/api/types';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { AppError } from '@/core/errors/types/AppError';
import { UserRole } from '@/domain';

const logger = getLogger();

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
  
  // Cache control
  cacheControl?: string;
  
  // Middleware
  middleware?: MiddlewareFunction[];
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
        // Create auth handler with correct options
        const authHandler = auth(
          async (req, user) => {
            // This handler is only used internally for auth verification
            return NextResponse.json({ success: true });
          },
          {
            requireAuth: true,
            requiredRole: options.requiredRole,
            requiredPermission: options.requiredPermission 
              ? Array.isArray(options.requiredPermission)
                ? options.requiredPermission 
                : [options.requiredPermission]
              : undefined
          }
        );
        
        // Apply auth middleware
        const authResult = await authHandler(request, context);
        
        // If auth failed (status is not 200), return the error response
        if (authResult.status !== 200) {
          const duration = Date.now() - startTime;
          logger.info(`API Auth rejected: ${method} ${url}`, {
            requestId,
            method,
            url,
            status: authResult.status,
            duration: `${duration}ms`
          });
          
          // Return consistent error response
          return NextResponse.json({
            success: false,
            error: 'Authentication required',
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            statusCode: 401
          }, { status: 401 });
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

// Export for use in API routes
export default routeHandler;