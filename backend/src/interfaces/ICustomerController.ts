/**
 * ICustomerController
 * 
 * Interface for customer controller.
 * Defines methods for handling customer-related HTTP requests.
 */
import { Request, Response } from 'express';
import { IBaseController } from './IBaseController.js';
import { Customer } from '../entities/Customer.js';

export interface ICustomerController extends IBaseController<Customer> {
  /**
   * Get all customers with pagination and filtering
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getAllCustomers(req: Request, res: Response): Promise<void>;
  
  /**
   * Get customer by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getCustomerById(req: Request, res: Response): Promise<void>;
  
  /**
   * Create a new customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  createCustomer(req: Request, res: Response): Promise<void>;
  
  /**
   * Update an existing customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateCustomer(req: Request, res: Response): Promise<void>;
  
  /**
   * Delete a customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  deleteCustomer(req: Request, res: Response): Promise<void>;
  
  /**
   * Update customer status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateCustomerStatus(req: Request, res: Response): Promise<void>;
  
  /**
   * Add a note to customer
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  addCustomerNote(req: Request, res: Response): Promise<void>;
  
  /**
   * Get customer statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getCustomerStatistics(req: Request, res: Response): Promise<void>;
  
  /**
   * Export customers data
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  exportCustomers(req: Request, res: Response): Promise<void>;
  
  /**
   * Search customers
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  searchCustomers(req: Request, res: Response): Promise<void>;
  
  /**
   * Get customer insights
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getCustomerInsights(req: Request, res: Response): Promise<void>;
  
  /**
   * Get similar customers
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getSimilarCustomers(req: Request, res: Response): Promise<void>;
  
  /**
   * Get customer history
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getCustomerHistory(req: Request, res: Response): Promise<void>;
  
  /**
   * Bulk update customers
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  bulkUpdateCustomers(req: Request, res: Response): Promise<void>;
}