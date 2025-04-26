/**
 * Interface for error responses
 */
export interface ErrorResponse {
  /**
   * Success indicator (always false)
   */
  success: boolean;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * HTTP status code
   */
  statusCode?: number;
  
  /**
   * Application-specific error code
   */
  errorCode?: string;
  
  /**
   * Detailed error information
   */
  errors?: Array<{
    /**
     * Error message
     */
    message: string;
    
    /**
     * Status code
     */
    statusCode?: number;
    
    /**
     * Validation errors
     */
    validationErrors?: string[];
    
    /**
     * Stack trace
     */
    stack?: string;
  }>;
  
  /**
   * Timestamp
   */
  timestamp?: string;
}

/**
 * Base class for application errors
 */
export class AppError extends Error {
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Application-specific error code
   */
  errorCode: string;
  
  /**
   * Error details
   */
  details?: any;
  
  /**
   * Constructor
   * 
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param errorCode - Application-specific error code
   * @param details - Error details
   */
  constructor(message: string, statusCode: number = 500, errorCode: string = 'server_error', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    
    // Restore prototype chain in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  /**
   * Validation errors
   */
  errors: string[];
  
  /**
   * Constructor
   * 
   * @param message - Error message
   * @param errors - Validation errors
   */
  constructor(message: string, errors: string[] = []) {
    super(message, 422, 'validation_error');
    this.errors = errors;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  /**
   * Constructor
   * 
   * @param message - Error message
   * @param resource - Resource that was not found
   */
  constructor(message: string, resource?: string) {
    super(
      resource ? `${resource} not found: ${message}` : message,
      404,
      'not_found'
    );
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  /**
   * Constructor
   * 
   * @param message - Error message
   */
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'unauthorized');
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  /**
   * Constructor
   * 
   * @param message - Error message
   */
  constructor(message: string = 'Permission denied') {
    super(message, 403, 'forbidden');
  }
}

/**
 * Conflict error (e.g. database uniqueness violation)
 */
export class ConflictError extends AppError {
  /**
   * Constructor
   * 
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, 409, 'conflict');
  }
}

/**
 * Bad request error
 */
export class BadRequestError extends AppError {
  /**
   * Constructor
   * 
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, 400, 'bad_request');
  }
}
