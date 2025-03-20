import { Request, Response } from 'express';
export declare const getAllRequests: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getRequestById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateRequestStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addRequestNote: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const exportRequests: (req: Request, res: Response, next: import("express").NextFunction) => void;
