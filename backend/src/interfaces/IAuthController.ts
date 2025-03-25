/**
 * IAuthController
 * 
 * Interface for authentication controller.
 * Defines methods for handling authentication-related HTTP requests.
 */
import { Request, Response } from 'express';

export interface IAuthController {
  /**
   * Handle user login
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  login(req: Request, res: Response): Promise<void>;
  
  /**
   * Handle token refresh
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  refreshToken(req: Request, res: Response): Promise<void>;
  
  /**
   * Handle forgot password request
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  forgotPassword(req: Request, res: Response): Promise<void>;
  
  /**
   * Validate reset token
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  validateResetToken(req: Request, res: Response): Promise<void>;
  
  /**
   * Reset password
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  resetPassword(req: Request, res: Response): Promise<void>;
  
  /**
   * Handle user logout
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  logout(req: Request, res: Response): Promise<void>;
  
  /**
   * Get reset token for testing (development only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getResetToken?(req: Request, res: Response): Promise<void>;
}