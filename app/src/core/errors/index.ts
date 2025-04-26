// Export all error types and utilities
export * from './types';
export * from './error-handler';
export * from './api-error-interceptor';
export * from './formatting';

// Re-export formatResponse directly for convenience
export { formatResponse } from './formatting/response-formatter';

// Re-export common errors directly for convenience
export {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError
} from './types';

// Add a backward compatibility alias for the error interceptor
export { createApiErrorInterceptor as createErrorInterceptor } from './api-error-interceptor';

// Add type exports with proper 'export type' syntax for isolatedModules compatibility
export type { ApiResponse, ApiError, ApiRequestError, ApiValidationError } from './types';
export type { IErrorHandler } from './error-handler';
export type { ApiErrorInterceptorConfig, IErrorInterceptor } from './api-error-interceptor';

// Import ErrorHandler class
import { ErrorHandler } from './error-handler';
import { getLogger } from '../logging';

// Singleton instance
let errorHandler: ErrorHandler;

/**
 * Returns a singleton instance of ErrorHandler
 */
export function getErrorHandler(): ErrorHandler {
  if (!errorHandler) {
    errorHandler = new ErrorHandler(getLogger());
  }
  return errorHandler;
}
