/**
 * Error Utilities
 * 
 * Custom error classes and helpers for consistent error handling throughout the application.
 * Provides standardized error responses and error codes.
 */
import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';

/**
 * Base Application Error
 * Parent class for all custom error types
 */
export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;
  
  /**
   * Creates a new AppError
   * @param message Error message
   * @param statusCode HTTP status code
   * @param errorCode Application error code
   * @param details Additional error details
   */
  constructor(
    message: string, 
    statusCode: number = 500, 
    errorCode: string = 'internal_error',
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 * Used for request validation failures
 */
export class ValidationError extends AppError {
  errors: string[];
  
  /**
   * Creates a new ValidationError
   * @param message Error message
   * @param errors Validation error messages
   */
  constructor(message: string = 'Validation failed', errors: string[] = []) {
    super(message, 400, 'validation_error');
    this.errors = errors;
  }
}

/**
 * Not Found Error
 * Used when a requested resource does not exist
 */
export class NotFoundError extends AppError {
  /**
   * Creates a new NotFoundError
   * @param message Error message
   */
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'not_found');
  }
}

/**
 * Unauthorized Error
 * Used for authentication failures
 */
export class UnauthorizedError extends AppError {
  /**
   * Creates a new UnauthorizedError
   * @param message Error message
   */
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'unauthorized');
  }
}

/**
 * Forbidden Error
 * Used for authorization failures
 */
export class ForbiddenError extends AppError {
  /**
   * Creates a new ForbiddenError
   * @param message Error message
   */
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'forbidden');
  }
}

/**
 * Conflict Error
 * Used for resource conflicts (e.g., duplicate entries)
 */
export class ConflictError extends AppError {
  /**
   * Creates a new ConflictError
   * @param message Error message
   */
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'conflict');
  }
}

/**
 * Database Error
 * Used for database operation failures
 */
export class DatabaseError extends AppError {
  /**
   * Creates a new DatabaseError
   * @param message Error message
   * @param details Error details
   */
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'database_error', details);
  }
}

/**
 * Business Logic Error
 * Used for application-specific logic errors
 */
export class BusinessLogicError extends AppError {
  /**
   * Creates a new BusinessLogicError
   * @param message Error message
   * @param statusCode HTTP status code (defaults to 400)
   * @param errorCode Application error code
   */
  constructor(
    message: string, 
    statusCode: number = 400, 
    errorCode: string = 'business_logic_error'
  ) {
    super(message, statusCode, errorCode);
  }
}

/**
 * Service Unavailable Error
 * Used when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  /**
   * Creates a new ServiceUnavailableError
   * @param message Error message
   */
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'service_unavailable');
  }
}

/**
 * Create standardized error response object
 * @param error Error instance
 * @returns Error response object
 */
export function createErrorResponse(error: any): any {
  const timestamp = new Date().toISOString();
  
  // If this is an AppError, use its properties
  if (error instanceof AppError) {
    const response: any = {
      success: false,
      error: error.message,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      timestamp
    };
    
    // Add validation errors if available
    if (error instanceof ValidationError && error.errors?.length > 0) {
      response.errors = error.errors;
    }
    
    // Add stack trace in development mode
    if (config.SHOW_STACK_TRACES) {
      response.stack = error.stack;
    }
    
    return response;
  }
  
  // Default error response
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    errorCode: 'internal_error',
    statusCode: 500,
    timestamp,
    stack: config.SHOW_STACK_TRACES ? error.stack : undefined
  };
}

/**
 * Async handler to avoid try/catch in routes
 * @param fn Route handler function
 * @returns Wrapped route handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Extract useful properties from an error for logging
 * @param error Error object
 * @returns Simplified error object
 */
export function sanitizeError(error: any): any {
  if (!error) return { message: 'Unknown error' };
  
  // If it's an AppError, get its properties
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      stack: error.stack
    };
  }
  
  // If it's an Error, get standard properties
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  // If it's a string, treat as message
  if (typeof error === 'string') {
    return { message: error };
  }
  
  // For other objects, just return as is
  return error;
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  BusinessLogicError,
  ServiceUnavailableError,
  createErrorResponse,
  asyncHandler,
  sanitizeError
};