import { 
  IErrorHandler, 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  BadRequestError,
  ErrorResponse 
} from '@/types/interfaces/IErrorHandler';
import { ILoggingService } from '@/types/interfaces/ILoggingService';

/**
 * Error Handler implementation
 * Handles application errors and provides error creation utilities
 */
export class ErrorHandler implements IErrorHandler {
  /**
   * Creates a new ErrorHandler instance
   * 
   * @param logger - Logging service
   * @param showStackTraces - Whether to include stack traces in errors (non-production)
   */
  constructor(
    private readonly logger: ILoggingService,
    private readonly showStackTraces: boolean = process.env.NODE_ENV !== 'production'
  ) {}

  /**
   * Create a general error
   * 
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @returns AppError
   */
  createError(message: string, statusCode: number = 500, code: string = 'server_error', details?: any): AppError {
    const error = new AppError(message, statusCode, code, details);
    
    // Log error creation
    this.logger.debug('Created application error', {
      type: error.constructor.name,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code
    });
    
    return error;
  }

  /**
   * Create a validation error
   * 
   * @param message - Error message
   * @param errors - Validation errors
   * @returns ValidationError
   */
  createValidationError(message: string, errors: string[] = []): ValidationError {
    const error = new ValidationError(message, errors);
    
    // Log validation error creation
    this.logger.debug('Created validation error', {
      message: error.message,
      errors: error.errors
    });
    
    return error;
  }

  /**
   * Create a not found error
   * 
   * @param message - Error message
   * @returns NotFoundError
   */
  createNotFoundError(message: string): NotFoundError {
    return new NotFoundError(message);
  }

  /**
   * Create an unauthorized error
   * 
   * @param message - Error message
   * @returns UnauthorizedError
   */
  createUnauthorizedError(message: string = 'Authentication required'): UnauthorizedError {
    return new UnauthorizedError(message);
  }

  /**
   * Create a forbidden error
   * 
   * @param message - Error message
   * @returns ForbiddenError
   */
  createForbiddenError(message: string = 'Permission denied'): ForbiddenError {
    return new ForbiddenError(message);
  }

  /**
   * Create a conflict error
   * 
   * @param message - Error message
   * @returns ConflictError
   */
  createConflictError(message: string): ConflictError {
    return new ConflictError(message);
  }

  /**
   * Handle database errors
   * 
   * @param error - Database error
   * @returns Mapped application error
   */
  handleDatabaseError(error: any): AppError {
    // Log the database error
    this.logger.error('Database error', error);
    
    // Check for Prisma-specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const code = error.code as string;
      
      // Unique constraint violation (e.g., duplicate email)
      if (code === 'P2002') {
        const target = error.meta?.target && Array.isArray(error.meta.target) 
          ? error.meta.target.join(', ')
          : 'field';
          
        return this.createConflictError(`Duplicate value for ${target}`);
      }
      
      // Foreign key constraint violation
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
      'Database error occurred',
      500,
      'database_error',
      this.showStackTraces ? error : undefined
    );
  }

  /**
   * Map an error to appropriate type
   * 
   * @param error - Error to map
   * @returns Mapped application error
   */
  mapError(error: any): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }
    
    // Native Error object
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
      typeof error === 'string' ? error : 'An unknown error occurred',
      500,
      'server_error',
      this.showStackTraces && typeof error === 'object' ? error : undefined
    );
  }
}
