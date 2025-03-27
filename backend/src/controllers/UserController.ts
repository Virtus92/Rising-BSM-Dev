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
import { BaseController } from '../core/BaseController.js';
import { IUserController } from '../interfaces/IUserController.js';

/**
 * UserController
 * 
 * Controller for handling User-related HTTP requests.
 * Routes user requests to the appropriate service methods.
 */
export class UserController extends BaseController implements IUserController {
  /**
   * Creates a new UserController instance
   * 
   * @param userService - User service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly userService: IUserService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(logger, errorHandler);
    
    // Bind methods to preserve 'this' context when used as route handlers
    this.getAllUsers = this.getAllUsers.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.updateUserStatus = this.updateUserStatus.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.searchUsers = this.searchUsers.bind(this);
    this.getUserStatistics = this.getUserStatistics.bind(this);
    this.bulkUpdateUsers = this.bulkUpdateUsers.bind(this);
    
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
      this.sendPaginatedResponse(
        res, 
        result.data, 
        result.pagination, 
        'Users retrieved successfully'
      );
    } catch (error) {
      this.handleError(error, req, res);
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
        throw this.errorHandler.createNotFoundError(`User with ID ${id} not found`);
      }
      
      // Send response
      this.sendSuccessResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
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
      
      // Ensure name is set if firstName and lastName are provided
      if (!userData.name && userData.firstName && userData.lastName) {
        userData.name = `${userData.firstName} ${userData.lastName}`;
      }
      
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
      this.sendCreatedResponse(res, user, 'User created successfully');
    } catch (error) {
      this.handleError(error, req, res);
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
      
      // Ensure name is set if firstName and lastName are provided
      if (userData.firstName && userData.lastName) {
        userData.name = `${userData.firstName} ${userData.lastName}`;
      }
      
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
      this.sendSuccessResponse(res, user, 'User updated successfully');
    } catch (error) {
      this.handleError(error, req, res);
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
        throw this.errorHandler.createError('Cannot delete your own account', 400);
      }
      
      // Delete user with context
      const success = await this.userService.delete(id, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(
        res, 
        { id, deleted: success }, 
        'User deleted successfully'
      );
    } catch (error) {
      this.handleError(error, req, res);
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
        throw this.errorHandler.createError('Cannot update your own status', 400);
      }
      
      // Update status with context
      const user = await this.userService.updateStatus(id, statusData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, user, 'User status updated successfully');
    } catch (error) {
      this.handleError(error, req, res);
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
        throw this.errorHandler.createForbiddenError('Not authorized to change password for this user');
      }
      
      // Change password with context
      const success = await this.userService.changePassword(id, passwordData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(
        res, 
        { changed: success }, 
        'Password changed successfully'
      );
    } catch (error) {
      this.handleError(error, req, res);
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
        throw this.errorHandler.createValidationError('Invalid search term', ['Search text must be at least 2 characters']);
      }
      
      // Search users with pagination
      const users = await this.userService.searchUsers(searchText, {
        page,
        limit
      });
      
      // Send response
      this.sendSuccessResponse(res, users, 'Users found successfully');
    } catch (error) {
      this.handleError(error, req, res);
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
      this.sendSuccessResponse(res, statistics, 'User statistics retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Bulk update multiple users
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async bulkUpdateUsers(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, data } = req.body;
      
      // Get authenticated user info
      const userId = (req as any).user?.id;
      
      // Validate input
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw this.errorHandler.createValidationError('Invalid user IDs', ['User IDs must be a non-empty array']);
      }
      
      if (!data || Object.keys(data).length === 0) {
        throw this.errorHandler.createValidationError('Invalid update data', ['Update data is required']);
      }
      
      // Prevent users from updating their own role or status
      if (userIds.includes(userId) && (data.role !== undefined || data.status !== undefined)) {
        throw this.errorHandler.createForbiddenError('Cannot update your own role or status');
      }
      
      // Call service to bulk update users
      const updatedCount = await this.userService.bulkUpdate(userIds, data, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send success response
      this.sendSuccessResponse(
        res,
        { 
          count: updatedCount,
          ids: userIds
        },
        `${updatedCount} users updated successfully`
      );
    } catch (error) {
      this.handleError(error, req, res);
    }
  }
}