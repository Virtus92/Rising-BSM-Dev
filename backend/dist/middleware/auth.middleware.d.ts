import { Request, Response, NextFunction } from 'express';
/**
 * Authentication middleware that supports both session and JWT authentication
 * Attaches user object to request if authenticated
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check if the user is authenticated
 * If not, redirects to login page or returns 401
 **/
export declare const isAuthenticated: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if the authenticated user has admin privileges
 **/
export declare const isAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if the authenticated user has manager privileges (manager or admin)
 **/
export declare const isManager: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if the authenticated user has employee privileges (or higher)
 **/
export declare const isEmployee: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if the user is not authenticated
 * Used for login/register pages to prevent authenticated users from accessing them
 **/
export declare const isNotAuthenticated: (req: Request, res: Response, next: NextFunction) => void;
