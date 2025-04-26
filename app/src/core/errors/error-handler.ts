import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  BadRequestError,
  ErrorResponse
} from './types';

// Define Logger interface to avoid circular dependencies
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Interface for the ErrorHandler
 */
export interface IErrorHandler {
  /**
   * Creates a general error
   * 
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param code - Application-specific error code
   * @param details - Error details
   */
  createError(message: string, statusCode?: number, code?: string, details?: any): AppError;
  
  /**
   * Creates a validation error
   * 
   * @param message - Error message
   * @param errors - Validation errors
   */
  createValidationError(message: string, errors?: string[]): ValidationError;
  
  /**
   * Creates a not found error
   * 
   * @param message - Error message
   * @param resource - Resource that was not found
   */
  createNotFoundError(message: string, resource?: string): NotFoundError;
  
  /**
   * Creates an unauthorized error
   * 
   * @param message - Error message
   */
  createUnauthorizedError(message?: string): UnauthorizedError;
  
  /**
   * Creates a forbidden error
   * 
   * @param message - Error message
   */
  createForbiddenError(message?: string): ForbiddenError;
  
  /**
   * Creates a conflict error
   * 
   * @param message - Error message
   */
  createConflictError(message: string): ConflictError;
  
  /**
   * Creates a bad request error
   * 
   * @param message - Error message
   */
  createBadRequestError(message: string): BadRequestError;
  
  /**
   * Creates a database error
   * 
   * @param message - Error message
   * @param code - Database error code
   * @param details - Error details
   */
  createDatabaseError(message: string, code?: string, details?: any): AppError;

  /**
   * Handles a database error
   * 
   * @param error - Database error
   */
  handleDatabaseError(error: any): AppError;
  
  /**
   * Maps an error to an AppError
   * 
   * @param error - Error
   */
  mapError(error: any): AppError;
  
  /**
   * Handles an error
   * 
   * @param error - Error
   * @param req - HTTP request
   */
  handleError(error: any, req?: any): ErrorResponse;
  
  /**
   * Formats an error
   * 
   * @param error - Error
   */
  formatError(error: any): ErrorResponse;
}

/**
 * Implementation of the ErrorHandler
 */
export class ErrorHandler implements IErrorHandler {
  /**
   * Constructor
   * 
   * @param logger - Logging service
   * @param showStackTraces - Whether to show stack traces
   */
  constructor(
    private readonly logger: Logger,
    private readonly showStackTraces: boolean = process.env.NODE_ENV !== 'production'
  ) {}
  
  /**
   * Creates a bad request error
   * 
   * @param message - Error message
   */
  createBadRequestError(message: string): BadRequestError {
    return new BadRequestError(message);
  }
  
  /**
   * Creates a general error
   * 
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param code - Application-specific error code
   * @param details - Error details
   */
  createError(message: string, statusCode: number = 500, code: string = 'server_error', details?: any): AppError {
    const error = new AppError(message, statusCode, code, details);
    
    // Log error creation - using info instead of debug to avoid issues
    this.logger.info('Created application error', {
      type: error.constructor.name,
      message: error.message,
      statusCode: error.statusCode
    });
    
    return error;
  }
  
  /**
   * Creates a validation error
   * 
   * @param message - Error message
   * @param errors - Validation errors
   */
  createValidationError(message: string, errors: string[] = []): ValidationError {
    const error = new ValidationError(message, errors);
    
    // Log error creation - using info instead of debug to avoid issues
    this.logger.info('Created validation error', {
      message: error.message,
      errors: error.errors
    });
    
    return error;
  }
  
  /**
   * Creates a not found error
   * 
   * @param message - Error message
   * @param resource - Resource that was not found
   */
  createNotFoundError(message: string, resource?: string): NotFoundError {
    return new NotFoundError(message, resource);
  }
  
  /**
   * Creates an unauthorized error
   * 
   * @param message - Error message
   */
  createUnauthorizedError(message: string = 'Authentication required'): UnauthorizedError {
    return new UnauthorizedError(message);
  }
  
  /**
   * Creates a forbidden error
   * 
   * @param message - Error message
   */
  createForbiddenError(message: string = 'Permission denied'): ForbiddenError {
    return new ForbiddenError(message);
  }
  
  /**
   * Creates a conflict error
   * 
   * @param message - Error message
   */
  createConflictError(message: string): ConflictError {
    return new ConflictError(message);
  }
  
  /**
   * Creates a database error
   * 
   * @param message - Error message
   * @param code - Database error code
   * @param details - Error details
   */
  createDatabaseError(message: string, code: string = 'database_error', details?: any): AppError {
    return this.createError(message, 500, code, details);
  }
  
  /**
   * Handles an error
   * 
   * @param error - Error
   * @param req - HTTP request
   */
  handleError(error: any, req?: any): ErrorResponse {
    // Map the error to an AppError
    const appError = this.mapError(error);
    
    // Log the error with context
    const logContext = {
      statusCode: appError.statusCode,
      path: req?.path || 'unknown',
      method: req?.method || 'unknown',
      ...(this.showStackTraces && appError.stack ? { stack: appError.stack } : {})
    };
    
    this.logger.error(appError.message, logContext);
    
    // Format and return the error response
    return this.formatError(appError);
  }
  
  /**
   * Formats an error
   * 
   * @param error - Error
   */
  formatError(error: any): ErrorResponse {
    const appError = error instanceof AppError ? error : this.mapError(error);
    
    const timestamp = new Date().toISOString();
    
    // Standard error response
    const response: ErrorResponse = {
      success: false,
      message: appError.message,
      statusCode: appError.statusCode,
      errorCode: appError.errorCode,
      timestamp,
      errors: [{
        message: appError.message,
        statusCode: appError.statusCode,
        ...(appError instanceof ValidationError ? { validationErrors: appError.errors } : {}),
        ...(this.showStackTraces && appError.stack ? { stack: appError.stack } : {})
      }]
    };
    
    return response;
  }
  
  /**
   * Maps an error to an AppError
   * 
   * @param error - Error
   */
  mapError(error: any): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }
    
    // Handle API request errors
    if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
      const apiError = error as { statusCode: number; message: string; errors?: string[] };
      
      switch (apiError.statusCode) {
        case 400:
          return this.createBadRequestError(apiError.message);
        case 401:
          return this.createUnauthorizedError(apiError.message);
        case 403:
          return this.createForbiddenError(apiError.message);
        case 404:
          return this.createNotFoundError(apiError.message);
        case 409:
          return this.createConflictError(apiError.message);
        case 422:
          return this.createValidationError(apiError.message, apiError.errors);
        default:
          return this.createError(
            apiError.message,
            apiError.statusCode || 500,
            'api_error',
            this.showStackTraces ? { errors: apiError.errors } : undefined
          );
      }
    }
    
    // Native Error
    if (error instanceof Error) {
      return this.createError(
        error.message,
        500,
        'server_error',
        this.showStackTraces ? { stack: error.stack } : undefined
      );
    }
    
    // Other values
    return this.createError(
      typeof error === 'string' ? error : 'An unexpected error occurred',
      500,
      'server_error',
      this.showStackTraces && typeof error === 'object' ? error : undefined
    );
  }
  
  /**
   * Handles a database error
   * 
   * @param error - Database error
   */
  handleDatabaseError(error: any): AppError {
    // Log the database error
    this.logger.error('Database error', { error });
    
    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const code = error.code as string;
      
      // Uniqueness violated (e.g. duplicate email)
      if (code === 'P2002') {
        const target = error.meta?.target && Array.isArray(error.meta.target) 
          ? error.meta.target.join(', ')
          : 'field';
          
        return this.createConflictError(`Duplicate value for ${target}`);
      }
      
      // Foreign key constraint violated
      if (code === 'P2003') {
        return this.createConflictError('Cannot delete record due to existing references');
      }
      
      // Record not found
      if (code === 'P2001' || code === 'P2025') {
        return this.createNotFoundError('Record not found');
      }
    }
    
    // General database error
    return this.createError(
      'A database error occurred',
      500,
      'database_error',
      this.showStackTraces ? error : undefined
    );
  }
}
