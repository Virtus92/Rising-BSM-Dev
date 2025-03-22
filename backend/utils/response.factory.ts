/**
 * Response Factory
 * 
 * Provides standardized API response formatting across the application.
 * Ensures consistency in response structure, status codes, and metadata.
 */
import { Response } from 'express';
import { PaginationResult } from '../types/controller.types.js';

/**
 * Success response interface
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta: ResponseMeta;
}

/**
 * Response metadata interface
 */
export interface ResponseMeta {
  timestamp: string;
  pagination?: PaginationResult;
  [key: string]: any;
}

/**
 * Factory class for generating standardized API responses
 */
export class ResponseFactory {
  /**
   * Send a success response
   * @param res - Express response object
   * @param data - Response data
   * @param message - Optional success message
   * @param statusCode - HTTP status code (default: 200)
   * @param meta - Additional metadata
   * @returns Express response
   */
  static success<T>(
    res: Response, 
    data: T, 
    message?: string,
    statusCode: number = 200,
    meta: Record<string, any> = {}
  ): Response {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };

    return res.status(statusCode).json(response);
  }
  
  /**
   * Send a paginated response
   * @param res - Express response object
   * @param data - Response data array
   * @param pagination - Pagination metadata
   * @param message - Optional success message
   * @param statusCode - HTTP status code (default: 200)
   * @param meta - Additional metadata
   * @returns Express response
   */
  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: PaginationResult, 
    message?: string,
    statusCode: number = 200,
    meta: Record<string, any> = {}
  ): Response {
    return this.success(
      res, 
      data, 
      message, 
      statusCode, 
      {
        pagination,
        ...meta
      }
    );
  }
  
  /**
   * Send a created response (HTTP 201)
   * @param res - Express response object
   * @param data - Created entity data
   * @param message - Optional success message
   * @param meta - Additional metadata
   * @returns Express response
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully',
    meta: Record<string, any> = {}
  ): Response {
    return this.success(res, data, message, 201, meta);
  }
  
  /**
   * Send a no content response (HTTP 204)
   * @param res - Express response object
   * @returns Express response
   */
  static noContent(res: Response): Response {
    return res.status(204).end();
  }
  
  /**
   * Send an accepted response (HTTP 202)
   * @param res - Express response object
   * @param data - Response data
   * @param message - Optional success message
   * @param meta - Additional metadata
   * @returns Express response
   */
  static accepted<T>(
    res: Response,
    data: T,
    message: string = 'Request accepted for processing',
    meta: Record<string, any> = {}
  ): Response {
    return this.success(res, data, message, 202, meta);
  }
}

export default ResponseFactory;