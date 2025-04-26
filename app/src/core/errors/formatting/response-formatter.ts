import { NextResponse } from 'next/server';
import { AppError } from '../types';

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
  status: number | string = 200
): NextResponse<ApiResponse<T>> {
  // Convert string status to number if needed
  const statusCode = typeof status === 'string' ? parseInt(status, 10) : status;
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status: statusCode });
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
  defaultStatus: number | string = 500
): NextResponse<ApiResponse> {
  // Convert string status to number if needed
  const statusCode = typeof defaultStatus === 'string' ? parseInt(defaultStatus, 10) : defaultStatus;
  // Determine status code and error details
  let status = statusCode;
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
  
  return NextResponse.json(response, { status: statusCode });
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
  status: number | string = 404
): NextResponse<ApiResponse> {
  // Convert string status to number if needed
  const statusCode = typeof status === 'string' ? parseInt(status, 10) : status;
  const response: ApiResponse = {
    success: false,
    message,
    errorCode: 'not_found',
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Format a validation error response
 * 
 * @param errors - Validation errors as a string, array of strings, or object with field-specific errors
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @returns Formatted error response
 */
export function formatValidationError(
  errors: string[] | string | Record<string, string[]>,
  message: string = 'Validation failed',
  status: number | string = 400
): NextResponse<ApiResponse> {
  // Convert string status to number if needed
  const statusCode = typeof status === 'string' ? parseInt(status, 10) : status;
  // Handle different error formats
  let errorArray: string[] = [];
  
  if (Array.isArray(errors)) {
    errorArray = errors;
  } else if (typeof errors === 'string') {
    errorArray = [errors];
  } else if (typeof errors === 'object' && errors !== null) {
    // Handle objects with validation errors per field
    // For example: { field1: ['Error 1', 'Error 2'], field2: ['Error 3'] }
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(error => {
          errorArray.push(`${field}: ${error}`);
        });
      } else if (typeof fieldErrors === 'string') {
        errorArray.push(`${field}: ${fieldErrors}`);
      }
    });
  }
  
  const response: ApiResponse = {
    success: false,
    message,
    errorCode: 'validation_error',
    errors: errorArray,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status: statusCode });
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