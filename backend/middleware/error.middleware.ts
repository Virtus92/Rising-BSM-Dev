import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, createErrorResponse } from '../utils/errors';
import config from '../config';

/**
 * Global error handler middleware
 * Handles all unhandled errors from routes and controllers
 * Always returns JSON responses
 */
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // Default to 500 if not an AppError
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'An unexpected error occurred';
  
  // Log the error (with stack trace in development)
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error ${statusCode}: ${message}`);
  
  if (config.IS_DEVELOPMENT) {
    console.error(err.stack);
  }
  
  // Generate standardized error response
  const errorResponse = createErrorResponse(err);
  
  // Always send JSON response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Handles routes that don't match any defined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Resource not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};