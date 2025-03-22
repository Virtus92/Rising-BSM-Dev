import { Response } from 'express';
import { PaginationResult } from '../types/controller-types';

export class ResponseFactory {
  /**
   * Send a success response
   */
  static success<T>(
    res: Response, 
    data: T, 
    message?: string,
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Send a paginated response
   */
  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: PaginationResult, 
    message?: string,
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      meta: {
        pagination,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Send a created response
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }
  
  /**
   * Send a no content response
   */
  static noContent(res: Response): Response {
    return res.status(204).end();
  }
}
