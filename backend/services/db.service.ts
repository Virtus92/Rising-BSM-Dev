/**
 * Custom error classes for standardized error handling
 */

/**
 * Base application error with additional metadata
 */
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    details?: any;
    
    constructor(message: string, statusCode: number, details?: any) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
      this.details = details;
      
      Error.captureStackTrace(this, this.constructor);
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }
  
  /**
   * Validation error for form/data validation failures
   */
  export class ValidationError extends AppError {
    errors: string[];
    
    constructor(message: string, errors: string[] = []) {
      super(message, 400);
      this.errors = errors;
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, ValidationError.prototype);
    }
  }
  
  /**
   * Not found error for resource lookups
   */
  export class NotFoundError extends AppError {
    resource: string;
    
    constructor(resource: string) {
      super(`${resource} not found`, 404);
      this.resource = resource;
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, NotFoundError.prototype);
    }
  }
  
  /**
   * Unauthorized error for authentication failures
   */
  export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
      super(message, 401);
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
  }
  
  /**
   * Forbidden error for authorization failures
   */
  export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden access') {
      super(message, 403);
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
  }
  
  /**
   * Database error for database operation failures
   */
  export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed', details?: any) {
      super(message, 500, details);
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, DatabaseError.prototype);
    }
  }
  
  /**
   * Service unavailable error for temporary service outages
   */
  export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'Service temporarily unavailable') {
      super(message, 503);
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }
  }
  
  /**
   * Conflict error for resource conflicts
   */
  export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict') {
      super(message, 409);
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, ConflictError.prototype);
    }
  }
  
  /**
   * Bad request error for malformed requests
   */
  export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
      super(message, 400);
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, BadRequestError.prototype);
    }
  }
  
  /**
   * Too many requests error for rate limiting
   */
  export class TooManyRequestsError extends AppError {
    constructor(message: string = 'Too many requests') {
      super(message, 429);
      
      // Set the prototype explicitly to ensure instanceof works correctly
      Object.setPrototypeOf(this, TooManyRequestsError.prototype);
    }
  }
  
  /**
   * Response interface for standardized error responses
   */
  export interface ErrorResponse {
    success: false;
    error: string;
    statusCode: number;
    errors?: string[];
    stack?: string;
    details?: any;
  }
  
  /**
   * Create a standardized error response object
   * @param error Error instance
   * @returns Standardized error response object
   */
  export const createErrorResponse = (error: Error): ErrorResponse => {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const message = error.message || 'An unexpected error occurred';
    
    const response: ErrorResponse = {
      success: false,
      error: message,
      statusCode
    };
    
    if (error instanceof ValidationError) {
      response.errors = error.errors;
    }
    
    if (error instanceof AppError && error.details) {
      response.details = error.details;
    }
    
    if (process.env.NODE_ENV !== 'production') {
      response.stack = error.stack;
    }
    
    return response;
  };
  
  /**
   * Error handler for async functions
   * @param fn Async function to wrap
   * @returns Wrapped function that handles errors
   */
  export const asyncErrorHandler = (fn: Function) => {
    return async (req: any, res: any, next: any) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  };