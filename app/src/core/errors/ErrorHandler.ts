/**
 * Error Handler
 * Provides centralized error handling functionality
 */
import { NextRequest, NextResponse } from 'next/server';
import { IErrorHandler } from './types/IErrorHandler';
import { AppError } from './types/AppError';
import { getLogger } from '../logging';

export class ErrorHandler implements IErrorHandler {
  private readonly logger = getLogger();
  
  /**
   * Creates a standardized error
   */
  createError(message: string, statusCode?: number, errorCode?: string, details?: any): AppError {
    return new AppError(message, statusCode || 500, errorCode || 'UNKNOWN_ERROR', details);
  }
  
  /**
   * Handles an error and returns an appropriate response
   */
  handleError(error: Error | unknown): AppError {
    this.logger.error('Error handled:', error as Error);
    
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(
        error.message,
        500,
        'INTERNAL_ERROR',
        { originalError: error.stack }
      );
    }
    
    return new AppError(
      'An unknown error occurred',
      500,
      'UNKNOWN_ERROR',
      { error: String(error) }
    );
  }
  
  /**
   * Logs an error
   */
  logError(error: Error | unknown, context?: any): void {
    this.logger.error('Error logged:', error as Error, context);
  }
  
  /**
   * Checks if an error is a specific type
   */
  isErrorType(error: Error | unknown, type: string): boolean {
    if (error instanceof AppError) {
      return error.code === type;
    }
    return false;
  }
  
  /**
   * Formats an error for API response
   */
  formatErrorResponse(error: Error | unknown): {
    success: false;
    message: string;
    code?: string;
    details?: any;
  } {
    const appError = this.handleError(error);
    
    return {
      success: false,
      message: appError.message,
      code: appError.code,
      ...(process.env.NODE_ENV === 'development' && { details: appError.details })
    };
  }
  
  /**
   * Creates a validation error
   */
  createValidationError(message: string, errors?: string[] | Record<string, string[]>, errorCode?: string): AppError {
    return new AppError(
      message || 'Validation failed',
      400,
      errorCode || 'VALIDATION_ERROR',
      { errors }
    );
  }
  
  /**
   * Creates a not found error
   */
  createNotFoundError(message: string, errorCode?: string, details?: any): AppError {
    return new AppError(
      message,
      404,
      errorCode || 'NOT_FOUND',
      details
    );
  }
  
  /**
   * Creates an unauthorized error
   */
  createUnauthorizedError(message: string, errorCode?: string, details?: any): AppError {
    return new AppError(
      message || 'Unauthorized access',
      401,
      errorCode || 'UNAUTHORIZED',
      details
    );
  }
  
  /**
   * Creates a forbidden error
   */
  createForbiddenError(message: string, errorCode?: string, details?: any): AppError {
    return new AppError(
      message || 'Access forbidden',
      403,
      errorCode || 'FORBIDDEN',
      details
    );
  }
  
  /**
   * Creates a conflict error
   */
  createConflictError(message: string, errorCode?: string, details?: any): AppError {
    return new AppError(
      message || 'Conflict',
      409,
      errorCode || 'CONFLICT',
      details
    );
  }
  
  /**
   * Creates a bad request error
   */
  createBadRequestError(message: string, errorCode?: string, details?: any): AppError {
    return new AppError(
      message || 'Bad request',
      400,
      errorCode || 'BAD_REQUEST',
      details
    );
  }
  
  /**
   * Handle an API error
   */
  handleApiError(error: unknown, request?: NextRequest): NextResponse<any> {
    const formattedResponse = this.formatErrorResponse(error);
    return NextResponse.json(formattedResponse, { status: 500 });
  }
  
  /**
   * Handle a database error
   */
  handleDatabaseError(error: unknown): Error {
    this.logger.error('Database error:', error as Error);
    return this.handleError(error);
  }
  
  /**
   * Map a generic error to an application error
   */
  mapError(error: unknown): Error {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(
        error.message,
        500,
        'INTERNAL_ERROR',
        { originalError: error.stack }
      );
    }
    
    return new AppError(
      'An unknown error occurred',
      500,
      'UNKNOWN_ERROR',
      { error: String(error) }
    );
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Also export the class for dependency injection
export default ErrorHandler;
