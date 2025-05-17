/**
 * Base error class for application errors
 * All custom errors in the application should extend this class
 */
export class AppError extends Error {
  // Add code property as alias for errorCode for compatibility
  public readonly code: string;
  
  /**
   * Create a new AppError
   * 
   * @param message Error message
   * @param statusCode HTTP status code
   * @param errorCode Application-specific error code
   * @param details Additional error details
   */
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly errorCode: string = 'INTERNAL_ERROR',
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = errorCode; // Set code alias
    
    // Maintains proper stack trace for where error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND', details?: any) {
    super(message, 404, errorCode, details);
  }
}

/**
 * Error for authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', errorCode: string = 'AUTHENTICATION_ERROR', details?: any) {
    super(message, 401, errorCode, details);
  }
}

/**
 * Error for permission/authorization failures
 */
export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied', errorCode: string = 'PERMISSION_DENIED', details?: any) {
    super(message, 403, errorCode, details);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation error', errorCode: string = 'VALIDATION_ERROR', details?: any) {
    super(message, 400, errorCode, details);
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', errorCode: string = 'CONFLICT', details?: any) {
    super(message, 409, errorCode, details);
  }
}

/**
 * Bad request error 
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', errorCode: string = 'BAD_REQUEST', details?: any) {
    super(message, 400, errorCode, details);
  }
}

/**
 * Network or API error
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network error', errorCode: string = 'NETWORK_ERROR', details?: any) {
    super(message, 503, errorCode, details);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', errorCode: string = 'DATABASE_ERROR', details?: any) {
    super(message, 500, errorCode, details);
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends AppError {
  constructor(message: string = 'Configuration error', errorCode: string = 'CONFIG_ERROR', details?: any) {
    super(message, 500, errorCode, details);
  }
}
