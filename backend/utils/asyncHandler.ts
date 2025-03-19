import { Request, Response, NextFunction } from 'express';

// Generic async handler that works with both regular and authenticated requests
type AsyncFunction<T extends Request = Request> = (
  req: T, 
  res: Response, 
  next?: NextFunction
) => Promise<any>;


export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as T, res, next))
      .catch((err) => next(err));
  };
};

export default asyncHandler;