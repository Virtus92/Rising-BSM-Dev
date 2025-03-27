import { Request, Response } from 'express';

/**
 * IRoleController
 * 
 * Interface for the role controller.
 * Defines methods for handling role-related HTTP requests.
 */
export interface IRoleController {
  /**
   * Get all roles
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getAllRoles(req: Request, res: Response): Promise<void>;
  
  /**
   * Get role by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getRoleById(req: Request, res: Response): Promise<void>;
  
  /**
   * Create a new role
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  createRole(req: Request, res: Response): Promise<void>;
  
  /**
   * Update an existing role
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateRole(req: Request, res: Response): Promise<void>;
  
  /**
   * Delete a role
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  deleteRole(req: Request, res: Response): Promise<void>;
  
  /**
   * Get all permissions
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getAllPermissions(req: Request, res: Response): Promise<void>;
  
  /**
   * Assign permissions to a role
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  assignPermissions(req: Request, res: Response): Promise<void>;
  
  /**
   * Create a new permission
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  createPermission(req: Request, res: Response): Promise<void>;
}