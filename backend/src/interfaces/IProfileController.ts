import { Request, Response } from 'express';

/**
 * Interface for ProfileController
 */
export interface IProfileController {
  /**
   * Get the profile of the current user
   */
  getMyProfile(req: Request, res: Response): Promise<void>;
  
  /**
   * Update the profile of the current user
   */
  updateMyProfile(req: Request, res: Response): Promise<void>;
  
  /**
   * Change the password of the current user
   */
  changeMyPassword(req: Request, res: Response): Promise<void>;
  
  /**
   * Upload a profile picture for the current user
   */
  uploadProfilePicture(req: Request, res: Response): Promise<void>;
  
  /**
   * Delete the profile picture of the current user
   */
  deleteProfilePicture(req: Request, res: Response): Promise<void>;
  
  /**
   * Get the activity log of the current user
   */
  getMyActivityLog(req: Request, res: Response): Promise<void>;
}