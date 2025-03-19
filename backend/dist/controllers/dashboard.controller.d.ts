import { Request, Response, NextFunction } from 'express';
/**
 * Get dashboard data including statistics, charts, and recent activities
 */
export declare const getDashboardData: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get dashboard statistics (used by both API and main dashboard)
 */
export declare const getDashboardStats: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Global search across all entities
 */
export declare const globalSearch: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get all notifications for a user
 */
export declare const getNotifications: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Mark notifications as read
 */
export declare const markNotificationsRead: (req: Request, res: Response, next: NextFunction) => void;
