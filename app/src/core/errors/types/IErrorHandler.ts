/**
 * Error Handler Interface
 * Interface for error handling services
 */
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './AppError';

/**
 * Error Handler Interface
 * Interface for error handling services
 */
export interface IErrorHandler {
  /**
   * Create an error
   * 
   * @param message Error message
   * @param statusCode HTTP status code
   * @param errorCode Application error code
   * @param details Additional error details
   * @returns Application error
   */
  createError(
    message: string,
    statusCode?: number,
    errorCode?: string,
    details?: any
  ): AppError;
  
  /**
   * Create a validation error
   * 
   * @param message Error message
   * @param errors Validation error details
   * @param errorCode Application error code
   * @returns Validation error
   */
  createValidationError(
    message: string,
    errors?: string[] | Record<string, string[]>,
    errorCode?: string
  ): AppError;
  
  /**
   * Create a not found error
   * 
   * @param message Error message
   * @param errorCode Application error code
   * @param details Additional error details
   * @returns Not found error
   */
  createNotFoundError(
    message: string,
    errorCode?: string,
    details?: any
  ): AppError;
  
  /**
   * Create an unauthorized error
   * 
   * @param message Error message
   * @param errorCode Application error code
   * @param details Additional error details
   * @returns Unauthorized error
   */
  createUnauthorizedError(
    message: string,
    errorCode?: string,
    details?: any
  ): AppError;
  
  /**
   * Create a forbidden error
   * 
   * @param message Error message
   * @param errorCode Application error code
   * @param details Additional error details
   * @returns Forbidden error
   */
  createForbiddenError(
    message: string,
    errorCode?: string,
    details?: any
  ): AppError;
  
  /**
   * Create a conflict error
   * 
   * @param message Error message
   * @param errorCode Application error code
   * @param details Additional error details
   * @returns Conflict error
   */
  createConflictError(
    message: string,
    errorCode?: string,
    details?: any
  ): AppError;
  
  /**
   * Create a bad request error
   * 
   * @param message Error message
   * @param errorCode Application error code
   * @param details Additional error details
   * @returns Bad request error
   */
  createBadRequestError(
    message: string,
    errorCode?: string,
    details?: any
  ): AppError;
  
  /**
   * Handle an API error
   * 
   * @param error Error object
   * @param request Request object
   * @returns Formatted error response
   */
  handleApiError(
    error: unknown,
    request?: NextRequest
  ): NextResponse<any>;
  
  /**
   * Handle a database error
   * 
   * @param error Error object
   * @returns Mapped error
   */
  handleDatabaseError(
    error: unknown
  ): Error;
  
  /**
   * Map a generic error to an application error
   * 
   * @param error Error object
   * @returns Mapped error
   */
  mapError(
    error: unknown
  ): Error;
}
