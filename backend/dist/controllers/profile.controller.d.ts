import { Request, Response } from 'express';
/**
 * Get current user profile data
 */
export declare const getUserProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update user profile
 */
export declare const updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update user password
 */
export declare const updatePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update profile picture
 */
export declare const updateProfilePicture: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update notification settings
 */
export declare const updateNotificationSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
