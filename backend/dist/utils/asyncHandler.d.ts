import { Request, Response, NextFunction } from 'express';
export declare const asyncHandler: <T extends Request = Request, R = void>(fn: (req: T, res: Response, next: NextFunction) => Promise<R>) => (req: Request, res: Response, next: NextFunction) => void;
export default asyncHandler;
