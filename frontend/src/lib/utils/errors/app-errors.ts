/**
 * Base application error class
 * All application errors should extend this class
 */
export class AppError extends Error {
  /**
   * HTTP status code
   */
  statusCode: number;
  
  /**
   * Error code for client-side identification
   */
  code: string;
  
  /**
   * Additional error details
   */
  details?: any;
  
  /**
   * Error constructor
   * 
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param code - Error code
   * @param details - Additional details
   */
  constructor(message: string, statusCode: number = 500, code: string = 'server_error', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  /**
   * Validation errors
   */
  errors: string[];
  
  /**
   * Error constructor
   * 
   * @param message - Error message
   * @param errors - Validation errors
   * @param details - Additional details
   */
  constructor(message: string, errors: string[] = [], details?: any) {
    super(message, 400, 'validation_error', details);
    this.errors = errors;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  /**
   * Error constructor
   * 
   * @param message - Error message
   * @param details - Additional details
   */
  constructor(message: string, details?: any) {
    super(message, 404, 'not_found', details);
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Unauthorized error
 * Used when authentication is required but not provided
 */
export class UnauthorizedError extends AppError {
  /**
   * Error constructor
   * 
   * @param message - Error message
   * @param details - Additional details
   */
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, 'unauthorized', details);
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden error
 * Used when user doesn't have permission for an action
 */
export class ForbiddenError extends AppError {
  /**
   * Error constructor
   * 
   * @param message - Error message
   * @param details - Additional details
   */
  constructor(message: string = 'Permission denied', details?: any) {
    super(message, 403, 'forbidden', details);
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Conflict error
 * Used for resource conflicts (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  /**
   * Error constructor
   * 
   * @param message - Error message
   * @param details - Additional details
   */
  constructor(message: string, details?: any) {
    super(message, 409, 'conflict', details);
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Bad request error
 * Used for malformed requests
 */
export class BadRequestError extends AppError {
  /**
   * Error constructor
   * 
   * @param message - Error message
   * @param details - Additional details
   */
  constructor(message: string, details?: any) {
    super(message, 400, 'bad_request', details);
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Service unavailable error
 * Used when a service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  /**
   * Error constructor
   * 
   * @param message - Error message
   * @param details - Additional details
   */
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 503, 'service_unavailable', details);
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}
