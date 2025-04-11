import { NextResponse } from 'next/server';
import { AppError } from '../common/error/ErrorHandler';

/**
 * Standard API response format for endpoints
 */
export interface ApiResponse<T = any> {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * Response message
   */
  message?: string;
  
  /**
   * Response data
   */
  data?: T;
  
  /**
   * Error code for error responses
   */
  errorCode?: string;
  
  /**
   * Detailed error messages
   */
  errors?: string[];
  
  /**
   * Timestamp in ISO format
   */
  timestamp: string;
}

/**
 * Format a successful response
 * 
 * @param data - Response data
 * @param message - Success message
 * @param status - HTTP status code
 * @returns Formatted response
 */
export function formatSuccess<T = any>(
  data?: T,
  message: string = 'Operation successful',
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Format an error response
 * 
 * @param error - Error object or message
 * @param defaultStatus - Default status code
 * @returns Formatted error response
 */
export function formatError(
  error: any,
  defaultStatus: number = 500
): NextResponse<ApiResponse> {
  // Determine status code and error details
  let status = defaultStatus;
  let errorCode = 'server_error';
  let message = 'An unexpected error occurred';
  let errors: string[] | undefined = undefined;
  
  if (error instanceof AppError) {
    status = error.statusCode;
    errorCode = error.errorCode;
    message = error.message;
    
    // Extract validation errors if available
    if ('errors' in error) {
      errors = (error as any).errors;
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  const response: ApiResponse = {
    success: false,
    message,
    errorCode,
    errors,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Format a not found response
 * 
 * @param message - Error message
 * @param status - HTTP status code (default: 404)
 * @returns Formatted error response
 */
export function formatNotFound(
  message: string = 'Resource not found',
  status: number = 404
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    message,
    errorCode: 'not_found',
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Format a validation error response
 * 
 * @param errors - Validation errors
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @returns Formatted error response
 */
export function formatValidationError(
  errors: string[] | string,
  message: string = 'Validation failed',
  status: number = 400
): NextResponse<ApiResponse> {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  
  const response: ApiResponse = {
    success: false,
    message,
    errorCode: 'validation_error',
    errors: errorArray,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status });
}

/**
 * Helper functions for formatting responses
 */
export const formatResponse = {
  success: formatSuccess,
  error: formatError,
  notFound: formatNotFound,
  validationError: formatValidationError
};

// Default export for simpler imports
export default formatResponse;

// Named export to match expected import in user/count/route.ts
export { formatResponse as responseFormatter };
