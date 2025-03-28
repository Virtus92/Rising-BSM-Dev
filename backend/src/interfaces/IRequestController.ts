import { Request, Response } from 'express';

/**
 * Interface for RequestController
 */
export interface IRequestController {
  /**
   * Submit a new contact request (public endpoint)
   */
  submitRequest(req: Request, res: Response): Promise<void>;
  
  /**
   * Get all contact requests (admin only)
   */
  getAllRequests(req: Request, res: Response): Promise<void>;
  
  /**
   * Get contact request by ID (admin only)
   */
  getRequestById(req: Request, res: Response): Promise<void>;
  
  /**
   * Update contact request status (admin only)
   */
  updateRequestStatus(req: Request, res: Response): Promise<void>;
  
  /**
   * Add a note to a contact request (admin only)
   */
  addRequestNote(req: Request, res: Response): Promise<void>;
  
  /**
   * Assign request to processor (admin only)
   */
  assignRequest(req: Request, res: Response): Promise<void>;
  
  /**
   * Batch update request status (admin only)
   */
  batchUpdateRequestStatus(req: Request, res: Response): Promise<void>;
  
  /**
   * Export contact requests (admin only)
   */
  exportRequests(req: Request, res: Response): Promise<void>;
}