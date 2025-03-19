import { Request, Response } from 'express';
/**
 * Get all services with optional filtering
 */
export declare const getAllServices: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get service by ID
 */
export declare const getServiceById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create a new service
 */
export declare const createService: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update an existing service
 */
export declare const updateService: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Toggle service status (active/inactive)
 */
export declare const toggleServiceStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get service statistics
 */
export declare const getServiceStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
