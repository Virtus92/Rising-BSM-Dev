import { Request, Response, NextFunction } from 'express';
/**
 * Submit contact form
 */
export declare const submitContact: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get contact request by ID
 */
export declare const getContactRequest: (req: Request, res: Response, next: NextFunction) => void;
