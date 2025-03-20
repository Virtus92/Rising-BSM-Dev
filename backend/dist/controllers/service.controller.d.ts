import { Request, Response } from 'express';
export declare const getAllServices: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getServiceById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const createService: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateService: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const toggleServiceStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getServiceStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
