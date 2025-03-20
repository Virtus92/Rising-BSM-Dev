import { Request, Response } from 'express';
export declare const getUserSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateUserSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getSystemSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateSystemSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getBackupSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateBackupSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const triggerManualBackup: (req: Request, res: Response, next: import("express").NextFunction) => void;
