import { Request, Response } from 'express';
/**
 * Get all requests with optional filtering
 */
export declare const getAllRequests: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get request by ID with related data
 */
export declare const getRequestById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update request status
 */
export declare const updateRequestStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Add a note to request
 */
export declare const addRequestNote: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Export requests data
 */
export declare const exportRequests: (req: Request, res: Response, next: import("express").NextFunction) => void;
