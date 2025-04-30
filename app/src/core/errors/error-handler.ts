/**
 * Error Handler Middleware
 * Provides consistent error handling for route handlers
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from './formatting/response-formatter';
import { AppError, NotFoundError, ValidationError, AuthenticationError, PermissionError, ConflictError, BadRequestError } from './types/AppError';
import { getLogger } from '@/core/logging';
import { IErrorHandler } from './types/IErrorHandler';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';

const logger = getLogger();

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  data: null;
  message: string;
  error: {
    code: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Success response interface
 */
export interface SuccessResponse<T> {
  data: T;
}

/**
* Error handler middleware for route handlers
* Wraps a route handler with standardized error handling
* 
* @param handler Route handler function
* @returns Wrapped handler with error handling
*/
export function errorHandler<T>(
handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
try {
// Execute the original handler
return await handler(request, ...args);
} catch (error) {
// Log the error with detailed information
logger.error('Unhandled error in route handler', {
path: request.nextUrl.pathname,
method: request.method,
error: error instanceof Error ? {
name: error.name,
message: error.message,
stack: error.stack
} : String(error)
});

// Handle authentication errors from AuthErrorHandler
if (error && (error as any).type === AuthErrorType.AUTH_REQUIRED) {
return formatResponse.unauthorized(
    error instanceof Error ? error.message : 'Authentication required',
    {
      details: (error as any).details || {
        path: request.nextUrl.pathname,
      requiredAuth: true
    }
}.toString()
);
}

// Handle permission errors from AuthErrorHandler
if (error && (error as any).type === AuthErrorType.PERMISSION_DENIED) {
return formatResponse.forbidden(
  error instanceof Error ? error.message : 'Permission denied',
    {
      details: (error as any).details || {
        path: request.nextUrl.pathname,
          permissionRequired: true
          }
          }.toString()
          );
        }
        
        // Format the error response based on error type
        if (error instanceof AppError) {
          return formatResponse.error(error) as NextResponse<ErrorResponse>;
        }
        
        // Generic error handling
        return formatResponse.error(
          error instanceof Error ? error.message : 'An unexpected error occurred',
          500,
          'INTERNAL_SERVER_ERROR',
          {
            path: request.nextUrl.pathname,
            timestamp: new Date().toISOString()
          }
        ) as NextResponse<ErrorResponse>;
      }
    };
  }

/**
 * Context for request tracking and error information
 */
export interface RequestContext {
  /** Request ID for tracking */
  requestId: string;
  
  /** Request start time */
  startTime: number;
  
  /** Request path */
  path: string;
  
  /** HTTP method */
  method: string;
}

/**
 * Creates a context object for request tracking
 */
export function createRequestContext(request: NextRequest): RequestContext {
  const requestId = request.headers.get('x-request-id') || 
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  return {
    requestId,
    startTime: Date.now(),
    path: request.nextUrl.pathname,
    method: request.method || 'UNKNOWN'
  };
}

/**
 * Implementation of the error handler interface
 * Provides centralized error handling
 */
const errorHandlerImplementation: IErrorHandler = {
  /**
   * Create a generic application error
   */
  createError(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details?) {
    return new AppError(message, statusCode, errorCode, details);
  },
  
  /**
   * Create a validation error
   */
  createValidationError(message, errors, errorCode = 'VALIDATION_ERROR') {
    return new ValidationError(message, errorCode, errors);
  },
  
  /**
   * Create a not found error
   */
  createNotFoundError(message, errorCode = 'NOT_FOUND', details?) {
    return new NotFoundError(message, errorCode, details);
  },
  
  /**
   * Create an unauthorized error
   */
  createUnauthorizedError(message, errorCode = 'UNAUTHORIZED', details?) {
    return new AuthenticationError(message, errorCode, details);
  },
  
  /**
   * Create a forbidden error
   */
  createForbiddenError(message, errorCode = 'FORBIDDEN', details?) {
    return new PermissionError(message, errorCode, details);
  },
  
  /**
   * Create a conflict error
   */
  createConflictError(message, errorCode = 'CONFLICT', details?) {
    return new ConflictError(message, errorCode, details);
  },
  
  /**
   * Create a bad request error
   */
  createBadRequestError(message, errorCode = 'BAD_REQUEST', details?) {
    return new BadRequestError(message, errorCode, details);
  },
  
  /**
   * Handle an API error
   */
  handleApiError(error, request?) {
    // Log the error with detailed information
    logger.error('API error:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error),
      path: request?.nextUrl.pathname,
      method: request?.method
    });
    
    // Handle authentication and permission errors from AuthErrorHandler
    if (error && (error as any).type === AuthErrorType.AUTH_REQUIRED) {
      return formatResponse.unauthorized(
        error instanceof Error ? error.message : 'Authentication required',
        {
          details: (error as any).details || {
            requiredAuth: true
          }
        }.toString()
      );
    }
    
    if (error && (error as any).type === AuthErrorType.PERMISSION_DENIED) {
      return formatResponse.forbidden(
        error instanceof Error ? error.message : 'Permission denied',
        {
          details: (error as any).details || {
            permissionRequired: true
          }
        }.toString()
      );
    }
    
    // Format the error response based on error type
    if (error instanceof AppError) {
      return formatResponse.error(error);
    }
    
    // Generic error handling
    return formatResponse.error(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  },
  
  /**
   * Handle a database error
   */
  handleDatabaseError(error) {
    logger.error('Database error:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error)
    });
    
    // Map database-specific errors
    if (error && typeof error === 'object') {
      // Handle based on error codes or types
      if ('code' in error) {
        const code = (error as any).code;
        
        if (code === 'P2025') { // Prisma not found
          return new NotFoundError('Resource not found');
        }
        
        if (code === 'P2002') { // Prisma unique constraint
          return new ConflictError('Duplicate record');
        }
        
        if (code === 'P2003') { // Prisma foreign key constraint
          return new ConflictError('Referenced record not found');
        }
      }
      
      // If it's an Error instance with statusCode, assume it's already handled
      if (error instanceof Error && 'statusCode' in error) {
        return error as Error;
      }
    }
    
    // Default to internal error
    return new AppError(
      error instanceof Error ? error.message : 'Database operation failed',
      500,
      'DATABASE_ERROR'
    );
  },
  
  /**
   * Map a generic error to an application error
   */
  mapError(error) {
    logger.error('Mapping error:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error)
    });
    
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }
    
    // If it's an auth error from AuthErrorHandler, convert appropriately
    if (error && (error as any).type) {
      const authError = error as any;
      
      if (authError.type === AuthErrorType.AUTH_REQUIRED) {
        return new AuthenticationError(
          authError.message || 'Authentication required',
          authError.code || 'AUTHENTICATION_REQUIRED',
          authError.details
        );
      }
      
      if (authError.type === AuthErrorType.PERMISSION_DENIED) {
        return new PermissionError(
          authError.message || 'Permission denied',
          authError.code || 'PERMISSION_DENIED',
          authError.details
        );
      }
    }
    
    // Default to internal error
    return new AppError(
      error instanceof Error ? error.message : 'An error occurred',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
};

/**
 * Returns the error handler implementation
 * 
 * @returns IErrorHandler instance
 */
export function getErrorHandler(): IErrorHandler {
  return errorHandlerImplementation;
}

/**
 * Export error handler
 */
export default { getErrorHandler, createRequestContext, errorHandler };
