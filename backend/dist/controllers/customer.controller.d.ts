import { Request, Response } from 'express';
/**
 * Get all customers with optional filtering
 */
export declare const getAllCustomers: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get customer by ID with related data
 */
export declare const getCustomerById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create a new customer
 */
export declare const createCustomer: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update an existing customer
 */
export declare const updateCustomer: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Add a note to customer
 */
export declare const addCustomerNote: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update customer status
 */
export declare const updateCustomerStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete a customer (mark as deleted)
 */
export declare const deleteCustomer: (req: Request, res: Response, next: import("express").NextFunction) => void;
