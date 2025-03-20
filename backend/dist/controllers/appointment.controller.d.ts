import { Request, Response } from 'express';
export declare const getAllAppointments: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getAppointmentById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const createAppointment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateAppointment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteAppointment: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateAppointmentStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addAppointmentNote: (req: Request, res: Response, next: import("express").NextFunction) => void;
