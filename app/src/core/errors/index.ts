/**
 * Error handling exports
 * Central export point for all error handling utilities
 */

// Export error types
export * from './types/AppError';
export * from './types/ApiTypes';
export type { IErrorHandler } from './types/IErrorHandler';

// Export response formatter
export { formatResponse } from './formatting/response-formatter';

// Export individual formatter functions
export {
  formatSuccess,
  formatError,
  formatNotFound,
  formatValidationError,
  formatUnauthorized,
  formatForbidden,
  formatPaginated
} from './formatting/error-formatters';

// Export error handler implementation
export { errorHandler } from './error-handler';
export { getErrorHandler } from './error-handler';

// Export API error interceptor
export { 
  handleApiError, 
  createApiErrorInterceptor,
  ApiRequestError 
} from './api-error-interceptor';

// Alias exports for legacy code compatibility
export { AuthenticationError as UnauthorizedError } from './types/AppError';
export { PermissionError as ForbiddenError } from './types/AppError';
export { BadRequestError as ValidationError } from './types/AppError';
export type { AppError as ApiError } from './types/AppError';
export type { ValidationError as ApiValidationError } from './types/AppError';
