/**
 * Standardized API Response Formatter
 */

import { ApiResponse, ApiError } from '@/core/errors/types/api-types';

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, message: string = 'Operation successful', statusCode: number = 200): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    statusCode,
    error: undefined
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse<T>(
  message: string,
  statusCode: number = 400,
  errorCode: string = 'ERROR',
  details?: any,
  data: T | null = null
): ApiResponse<T> {
  const error: ApiError = {
    message,
    code: errorCode,
    status: statusCode,
    details
  };
  
  return {
    success: false,
    data: data as T,
    message,
    statusCode,
    error
  };
}
