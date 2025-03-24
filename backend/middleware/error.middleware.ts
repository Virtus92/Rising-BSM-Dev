/**
 * Error Middleware
 * 
 * Global error handling middleware for Express application.
 * Provides standardized error responses and logging.
 */
import { Request, Response, NextFunction } from 'express';
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  createErrorResponse 
} from '../../backup/utils_bak/errors.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Global error handler middleware
 * Handles all unhandled errors from routes and controllers
 * Always returns JSON responses with standardized format
 */
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  _next: NextFunction
): void => {
  // Default to 500 if not an AppError
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'An unexpected error occurred';
  
  // Log error with appropriate severity
  const timestamp = new Date().toISOString();
  if (statusCode >= 500) {
    logger.error(`[${timestamp}] Error ${statusCode}: ${message}`, {
      error: err,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.id
    });
  } else if (statusCode >= 400) {
    logger.warn(`[${timestamp}] Error ${statusCode}: ${message}`, {
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id
    });
  }
  
  // Generate standardized error response
  const errorResponse = createErrorResponse(err);
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Handles routes that don't match any defined routes
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Rate limit error handler
 * Formats rate limit errors consistently
 */
export const rateLimitHandler = (req: Request, res: Response): void => {
  const error = new AppError('Too many requests, please try again later', 429);
  const errorResponse = createErrorResponse(error);
  res.status(429).json(errorResponse);
};

/**
 * Error logging middleware
 * Logs request information before errors occur
 */
export const errorLoggerMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  // Add request info to context for better error logging
  (req as any).requestContext = {
    startTime: Date.now(),
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  next();
};

/**
 * Setup all error handling middleware on an Express app
 * @param app - Express application
 */
export const setupErrorHandling = (app: any): void => {
  // Add request context for better error logging
  app.use(errorLoggerMiddleware);
  
  // Add 404 handler after all routes
  app.use(notFoundHandler);
  
  // Add global error handler
  app.use(errorHandler);
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    
    // Exit with error after logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    // Don't exit for unhandled rejections, just log them
  });
  
  logger.info('Error handling middleware configured');
};

export default {
  errorHandler,
  notFoundHandler,
  rateLimitHandler,
  errorLoggerMiddleware,
  setupErrorHandling
};