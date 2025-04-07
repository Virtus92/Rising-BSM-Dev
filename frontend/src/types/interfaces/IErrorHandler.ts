/**
 * Error Handler Interface
 * Provides error handling capabilities for services and repositories
 */
export interface IErrorHandler {
  /**
   * Create a general error
   */
  createError(message: string, statusCode?: number): Error;
  
  /**
   * Create a validation error
   */
  createValidationError(message: string, errors?: string[]): Error;
  
  /**
   * Create a not found error
   */
  createNotFoundError(message: string): Error;
  
  /**
   * Create an unauthorized error
   */
  createUnauthorizedError(message: string): Error;
  
  /**
   * Create a forbidden error
   */
  createForbiddenError(message: string): Error;
  
  /**
   * Create a conflict error (e.g. duplicate)
   */
  createConflictError(message: string): Error;
  
  /**
   * Handle database errors
   */
  handleDatabaseError(error: any): Error;
  
  /**
   * Map an error to appropriate type
   */
  mapError(error: any): Error;
}
