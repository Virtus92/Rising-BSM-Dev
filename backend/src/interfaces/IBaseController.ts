/**
 * IBaseController
 * 
 * Generic controller interface that provides a contract for basic CRUD operations.
 * Serves as the base for all controller interfaces in the application.
 * 
 * @template T - Entity type
 * @template ID - Primary key type (default: number)
 */
import { Request, Response } from 'express';
import { FilterCriteria, QueryOptions } from './IBaseRepository.js';

export interface IBaseController<T, ID = number> {
  /**
   * Get all entities with optional filtering and pagination
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getAll(req: Request, res: Response): Promise<void>;
  
  /**
   * Get an entity by its ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getById(req: Request, res: Response): Promise<void>;
  
  /**
   * Create a new entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  create(req: Request, res: Response): Promise<void>;
  
  /**
   * Update an existing entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  update(req: Request, res: Response): Promise<void>;
  
  /**
   * Delete an entity
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  delete(req: Request, res: Response): Promise<void>;
  
  /**
   * Search for entities
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  search(req: Request, res: Response): Promise<void>;
  
  /**
   * Export entities data
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  export?(req: Request, res: Response): Promise<void>;
  
  /**
   * Bulk update entities
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  bulkUpdate(req: Request, res: Response): Promise<void>;
  
  /**
   * Handle errors in controller methods
   * 
   * @param error - Error object
   * @param res - HTTP response
   * @param customMessage - Optional custom error message
   */
  handleError(error: any, res: Response, customMessage?: string): void;

  /**
   * Extract query parameters and convert to query options
   * 
   * @param req - HTTP request
   * @returns QueryOptions for repository/service calls
   */
  extractQueryOptions(req: Request): QueryOptions;

  /**
   * Extract filter criteria from request
   * 
   * @param req - HTTP request
   * @returns Filter criteria for repository/service calls
   */
  extractFilterCriteria(req: Request): FilterCriteria;
}