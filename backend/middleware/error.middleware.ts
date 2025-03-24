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
  DatabaseError,
  BusinessLogicError,
  createErrorResponse 
} from '../utils/error.utils.js';
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
  const requestPath = `${req.method} ${req.path}`;
  const userId = (req as any).user?.id;
  const requestInfo = { path: requestPath, userId, ip: req.ip };
  
  if (statusCode >= 500) {
    logger.error(`Error ${statusCode}: ${message}`, {
      ...requestInfo,
      error: err instanceof Error ? {
        name: err.name,
        message: err.message,
        stack: config.SHOW_STACK_TRACES ? err.stack : undefined
      } : err
    });
  } else if (statusCode >= 400) {
    logger.warn(`Error ${statusCode}: ${message}`, requestInfo);
  }
  
  // Generate standardized error response
  const errorResponse = createErrorResponse(err);
  
  // Add request path to error response
  errorResponse.path = requestPath;
  
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
  errorResponse.path = `${req.method} ${req.path}`;
  res.status(429).json(errorResponse);
};

/**
 * Error logging middleware
 * Logs request information before errors occur
 */
export const requestContextMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
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
 * @param app Express application
 */
export const setupErrorHandling = (app: any): void => {
  // Add request context for better error logging
  app.use(requestContextMiddleware);
  
  // Add 404 handler after all routes
  app.use(notFoundHandler);
  
  // Add global error handler
  app.use(errorHandler);
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { 
      error: {
        name: error.name,
        message: error.message,
        stack: config.SHOW_STACK_TRACES ? error.stack : undefined
      }
    });
    
    // Exit with error after logging
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { 
      reason: reason instanceof Error ? {
        name: reason.name,
        message: reason.message,
        stack: config.SHOW_STACK_TRACES ? reason.stack : undefined
      } : reason,
      promise
    });
    // Don't exit for unhandled rejections, just log them
  });
  
  logger.info('Error handling middleware configured');
};

export default {
  errorHandler,
  notFoundHandler,
  rateLimitHandler,
  requestContextMiddleware,
  setupErrorHandling
};