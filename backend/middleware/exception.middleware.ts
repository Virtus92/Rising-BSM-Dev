import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, createErrorResponse } from '../utils/errors';
import logger from '../utils/logger';
import config from '../config';

/**
 * Global exception handler middleware
 */
export const exceptionHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: string[] = [];
  let details: any = {};
  
  // Handle different error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
    errors = err.errors || [];
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details || {};
  }
  
  // Log the error
  logger.error(`[${req.method}] ${req.path} - ${statusCode} ${message}`, {
    path: req.path,
    method: req.method,
    statusCode,
    message,
    stack: err.stack,
    userId: (req as any).user?.id
  });
  
  // Create standardized error response
  const errorResponse = createErrorResponse(err);
  
  // Send response
  res.status(statusCode).json(errorResponse);
};
