/**
 * Response Formatter
 * Provides consistent API response formatting
 */
import { NextResponse } from 'next/server';
import { ApiResponse, ErrorResponse, SuccessResponse, PaginatedResponse } from '../types/ApiTypes';
import { AppError, AuthenticationError, PermissionError, NotFoundError, ValidationError } from '../types/AppError';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Creates a standardized API response
 */
export const formatResponse = {
  /**
   * Format a successful response
   * 
   * @param data Response data
   * @param message Optional success message
   * @param status HTTP status code (default: 200)
   * @returns Formatted success response
   */
  success<T>(data: T, message?: string, status: number = 200): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      message,
      error: null,
      timestamp: new Date().toISOString()
    }, { status });
  },

  /**
   * Format an error response
   * 
   * @param error Error object or message
   * @param statusCode HTTP status code (default: 500)
   * @param errorCode Error code
   * @param details Additional error details
   * @returns Formatted error response
   */
  error(
    error: string | Error | AppError, 
    statusCode: number = 500, 
    errorCode?: string, 
    details?: any
  ): NextResponse {
    // Extract information from error object
    const message = error instanceof Error ? error.message : error;
    const code = error instanceof AppError 
      ? error.errorCode 
      : (errorCode || 'INTERNAL_ERROR');
    const status = error instanceof AppError 
      ? error.statusCode 
      : statusCode;
    const errorDetails = error instanceof AppError 
      ? error.details 
      : details;
    
    // Log error details (but not for 4xx client errors)
    if (status >= 500) {
      logger.error('API Error', {
        message,
        code,
        status,
        details: errorDetails,
        stack: error instanceof Error ? error.stack : undefined
      });
    } else if (status !== 404) {
      // Log 4xx errors as warnings, except common 404s
      logger.warn('API Client Error', {
        message,
        code,
        status,
        details: errorDetails
      });
    }
    
    const response: ErrorResponse = {
      success: false,
      data: null,
      message,
      error: {
        code,
        details: errorDetails
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, { status });
  },
  
  /**
   * Format a not found error response
   * 
   * @param message Error message
   * @param errorCode Error code
   * @param details Additional error details
   * @returns Formatted not found error response
   */
  notFound(
    message: string = 'Resource not found', 
    errorCode: string = 'NOT_FOUND', 
    details?: any
  ): NextResponse {
    return this.error(
      new NotFoundError(message, errorCode, details)
    );
  },
  
  /**
   * Format an unauthorized error response
   * 
   * @param message Error message
   * @param errorCode Error code
   * @param details Additional error details
   * @returns Formatted unauthorized error response
   */
  unauthorized(
    message: string = 'Authentication required', 
    errorCode: string = 'AUTHENTICATION_REQUIRED', 
    details?: any
  ): NextResponse {
    return this.error(
      new AuthenticationError(message, errorCode, details)
    );
  },
  
  /**
   * Format a forbidden error response
   * 
   * @param message Error message
   * @param errorCode Error code
   * @param details Additional error details
   * @returns Formatted forbidden error response
   */
  forbidden(
    message: string = 'Permission denied', 
    errorCode: string = 'PERMISSION_DENIED', 
    details?: any
  ): NextResponse {
    return this.error(
      new PermissionError(message, errorCode, details)
    );
  },
  
  /**
   * Format a validation error response
   * 
   * @param errors Validation errors by field
   * @param message Error message
   * @param errorCode Error code
   * @returns Formatted validation error response
   */
  validationError(
    errors: Record<string, string[]> | string[] | any,
    message: string = 'Validation failed',
    errorCode: string = 'VALIDATION_ERROR'
  ): NextResponse {
    return this.error(
      new ValidationError(message, errorCode, { errors })
    );
  },

  /**
   * Format a validation error response (alias for backward compatibility)
   */
  badRequest(
    message: string = 'Invalid request data', 
    errorCode: string = 'VALIDATION_ERROR', 
    details?: any
  ): NextResponse {
    return this.error(
      new ValidationError(message, errorCode, details)
    );
  },
  
  /**
   * Format a service unavailable error response
   * 
   * @param message Error message
   * @param errorCode Error code
   * @param details Additional error details
   * @returns Formatted service unavailable error response
   */
  serviceUnavailable(
    message: string = 'Service temporarily unavailable', 
    errorCode: string = 'SERVICE_UNAVAILABLE', 
    details?: any
  ): NextResponse {
    return this.error(
      new AppError(message, 503, errorCode, details)
    );
  },
  
  /**
   * Format a paginated response
   * 
   * @param items Array of items
   * @param total Total number of items
   * @param page Current page number
   * @param limit Items per page
   * @param message Optional message
   * @returns Formatted paginated response
   */
  paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ): NextResponse {
    const totalPages = Math.ceil(total / limit);
    
    return this.success({
      items,
      total,
      page,
      totalPages,
      hasMore: page < totalPages
    }, message);
  }
};

export default formatResponse;