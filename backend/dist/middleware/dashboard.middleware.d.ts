import { Request, Response, NextFunction } from 'express';
export declare const getNewRequestsCountMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const attachNotificationsMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const logUserActivityMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const prepareDashboardContextMiddleware: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
declare const _default: {
    getNewRequestsCountMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    attachNotificationsMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    logUserActivityMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    prepareDashboardContextMiddleware: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
};
export default _default;
