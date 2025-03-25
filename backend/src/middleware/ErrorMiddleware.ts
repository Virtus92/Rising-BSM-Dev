/**
 * ErrorMiddleware
 * 
 * Middleware for handling errors in Express application.
 * Provides standardized error responses and logging.
 */
import { Request, Response, NextFunction, Express } from 'express';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler, AppError } from '../interfaces/IErrorHandler.js';

export class ErrorMiddleware {
  /**
   * Creates a new ErrorMiddleware instance
   * 
   * @param logger - Logging service
   * @param errorHandler - Error handler
   * @param showStackTraces - Whether to include stack traces in error responses
   */
  constructor(
    private readonly logger: ILoggingService,
    private readonly errorHandlerService: IErrorHandler,
    private readonly showStackTraces: boolean = process.env.NODE_ENV !== 'production'
  ) {
    this.logger.debug('Initialized ErrorMiddleware');
  }

  /**
   * Register error handling middleware on Express application
   * 
   * @param app - Express application
   */
  public register(app: Express): void {
    // 404 handler - must be registered after all routes
    app.use(this.notFoundHandler.bind(this));
    
    // Global error handler - must be registered last
    app.use(this.handleError.bind(this));
    
    this.logger.info('Error handling middleware registered');
  }

  /**
   * Handle 404 Not Found errors
   * 
   * @param req - HTTP request
   * @param _res - HTTP response
   * @param next - Next function
   */
  private notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    const error = this.errorHandlerService.createNotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`);
    next(error);
  }

  /**
   * Handle all errors
   * 
   * @param err - Error object
   * @param req - HTTP request
   * @param res - HTTP response
   * @param _next - Next function
   */
  private handleError(err: Error, req: Request, res: Response, _next: NextFunction): void {
    // Default to 500 if not an AppError
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err.message || 'An unexpected error occurred';
    
    // Log error with appropriate severity
    const requestPath = `${req.method} ${req.path}`;
    const userId = (req as any).user?.id;
    const requestInfo = { path: requestPath, userId, ip: req.ip };
    
    if (statusCode >= 500) {
      this.logger.error(`Error ${statusCode}: ${message}`, err, requestInfo);
    } else if (statusCode >= 400) {
      this.logger.warn(`Error ${statusCode}: ${message}`, requestInfo);
    }
    
    // Generate standardized error response
    const errorResponse = this.errorHandlerService.formatError(err);
    
    // Add stack traces in non-production environments if configured
    if (this.showStackTraces && err.stack) {
      errorResponse.stack = err.stack;
    }
    
    // Add request path to error response
    errorResponse.path = requestPath;
    
    // Send response
    res.status(statusCode).json(errorResponse);
  }
}