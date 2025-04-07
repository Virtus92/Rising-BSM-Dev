/**
 * Error Handler Interface
 * Provides error handling capabilities for services and repositories
 */

/**
 * Base application error
 */
export class AppError extends Error {
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Application error code
   */
  errorCode: string;
  
  /**
   * Additional error details
   */
  details?: any;
  
  /**
   * Constructor
   */
  constructor(message: string, statusCode = 500, errorCode = 'internal_error', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
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
   */
  constructor(message: string, errors: string[] = []) {
    super(message, 400, 'validation_error');
    this.errors = errors;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  /**
   * Constructor
   */
  constructor(message: string, resource?: string) {
    super(message, 404, 'not_found', { resource });
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  /**
   * Constructor
   */
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'unauthorized');
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  /**
   * Constructor
   */
  constructor(message: string = 'Permission denied') {
    super(message, 403, 'forbidden');
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  /**
   * Constructor
   */
  constructor(message: string) {
    super(message, 409, 'conflict');
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Bad request error
 */
export class BadRequestError extends AppError {
  /**
   * Constructor
   */
  constructor(message: string) {
    super(message, 400, 'bad_request');
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: boolean;
  errors: Array<{
    message: string;
    statusCode: number;
    validationErrors?: string[];
    stack?: string;
  }>;
}

/**
 * Error Handler Interface
 */
export interface IErrorHandler {
  /**
   * Create a general error
   */
  createError(message: string, statusCode?: number, errorCode?: string, details?: any): AppError;
  
  /**
   * Create a validation error
   */
  createValidationError(message: string, errors?: string[]): ValidationError;
  
  /**
   * Create a not found error
   */
  createNotFoundError(message: string, resource?: string): NotFoundError;
  
  /**
   * Create an unauthorized error
   */
  createUnauthorizedError(message: string): UnauthorizedError;
  
  /**
   * Create a forbidden error
   */
  createForbiddenError(message: string): ForbiddenError;
  
  /**
   * Create a conflict error (e.g. duplicate)
   */
  createConflictError(message: string): ConflictError;
  
  /**
   * Create a bad request error
   */
  createBadRequestError(message: string): BadRequestError;
  
  /**
   * Handle database errors
   */
  handleDatabaseError(error: any): AppError;
  
  /**
   * Map an error to appropriate type
   */
  mapError(error: any): AppError;
  
  /**
   * Handle an error and format as response
   */
  handleError(error: any, req?: any, res?: any): ErrorResponse;
  
  /**
   * Format an error for API response
   */
  formatError(error: any): ErrorResponse;
}
