import { 
  IErrorHandler, 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError,
  ErrorResponse 
} from '../../../src/interfaces/IErrorHandler.js';

/**
 * Mock implementation of IErrorHandler for testing
 */
export class MockErrorHandler implements IErrorHandler {
  public errors: Record<string, any[]> = {
    handleError: [],
    createError: [],
    createValidationError: [],
    createNotFoundError: [],
    createUnauthorizedError: [],
    createForbiddenError: [],
    logError: []
  };

  constructor(
    private readonly showStackTraces: boolean = true
  ) {}

  public handleError(error: any, req?: any, res?: any): ErrorResponse {
    this.errors.handleError.push({ error, req, res });
    
    // Create a basic error response
    const response: ErrorResponse = {
      success: false,
      message: error.message || 'An error occurred',
      statusCode: error.statusCode || 500,
      errorCode: error.errorCode || 'internal_error',
      timestamp: new Date().toISOString()
    };
    
    // If response object is provided, send the response
    if (res && typeof res.status === 'function') {
      res.status(response.statusCode).json(response);
    }
    
    return response;
  }

  public createError(
    message: string, 
    statusCode: number = 500, 
    errorCode: string = 'internal_error', 
    details?: any
  ): AppError {
    this.errors.createError.push({ message, statusCode, errorCode, details });
    return new AppError(message, statusCode, errorCode, details);
  }

  public createValidationError(message: string, errors: string[]): ValidationError {
    this.errors.createValidationError.push({ message, errors });
    return new ValidationError(message, errors);
  }

  public createNotFoundError(message: string, resource?: string): NotFoundError {
    this.errors.createNotFoundError.push({ message, resource });
    return new NotFoundError(message, resource);
  }

  public createUnauthorizedError(message: string): UnauthorizedError {
    this.errors.createUnauthorizedError.push({ message });
    return new UnauthorizedError(message);
  }

  public createForbiddenError(message: string): ForbiddenError {
    this.errors.createForbiddenError.push({ message });
    return new ForbiddenError(message);
  }

  public formatError(error: any): ErrorResponse {
    // Basic formatting for tests
    return {
      success: false,
      message: error.message || 'An error occurred',
      statusCode: error.statusCode || 500,
      errorCode: error.errorCode || 'internal_error',
      timestamp: new Date().toISOString(),
      ...(this.showStackTraces && error.stack ? { stack: error.stack } : {})
    };
  }

  public logError(error: any, req?: any): void {
    this.errors.logError.push({ error, req });
  }

  // Helper method to clear errors
  public clearErrors(): void {
    Object.keys(this.errors).forEach(key => {
      this.errors[key as keyof typeof this.errors] = [];
    });
  }
}

/**
 * Factory to create a mock error handler instance
 */
export function createMockErrorHandler(): MockErrorHandler {
  return new MockErrorHandler();
}
