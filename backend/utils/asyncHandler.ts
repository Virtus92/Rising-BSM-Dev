import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async function to properly handle errors and pass them to Express's error handler
 * Allows for different return types (void or Response)
 * @param fn Async handler function to wrap
 * @returns Wrapped function that catches and forwards errors
 */
export const asyncHandler = <T extends Request = Request, R = void>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<R>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next))
      .catch(next);
  };
};

export default asyncHandler;