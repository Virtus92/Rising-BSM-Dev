// utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Type for async route handler function
 */
type AsyncRouteHandler = (
  req: Request, 
  res: Response, 
  next?: NextFunction
) => Promise<any>;

/**
 * Higher-order function to wrap async route handlers
 * Automatically catches errors and passes them to the next middleware
 * 
 * @param fn Async function to wrap
 * @returns Wrapped function that handles errors
 */
export const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next))
      .catch(err => {
        next(err);
      });
  };
};

export default asyncHandler;