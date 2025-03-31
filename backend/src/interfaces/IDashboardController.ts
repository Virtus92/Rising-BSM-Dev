import { Request, Response } from 'express';

/**
 * Interface for dashboard controller
 * 
 * Defines methods for dashboard API endpoints
 */
export interface IDashboardController {
  /**
   * Get dashboard data with optional filters
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getDashboardData(req: Request, res: Response): Promise<void>;
  
  /**
   * Get dashboard statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getStats(req: Request, res: Response): Promise<void>;
  
  /**
   * Perform global search across entities
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  globalSearch(req: Request, res: Response): Promise<void>;
}
