import { 
  IErrorHandler, 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError,
  ErrorResponse,
  BadRequestError,
  ConflictError
} from '../../types/interfaces/IErrorHandler.js';
import { ILoggingService } from '../../types/interfaces/ILoggingService.js';

/**
 * ErrorHandler
 * 
 * Implementation of IErrorHandler that provides standardized error handling.
 * Transforms various error types into consistent API responses.
 */
export class ErrorHandler implements IErrorHandler {
  /**
   * Creates a new ErrorHandler instance
   * 
   * @param logger - Logging service
   * @param showStackTraces - Whether to include stack traces in error responses (defaults to false in production)
   */
  constructor(
    private readonly logger: ILoggingService,
    private readonly showStackTraces: boolean = process.env.NODE_ENV !== 'production'
  ) {}

  /**
   * Create a conflict error for resource conflicts
   * 
   * @param message - Error message
   * @returns ConflictError instance
   */
  createConflictError(message: string): ConflictError {
    return new ConflictError(message);
  }

  /**
   * Create a bad request error for invalid input
   * 
   * @param message - Error message
   * @returns BadRequestError instance
   */
  createBadRequestError(message: string): BadRequestError {
    return new BadRequestError(message);
  }

  /**
   * Handle database-specific errors and convert to appropriate AppError types
   * 
   * @param error - Database error
   * @returns Mapped AppError
   */
  handleDatabaseError(error: any): AppError {
    // Check for common database error patterns
    const errorMessage = error.message || 'Database error occurred';
    
    // Duplicate key/unique constraint violation
    if (
      error.code === '23505' || // PostgreSQL unique violation
      error.errno === 1062 ||   // MySQL duplicate entry
      errorMessage.includes('duplicate key') ||
      errorMessage.includes('unique constraint')
    ) {
      return this.createConflictError('Resource already exists');
    }
    
    // Foreign key constraint failure
    if (
      error.code === '23503' || // PostgreSQL foreign key violation
      error.errno === 1452 ||   // MySQL foreign key constraint fails
      errorMessage.includes('foreign key constraint')
    ) {
      return this.createBadRequestError('Referenced resource does not exist');
    }
    
    // Default to internal server error
    this.logger.error('Unhandled database error', error);
    return this.createError(
      'A database error occurred',
      500,
      'database_error',
      this.showStackTraces ? error : undefined
    );
  }

  /**
   * Map any error to an appropriate AppError
   * 
   * @param error - Any error object
   * @returns Mapped AppError
   */
  mapError(error: any): AppError {
    // Already an AppError - return as is
    if (error instanceof AppError) {
      return error;
    }
    
    // Handle database errors
    if (
      error.code?.startsWith('23') || // PostgreSQL error codes
      error.errno || // MySQL error numbers
      error.name === 'SequelizeError' ||
      error.name === 'MongoError'
    ) {
      return this.handleDatabaseError(error);
    }
    
    // Handle HTTP-like errors with status codes
    if (error.statusCode || error.status) {
      const statusCode = error.statusCode || error.status;
      const message = error.message || 'An error occurred';
      const errorCode = error.code || `error_${statusCode}`;
      
      return this.createError(message, statusCode, errorCode, error.details);
    }
    
    // Default case: wrap in a generic AppError
    return this.createError(
      error.message || 'An unexpected error occurred',
      500,
      'internal_error',
      this.showStackTraces ? error : undefined
    );
  }
  
    /**
     * Handle an error and generate an appropriate response
     * 
     * @param error - Error object
     * @param req - HTTP request object (optional)
     * @param res - HTTP response object (optional)
     * @returns Formatted error response
     */
    public handleError(error: any, req?: any, res?: any): ErrorResponse {
      // Log the error
      this.logError(error, req);
      
      // Format the error for API response
      const errorResponse = this.formatError(error);
      
      // Add request path if available
      if (req?.path || req?.originalUrl) {
        errorResponse.path = req.path || req.originalUrl;
      }
      
      // If response object is provided, send the response
      if (res && typeof res.status === 'function') {
        res.status(errorResponse.statusCode).json(errorResponse);
      }
      
      return errorResponse;
    }
  
    /**
     * Create a new application error
     * 
     * @param message - Error message
     * @param statusCode - HTTP status code
     * @param errorCode - Application-specific error code
     * @param details - Additional error details
     * @returns Application error
     */
    public createError(
      message: string, 
      statusCode: number = 500, 
      errorCode: string = 'internal_error', 
      details?: any
    ): AppError {
      return new AppError(message, statusCode, errorCode, details);
    }
  
    /**
     * Format an error for API response
     * 
     * @param error - Error object
     * @returns Formatted error response
     */
    public formatError(error: any): ErrorResponse {
      const timestamp = new Date().toISOString();
      
      // Default error response
      const response: ErrorResponse = {
        success: false,
        message: 'An unexpected error occurred',
        statusCode: 500,
        errorCode: 'internal_error',
        timestamp
      };
      
      // Handle AppError and its subclasses
      if (error instanceof AppError) {
        response.message = error.message;
        response.statusCode = error.statusCode;
        response.errorCode = error.errorCode;
        
        // Add validation errors if available
        if (error instanceof ValidationError && error.errors?.length > 0) {
          response.errors = error.errors;
        }
        
        // Add stack trace in development/testing
        if (this.showStackTraces) {
          response.stack = error.stack;
          response.details = error.details;
        }
        
        return response;
      }
      
      // Handle standard errors
      if (error instanceof Error) {
        response.message = error.message;
        
        // Add stack trace in development/testing
        if (this.showStackTraces) {
          response.stack = error.stack;
        }
        
        return response;
      }
      
      // Handle string errors
      if (typeof error === 'string') {
        response.message = error;
        return response;
      }
      
      // Handle other error types
      if (error && typeof error === 'object') {
        if (error.message) {
          response.message = error.message;
        }
        
        if (error.statusCode) {
          response.statusCode = error.statusCode;
        }
        
        if (error.code) {
          response.errorCode = error.code;
        }
        
        // Add stack trace in development/testing
        if (this.showStackTraces && error.stack) {
          response.stack = error.stack;
        }
      }
      
      return response;
    }
  
    /**
     * Create a validation error
     * 
     * @param message - Error message
     * @param errors - Validation errors
     * @returns Validation error
     */
    public createValidationError(message: string, errors: string[]): ValidationError {
      return new ValidationError(message, errors);
    }
  
    /**
     * Create a not found error
     * 
     * @param message - Error message
     * @param resource - Resource that was not found
     * @returns Not found error
     */
    public createNotFoundError(message: string, resource?: string): NotFoundError {
      return new NotFoundError(message, resource);
    }
  
    /**
     * Create an unauthorized error
     * 
     * @param message - Error message
     * @returns Unauthorized error
     */
    public createUnauthorizedError(message: string): UnauthorizedError {
      return new UnauthorizedError(message);
    }
  
    /**
     * Create a forbidden error
     * 
     * @param message - Error message
     * @returns Forbidden error
     */
    public createForbiddenError(message: string): ForbiddenError {
      return new ForbiddenError(message);
    }
  
    /**
     * Log an error
     * 
     * @param error - Error object
     * @param req - HTTP request object (optional)
     */
    public logError(error: any, req?: any): void {
      // Prepare metadata for logging
      const metadata: Record<string, any> = {};
      
      // Add request information if available
      if (req) {
        metadata.method = req.method;
        metadata.path = req.path || req.originalUrl;
        metadata.query = req.query;
        metadata.ip = req.ip || req.headers?.['x-forwarded-for'];
        metadata.userId = req.user?.id;
      }
      
      // Determine appropriate error message
      let message = 'An error occurred';
      
      if (error instanceof AppError) {
        message = `${error.statusCode} ${error.errorCode}: ${error.message}`;
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      
      // Log at appropriate level based on status code
      const statusCode = (error instanceof AppError) 
        ? error.statusCode 
        : (error.statusCode || 500);
      
      if (statusCode >= 500) {
        this.logger.error(message, error, metadata);
      } else if (statusCode >= 400) {
        this.logger.warn(message, metadata);
      } else {
        this.logger.info(message, metadata);
      }
    }
  }