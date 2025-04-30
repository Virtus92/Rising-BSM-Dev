/**
 * Error Formatters
 * Standalone functions that wrap the formatResponse methods
 * for easier usage in API route handlers
 */
import { NextResponse } from 'next/server';
import { formatResponse } from './response-formatter';
import { SuccessResponse, ErrorResponse, PaginatedResponse } from '../types/ApiTypes';
import { AppError } from '../types/AppError';

/**
 * Format a successful response
 * 
 * @param data Response data
 * @param message Optional success message
 * @param status HTTP status code (default: 200)
 * @returns Formatted success response
 */
export function formatSuccess<T>(data: T, message?: string, status: number = 200): NextResponse<SuccessResponse<T>> {
  return formatResponse.success(data, message, status);
}

/**
 * Format an error response
 * 
 * @param error Error object or message
 * @param statusCode HTTP status code (default: 500)
 * @param errorCode Error code
 * @param details Additional error details
 * @returns Formatted error response
 */
export function formatError(
  error: string | Error | AppError, 
  statusCode: number = 500, 
  errorCode?: string, 
  details?: any
): NextResponse<ErrorResponse> {
  return formatResponse.error(error, statusCode, errorCode, details);
}

/**
 * Format a not found error response
 * 
 * @param message Error message
 * @param errorCode Error code
 * @param details Additional error details
 * @returns Formatted not found error response
 */
export function formatNotFound(
  message: string = 'Resource not found', 
  errorCode: string = 'NOT_FOUND', 
  details?: any
): NextResponse<ErrorResponse> {
  return formatResponse.notFound(message, errorCode, details);
}

/**
 * Format a validation error response
 * 
 * @param errors Validation errors object or array
 * @param message Error message
 * @param errorCode Error code
 * @returns Formatted validation error response
 */
export function formatValidationError(
  errors: Record<string, string[]> | string[] | any,
  message: string = 'Validation failed',
  errorCode: string = 'VALIDATION_ERROR'
): NextResponse<ErrorResponse> {
  return formatResponse.badRequest(message, errorCode, { errors });
}

/**
 * Format an unauthorized error response
 * 
 * @param message Error message
 * @param errorCode Error code
 * @param details Additional error details
 * @returns Formatted unauthorized error response
 */
export function formatUnauthorized(
  message: string = 'Authentication required', 
  errorCode: string = 'AUTHENTICATION_REQUIRED', 
  details?: any
): NextResponse<ErrorResponse> {
  return formatResponse.unauthorized(message, errorCode, details);
}

/**
 * Format a forbidden error response
 * 
 * @param message Error message
 * @param errorCode Error code
 * @param details Additional error details
 * @returns Formatted forbidden error response
 */
export function formatForbidden(
  message: string = 'Permission denied', 
  errorCode: string = 'PERMISSION_DENIED', 
  details?: any
): NextResponse<ErrorResponse> {
  return formatResponse.forbidden(message, errorCode, details);
}

/**
 * Format a paginated response
 * 
 * @param items Array of items
 * @param total Total number of items
 * @param page Current page number
 * @param limit Items per page
 * @param message Optional message
 * @returns Formatted paginated response
 */
export function formatPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): NextResponse<SuccessResponse<PaginatedResponse<T>>> {
  return formatResponse.paginated(items, total, page, limit, message);
}
