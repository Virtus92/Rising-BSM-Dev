/**
 * INotificationController
 * 
 * Interface for notification controller.
 * Defines methods for handling notification-related HTTP requests.
 */
import { Request, Response } from 'express';

export interface INotificationController {
  /**
   * Get user notifications
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getNotifications(req: Request, res: Response): Promise<void>;
  
  /**
   * Mark notifications as read
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  markNotificationsRead(req: Request, res: Response): Promise<void>;
  
  /**
   * Get notification statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getNotificationStats(req: Request, res: Response): Promise<void>;
  
  /**
   * Delete a notification
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  deleteNotification(req: Request, res: Response): Promise<void>;
  
  /**
   * Test notification creation (for development only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  testNotification(req: Request, res: Response): Promise<void>;
}