import { Request, Response } from 'express';
import { IBaseController } from './IBaseController.js';
import { Service } from '../entities/Service.js';

/**
 * Interface for service controller
 * Extends the base controller with service-specific methods
 */
export interface IServiceController extends IBaseController<Service> {
  /**
   * Get all services with pagination and filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getAllServices(req: Request, res: Response): Promise<void>;
  
  /**
   * Get service by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getServiceById(req: Request, res: Response): Promise<void>;
  
  /**
   * Create a new service
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  createService(req: Request, res: Response): Promise<void>;
  
  /**
   * Update an existing service
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateService(req: Request, res: Response): Promise<void>;
  
  /**
   * Toggle service status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  toggleServiceStatus(req: Request, res: Response): Promise<void>;
  
  /**
   * Get service statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getServiceStatistics(req: Request, res: Response): Promise<void>;
}
