import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to get new requests count
 * Attaches the count of new contact requests to the request object
 */
export declare const getNewRequestsCountMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to attach user notifications
 * Retrieves and attaches user notifications to the request object
 */
export declare const attachNotificationsMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to log user activity
 * Logs route access and potentially other user interactions
 */
export declare const logUserActivityMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to prepare dashboard context
 * Combines multiple dashboard-related data preparation steps
 */
export declare const prepareDashboardContextMiddleware: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
declare const _default: {
    getNewRequestsCountMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    attachNotificationsMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    logUserActivityMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    prepareDashboardContextMiddleware: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
};
export default _default;
