import { Request, Response } from 'express';
/**
 * Get all appointments with optional filtering
 */
export declare const getAllAppointments: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get appointment by ID with related data
 */
export declare const getAppointmentById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create a new appointment
 */
export declare const createAppointment: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update an existing appointment
 */
export declare const updateAppointment: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete an existing appointment
 */
export declare const deleteAppointment: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update appointment status
 */
export declare const updateAppointmentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Add a note to appointment
 */
export declare const addAppointmentNote: (req: Request, res: Response, next: import("express").NextFunction) => void;
