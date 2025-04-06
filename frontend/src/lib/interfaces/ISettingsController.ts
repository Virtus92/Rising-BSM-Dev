import { Request, Response } from 'express';
import { IBaseController } from './IBaseController.js';

/**
 * Interface for SettingsController
 */
export interface ISettingsController extends IBaseController<any> {
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