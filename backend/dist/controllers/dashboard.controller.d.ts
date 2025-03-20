import { Request, Response, NextFunction } from 'express';
export declare const getDashboardData: (req: Request, res: Response, next: NextFunction) => void;
export declare const getDashboardStats: (req: Request, res: Response, next: NextFunction) => void;
export declare const globalSearch: (req: Request, res: Response, next: NextFunction) => void;
export declare const getNotifications: (req: Request, res: Response, next: NextFunction) => void;
export declare const markNotificationsRead: (req: Request, res: Response, next: NextFunction) => void;
