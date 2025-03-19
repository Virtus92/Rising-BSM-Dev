import { Request, Response, NextFunction } from 'express';
type AsyncFunction<T extends Request = Request> = (req: T, res: Response, next?: NextFunction) => Promise<any>;
export declare const asyncHandler: <T extends Request = Request>(fn: AsyncFunction<T>) => (req: Request, res: Response, next: NextFunction) => void;
export default asyncHandler;
