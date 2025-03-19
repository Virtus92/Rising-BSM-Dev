import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, createErrorResponse } from '../utils/errors';
import config from '../config';
import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Global error handler middleware
 * Handles all unhandled errors from routes and controllers
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
  
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    res.status(statusCode).json(createErrorResponse(err));
    return;
  }
  // Handle CSRF errors
  if ((err as any).code === 'EBADCSRFTOKEN') {
    if (req.flash) {
      req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
    }
    return res.redirect('back');
  }
  
  // For custom errors with redirects
  if (err instanceof AppError && (err as any).redirect) {
    if (req.flash) {
      req.flash('error', message);
    }
    return res.redirect((err as any).redirect);
  }
  
  // Get user from the request (if it exists)
  const user = (req as AuthenticatedRequest).user;
  
  // Handle regular requests based on error type
  if (statusCode === 404) {
    return res.status(404).render('error', {
      title: 'Seite nicht gefunden - Rising BSM',
      statusCode: 404,
      message: 'Die angeforderte Seite wurde nicht gefunden.',
      error: config.SHOW_STACK_TRACES ? err : {},
      user: user
    });
  }
  
  // For validation errors
  if (err instanceof ValidationError) {
    return res.status(400).render('error', {
      title: 'Validation Error - Rising BSM',
      statusCode: 400,
      message: message,
      errors: err.errors,
      error: config.SHOW_STACK_TRACES ? err : {},
      user: user
    });
  }
  
  // For all other errors
  res.status(statusCode).render('error', {
    title: 'Fehler - Rising BSM',
    statusCode,
    message: config.IS_PRODUCTION 
      ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' 
      : message,
    error: config.SHOW_STACK_TRACES ? err : {},
    user: user
  });
};


/**
 * 404 Not Found handler
 * Handles routes that don't match any defined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Seite nicht gefunden - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * CSRF error handler
 * Special handler for CSRF token validation errors
 */
export const csrfErrorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  
  // For API requests
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    res.status(403).json({
      success: false,
      error: 'CSRF token verification failed',
      message: 'Sicherheitstoken ungültig oder abgelaufen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.'
    });
    return;
  }
  
  // For regular requests
  if (req.flash) {
    req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
  }
  
  res.redirect('back');
};