import { Request, Response } from 'express';

/**
 * Interface for ContactController
 */
export interface IContactController {
  /**
   * Submit a new contact request (public endpoint)
   */
  submitContactRequest(req: Request, res: Response): Promise<void>;
  
  /**
   * Get all contact requests (admin only)
   */
  getAllContactRequests(req: Request, res: Response): Promise<void>;
  
  /**
   * Get contact request by ID (admin only)
   */
  getContactRequestById(req: Request, res: Response): Promise<void>;
  
  /**
   * Update contact request status (admin only)
   */
  updateContactRequestStatus(req: Request, res: Response): Promise<void>;
  
  /**
   * Add a note to a contact request (admin only)
   */
  addContactRequestNote(req: Request, res: Response): Promise<void>;
}