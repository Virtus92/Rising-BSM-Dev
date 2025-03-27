/**
 * IUserController
 * 
 * Interface for user controller.
 * Defines methods for handling user-related HTTP requests.
 */
import { Request, Response } from 'express';

export interface IUserController {
  /**
   * Get all users
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getAllUsers(req: Request, res: Response): Promise<void>;
  
  /**
   * Get user by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getUserById(req: Request, res: Response): Promise<void>;

  /**
   * Get user with roles and permissions
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getUserWithRoles(req: Request, res: Response): Promise<void>;

  /**
   * Assign roles to a user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  assignRolesToUser(req: Request, res: Response): Promise<void>;

  /**
   * Remove roles from a user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  removeRolesFromUser(req: Request, res: Response): Promise<void>;

  /**
   * Get user permissions
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getUserPermissions(req: Request, res: Response): Promise<void>;
  
  /**
   * Create a new user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  createUser(req: Request, res: Response): Promise<void>;
  
  /**
   * Update an existing user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateUser(req: Request, res: Response): Promise<void>;
  
  /**
   * Delete a user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  deleteUser(req: Request, res: Response): Promise<void>;
  
  /**
   * Update user status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  updateUserStatus(req: Request, res: Response): Promise<void>;
  
  /**
   * Search users
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  searchUsers(req: Request, res: Response): Promise<void>;
  
  /**
   * Get user statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  getUserStatistics(req: Request, res: Response): Promise<void>;
  
  /**
   * Export users to CSV or Excel
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  exportUsers?(req: Request, res: Response): Promise<void>;
  
  /**
   * Bulk update users
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  bulkUpdateUsers(req: Request, res: Response): Promise<void>;
  
  /**
   * Change user password
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  changePassword(req: Request, res: Response): Promise<void>;
}