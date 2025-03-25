import { Request, Response } from 'express';
import { IUserService } from '../interfaces/IUserService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  ChangePasswordDto,
  UpdateUserStatusDto,
  UserFilterParams 
} from '../dtos/UserDtos.js';

/**
 * UserController
 * 
 * Controller for handling User-related HTTP requests.
 * Routes user requests to the appropriate service methods.
 */
export class UserController {
  /**
   * Creates a new UserController instance
   * 
   * @param userService - User service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly userService: IUserService,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized UserController');
  }

  /**
   * Get all users
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters
      const filters: UserFilterParams = {
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortDirection: req.query.sortDirection as 'asc' | 'desc'
      };
      
      // Get users from service
      const result = await this.userService.findUsers(filters);
      
      // Send response
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          pagination: result.pagination
        }
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Get user by ID
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get user details from service
      const user = await this.userService.getUserDetails(id);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          statusCode: 404
        });
        return;
      }
      
      // Send response
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Create a new user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Create user with context
      const user = await this.userService.create(userData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Update an existing user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const userData: UpdateUserDto = req.body;
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Update user with context
      const user = await this.userService.update(id, userData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Delete a user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Check if trying to delete self
      if (id === userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete your own account',
          statusCode: 400
        });
        return;
      }
      
      // Delete user with context
      const success = await this.userService.delete(id, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      res.status(200).json({
        success: true,
        data: { id, deleted: success },
        message: 'User deleted successfully'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Update user status
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const statusData: UpdateUserStatusDto = req.body;
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Check if trying to update self
      if (id === userId) {
        res.status(400).json({
          success: false,
          error: 'Cannot update your own status',
          statusCode: 400
        });
        return;
      }
      
      // Update status with context
      const user = await this.userService.updateStatus(id, statusData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      res.status(200).json({
        success: true,
        data: user,
        message: 'User status updated successfully'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Change user password
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const passwordData: ChangePasswordDto = req.body;
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Check if authorized to change this password
      if (id !== userId && (req as any).user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Not authorized to change password for this user',
          statusCode: 403
        });
        return;
      }
      
      // Change password with context
      const success = await this.userService.changePassword(id, passwordData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      res.status(200).json({
        success: true,
        data: { changed: success },
        message: 'Password changed successfully'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Search users
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const searchText = req.query.q as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!searchText || searchText.length < 2) {
        res.status(400).json({
          success: false,
          error: 'Search text must be at least 2 characters',
          statusCode: 400
        });
        return;
      }
      
      // Search users with pagination
      const users = await this.userService.searchUsers(searchText, {
        page,
        limit
      });
      
      // Send response
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Get user statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getUserStatistics(req: Request, res: Response): Promise<void> {
    try {
      // Get statistics from service
      const statistics = await this.userService.getUserStatistics();
      
      // Send response
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }
}