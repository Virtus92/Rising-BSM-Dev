import { Request, Response, NextFunction } from 'express';
/**
 * Handle user login with JWT authentication
 */
export declare const login: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Handle forgot password request
 */
export declare const forgotPassword: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate reset token
 */
export declare const validateResetToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Reset password
 */
export declare const resetPassword: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Refresh access token using refresh token
 */
export declare const refreshToken: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Log out user
 * Invalidates the refresh token to effectively log out
 */
export declare const logout: (req: Request, res: Response, next: NextFunction) => void;
