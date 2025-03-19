import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, createErrorResponse } from '../utils/errors';

/**
 * Global error handler middleware
 * Handles all unhandled errors from routes and controllers
 */
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Set default status code and error message
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'An unexpected error occurred';
  
  // Log the error (with stack trace in development)
  console.error(`[${new Date().toISOString()}] Error ${statusCode}: ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  
  // Handle API requests
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(statusCode).json(createErrorResponse(err));
  }
  
  // Handle CSRF errors
  if ((err as any).code === 'EBADCSRFTOKEN') {
    if (req.flash) {
      req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
    }
    return res.redirect('back');
  }
  
  // Handle regular requests
  if (statusCode === 404) {
    return res.status(404).render('error', {
      title: 'Seite nicht gefunden - Rising BSM',
      statusCode: 404,
      message: 'Die angeforderte Seite wurde nicht gefunden.',
      error: process.env.NODE_ENV !== 'production' ? err : {},
      user: req.user
    });
  }
  
  // For all other errors
  res.status(statusCode).render('error', {
    title: 'Fehler - Rising BSM',
    statusCode,
    message: process.env.NODE_ENV === 'production' 
      ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' 
      : message,
    error: process.env.NODE_ENV !== 'production' ? err : {},
    user: req.user
  });
};

/**
 * 404 Not Found handler
 * Handles routes that don't match any defined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Seite nicht gefunden - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch and forward errors to errorHandler middleware
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};