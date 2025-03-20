/**
 * API Response Utilities
 * Standardized response formats for the API
 */
import { Response } from 'express';
import { ErrorResponse } from './errors';

/**
 * Pagination metadata structure
 */
export interface PaginationMeta {
  current: number;
  total: number;
  limit: number;
  totalRecords: number;
}

/**
 * Response metadata structure
 */
export interface ResponseMeta {
  pagination?: PaginationMeta;
  timestamp: string;
  [key: string]: any;
}

/**
 * Success response structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta: ResponseMeta;
}

/**
 * Create and send a success response
 * @param res Express response object
 * @param data Response data
 * @param message Optional success message
 * @param statusCode HTTP status code (default: 200)
 * @param meta Additional metadata
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta: Omit<ResponseMeta, 'timestamp'> = {}
): Response => {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
    meta: {
      ...meta,
      timestamp: new Date().toISOString()
    }
  };

  return res.status(statusCode).json(response);
};

/**
 * Create and send an error response
 * @param res Express response object
 * @param error Error message or object
 * @param statusCode HTTP status code (default: 400)
 * @param errors Optional array of specific error messages
 * @param meta Additional metadata
 */
export const sendError = (
  res: Response,
  error: string | Error,
  statusCode: number = 400,
  errors?: string[],
  meta: Record<string, any> = {}
): Response => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: typeof error === 'string' ? error : error.message,
    statusCode,
    errors,
    details: meta,
    stack: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : undefined) : undefined
  };

  return res.status(statusCode).json(errorResponse);
};

/**
 * Create and send a paginated response
 * @param res Express response object
 * @param data Array of items
 * @param pagination Pagination metadata
 * @param message Optional success message
 * @param statusCode HTTP status code (default: 200)
 * @param meta Additional metadata
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message?: string,
  statusCode: number = 200,
  meta: Record<string, any> = {}
): Response => {
  return sendSuccess(
    res,
    data,
    message,
    statusCode,
    {
      ...meta,
      pagination
    }
  );
};

/**
 * Send a created response (HTTP 201)
 * @param res Express response object
 * @param data Response data
 * @param message Optional success message
 * @param meta Additional metadata
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully',
  meta: Record<string, any> = {}
): Response => {
  return sendSuccess(res, data, message, 201, meta);
};

/**
 * Send a no content response (HTTP 204)
 * @param res Express response object
 */
export const sendNoContent = (res: Response): Response => {
  return res.status(204).end();
};