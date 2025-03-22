/**
 * Error Handler
 * 
 * Provides standardized error handling across the application with custom error classes
 * and error response formatting utilities. Ensures consistent error handling patterns and
 * proper error propagation.
 */
import { Request, Response, NextFunction } from 'express';
import logger from './logger.js';

/**
 * Base application error with additional metadata
 */
export class AppError extends Error {
  /** HTTP status code */
  statusCode: number;
  
  /** Whether the error is operational or programming */
  isOperational: boolean;
  
  /** Additional error details */
  details?: any;
  
  /** Error timestamp */
  timestamp: Date;
  
  /**
   * Creates a new application error
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param details - Additional error details
   */
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    this.timestamp = new Date();
    
    // Fix prototype chain for proper 'instanceof' behavior
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for data validation failures
 */
export class ValidationError extends AppError {
  /** Validation errors */
  errors: string[];
  
  /**
   * Creates a new validation error
   * @param message - Error message
   * @param errors - Validation errors
   * @param details - Additional error details
   */
  constructor(message: string, errors: string[] = [], details?: any) {
    super(message, 400, details);
    this.name = this.constructor.name;
    this.errors = errors;
    
    // Fix prototype chain
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error for resource lookups
 */
export class NotFoundError extends AppError {
  /** Resource name */
  resource: string;
  
  /**
   * Creates a new not found error
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string, details?: any) {
    super(message, 404, details);
    this.name = this.constructor.name;
    this.resource = details?.entityType || 'Resource';
    
    // Fix prototype chain
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Unauthorized error for authentication failures
 */
export class UnauthorizedError extends AppError {
  /**
   * Creates a new unauthorized error
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string = 'Unauthorized access', details?: any) {
    super(message, 401, details);
    this.name = this.constructor.name;
    
    // Fix prototype chain
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden error for authorization failures
 */
export class ForbiddenError extends AppError {
  /**
   * Creates a new forbidden error
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string = 'Forbidden access', details?: any) {
    super(message, 403, details);
    this.name = this.constructor.name;
    
    // Fix prototype chain
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Database error for database operation failures
 */
export class DatabaseError extends AppError {
  /**
   * Creates a new database error
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, details);
    this.name = this.constructor.name;
    
    // Fix prototype chain
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Service unavailable error for temporary service outages
 */
export class ServiceUnavailableError extends AppError {
  /**
   * Creates a new service unavailable error
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 503, details);
    this.name = this.constructor.name;
    
    // Fix prototype chain
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends AppError {
  /**
   * Creates a new conflict error
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, details);
    this.name = this.constructor.name;
    
    // Fix prototype chain
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Bad request error for malformed requests
 */
export class BadRequestError extends AppError {
  /**
   * Creates a new bad request error
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, details);
    this.name = this.constructor.name;
    
    // Fix prototype chain
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * Too many requests error for rate limiting
 */
export class TooManyRequestsError extends AppError {
  /**
   * Creates a new too many requests error
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 429, details);
    this.name = this.constructor.name;
    
    // Fix prototype chain
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
  timestamp: string;
  details?: any;
  stack?: string;
}

/**
 * Create a standardized error response object
 * @param error - Error instance
 * @param includeStack - Whether to include stack trace
 * @returns Standardized error response object
 */
export const createErrorResponse = (error: Error, includeStack: boolean = false): ErrorResponse => {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error.message || 'An unexpected error occurred';
  
  const response: ErrorResponse = {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };
  
  if (error instanceof ValidationError) {
    response.errors = error.errors;
  }
  
  if (error instanceof AppError && error.details) {
    // Filter sensitive information in production
    response.details = isProduction 
      ? filterSensitiveData(error.details)
      : error.details;
  }
  
  // Include stack trace in development or when explicitly requested
  if ((!isProduction || includeStack) && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
};

/**
 * Filter sensitive data from error details
 * @param data - Data to filter
 * @returns Filtered data
 */
const filterSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Filter sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'Authorization', 'auth'];
  
  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item));
  }
  
  const filtered: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      filtered[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }
  
  return filtered;
};

/**
 * Type for async handler function
 */
type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Higher-order function to wrap async route handlers
 * Automatically catches errors and passes them to the next middleware
 * @param fn - Async function to wrap
 * @returns Wrapped function that handles errors
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return function(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 * Handles all unhandled errors from routes and controllers
 * Formats and sends standardized error responses
 * @param err - Error to handle
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default to 500 if not an AppError
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'An unexpected error occurred';
  
  // Log the error with appropriate level based on status code
  const timestamp = new Date().toISOString();
  if (statusCode >= 500) {
    logger.error(`[${timestamp}] ${statusCode} ${message}`, {
      error: err, 
      path: req.path, 
      method: req.method, 
      ip: req.ip, 
      userId: (req as any).user?.id 
    });
  } else if (statusCode >= 400) {
    logger.warn(`[${timestamp}] ${statusCode} ${message}`, {
      path: req.path, 
      method: req.method
    });
  }
  
  // Generate standardized error response
  const errorResponse = createErrorResponse(
    err, 
    process.env.NODE_ENV !== 'production'
  );
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Handles routes that don't match any defined routes
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError,
  ServiceUnavailableError,
  ConflictError,
  BadRequestError,
  TooManyRequestsError,
  createErrorResponse,
  asyncHandler,
  errorHandler,
  notFoundHandler
};