import { Request, Response } from 'express';

/**
 * Interface for SettingsController
 */
export interface ISettingsController {
  /**
   * Get settings of the current user
   */
  getMySettings(req: Request, res: Response): Promise<void>;
  
  /**
   * Update settings of the current user
   */
  updateMySettings(req: Request, res: Response): Promise<void>;
  
  /**
   * Get system settings (admin only)
   */
  getSystemSettings(req: Request, res: Response): Promise<void>;
  
  /**
   * Update system settings (admin only)
   */
  updateSystemSettings(req: Request, res: Response): Promise<void>;
}