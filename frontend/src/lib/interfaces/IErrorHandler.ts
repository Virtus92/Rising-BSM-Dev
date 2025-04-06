/**
 * IErrorHandler
 * 
 * Interface for standardized error handling across the application.
 * Provides methods for handling different types of errors and formatting error responses.
 */
export interface IErrorHandler {
    /**
     * Handle an error and generate an appropriate response
     * 
     * @param error - Error object
     * @param req - HTTP request object (optional)
     * @param res - HTTP response object (optional)
     * @returns Formatted error response
     */
    handleError(error: any, req?: any, res?: any): ErrorResponse;
    
    /**
     * Create a new application error
     * 
     * @param message - Error message
     * @param statusCode - HTTP status code
     * @param errorCode - Application-specific error code
     * @param details - Additional error details
     * @returns Application error
     */
    createError(
      message: string, 
      statusCode?: number, 
      errorCode?: string, 
      details?: any
    ): AppError;
    
    /**
     * Format an error for API response
     * 
     * @param error - Error object
     * @returns Formatted error response
     */
    formatError(error: any): ErrorResponse;
    
    /**
     * Create a validation error
     * 
     * @param message - Error message
     * @param errors - Validation errors
     * @returns Validation error
     */
    createValidationError(message: string, errors: string[]): ValidationError;
    
    /**
     * Create a not found error
     * 
     * @param message - Error message
     * @param resource - Resource that was not found
     * @returns Not found error
     */
    createNotFoundError(message: string, resource?: string): NotFoundError;
    
    /**
     * Create an unauthorized error
     * 
     * @param message - Error message
     * @returns Unauthorized error
     */
    createUnauthorizedError(message: string): UnauthorizedError;
    
    /**
     * Create a forbidden error
     * 
     * @param message - Error message
     * @returns Forbidden error
     */
    createForbiddenError(message: string): ForbiddenError;
    
    /**
     * Log an error
     * 
     * @param error - Error object
     * @param req - HTTP request object (optional)
     */
    logError(error: any, req?: any): void;
  }
  
  /**
   * Base application error class
   */
  export class AppError extends Error {
    statusCode: number;
    errorCode: string;
    details?: any;
    
    constructor(message: string, statusCode = 500, errorCode = 'internal_error', details?: any) {
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
   * Validation error
   */
  export class ValidationError extends AppError {
    errors: string[];
    
    constructor(message: string, errors: string[] = []) {
      super(message, 400, 'validation_error');
      this.errors = errors;
    }
  }
  
  /**
   * Not found error
   */
  export class NotFoundError extends AppError {
    resource?: string;
    
    constructor(message: string, resource?: string) {
      super(message, 404, 'not_found');
      this.resource = resource;
    }
  }
  
  /**
   * Unauthorized error
   */
  export class UnauthorizedError extends AppError {
    constructor(message: string) {
      super(message, 401, 'unauthorized');
    }
  }
  
  /**
   * Forbidden error
   */
  export class ForbiddenError extends AppError {
    constructor(message: string) {
      super(message, 403, 'forbidden');
    }
  }
  
  /**
   * Error response structure
   */
  export interface ErrorResponse {
    /**
     * Success status (always false for errors)
     */
    success: false;
    
    /**
     * Error message
     */
    message: string;
    
    /**
     * HTTP status code
     */
    statusCode: number;
    
    /**
     * Application-specific error code
     */
    errorCode: string;
    
    /**
     * Validation errors (if applicable)
     */
    errors?: string[];
    
    /**
     * Timestamp when the error occurred
     */
    timestamp: string;
    
    /**
     * Request path (if available)
     */
    path?: string;
    
    /**
     * Additional error details (omitted in production)
     */
    details?: any;
    
    /**
     * Stack trace (omitted in production)
     */
    stack?: string;
  }