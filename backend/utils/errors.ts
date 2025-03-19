/**
 * Custom error classes for standardized error handling
 */

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
      
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class ValidationError extends AppError {
    errors: string[];
    
    constructor(message: string, errors: string[]) {
      super(message, 400);
      this.errors = errors;
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(resource: string) {
      super(`${resource} not found`, 404);
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
      super(message, 401);
    }
  }
  
  export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden access') {
      super(message, 403);
    }
  }
  
  export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed') {
      super(message, 500);
    }
  }
  
  export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'Service temporarily unavailable') {
      super(message, 503);
    }
  }
  
  /**
   * Helpers for standardized error response
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
    
    if (process.env.NODE_ENV !== 'production') {
      response.stack = error.stack;
    }
    
    return response;
  };
  
  export interface ErrorResponse {
    success: false;
    error: string;
    statusCode: number;
    errors?: string[];
    stack?: string;
  }