import { Request, Response, NextFunction } from 'express';
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const isAuthenticated: (req: Request, res: Response, next: NextFunction) => void;
export declare const isAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const isManager: (req: Request, res: Response, next: NextFunction) => void;
export declare const isEmployee: (req: Request, res: Response, next: NextFunction) => void;
export declare const isNotAuthenticated: (req: Request, res: Response, next: NextFunction) => void;
