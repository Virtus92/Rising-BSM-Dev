import { Request, Response } from 'express';
export declare const getAllCustomers: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getCustomerById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const createCustomer: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateCustomer: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addCustomerNote: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateCustomerStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteCustomer: (req: Request, res: Response, next: import("express").NextFunction) => void;
