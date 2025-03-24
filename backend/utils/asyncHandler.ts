import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/common/types.js';

type RequestType = Request | AuthenticatedRequest;

/**
 * Wraps an async function to properly handle errors and pass them to Express's error handler
 * Allows for different return types (void or Response)
 * @param fn Async handler function to wrap
 * @returns Wrapped function that catches and forwards errors
 */
export const asyncHandler = (
  fn: (
    req: RequestType, 
    res: Response, 
    next?: NextFunction
  ) => Promise<void>
) => {
  return async (
    req: RequestType, 
    res: Response, 
    next: NextFunction
  ) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default asyncHandler;