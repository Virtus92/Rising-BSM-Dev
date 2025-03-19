import { Request, Response } from 'express';
/**
 * Get user settings
 */
export declare const getUserSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update user settings
 */
export declare const updateUserSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get system settings (admin only)
 */
export declare const getSystemSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update system settings (admin only)
 */
export declare const updateSystemSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get backup settings (admin only)
 */
export declare const getBackupSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update backup settings (admin only)
 */
export declare const updateBackupSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Trigger manual backup (admin only)
 */
export declare const triggerManualBackup: (req: Request, res: Response, next: import("express").NextFunction) => void;
