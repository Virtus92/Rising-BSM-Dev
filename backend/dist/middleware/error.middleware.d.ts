import { Request, Response, NextFunction } from 'express';
/**
 * Global error handler middleware
 * Handles all unhandled errors from routes and controllers
 */
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * 404 Not Found handler
 * Handles routes that don't match any defined routes
 */
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
/**
 * CSRF error handler
 * Special handler for CSRF token validation errors
 */
export declare const csrfErrorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
