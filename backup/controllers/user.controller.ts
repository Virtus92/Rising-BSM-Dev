/**
 * User Controller
 * 
 * Controller for User entity operations handling HTTP requests and responses.
 */
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/common/types.js';
import { asyncHandler } from '../utils/error.utils.js';
import { ResponseFactory } from '../utils/response.utils.js';
import { UserService } from '../services/user.service.js';
import { 
  UserCreateDTO, 
  UserUpdateDTO, 
  UserFilterParams,
  UserStatusUpdateDTO
} from '../types/dtos/user.dto.js';
import { BadRequestError, NotFoundError } from '../utils/error.utils.js';
import { inject } from '../config/dependency-container.js';

/**
 * Controller for User entity operations
 */
export class UserController {
  /**
   * Creates a new UserController instance
   * @param userService User service instance
   */
  constructor(private readonly userService: UserService = inject<UserService>('UserService')) {}

  /**
   * Get all users with optional filtering
   * @route GET /api/v1/users
   */
  getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Extract filter parameters from request
    const filters: UserFilterParams = {
      status: req.query.status as string,
      role: req.query.role as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortDirection: req.query.sortDirection as 'asc' | 'desc'
    };
    
    // Get users from service
    const result = await this.userService.findAllUsers(filters);
    
    // Send paginated response
    ResponseFactory.paginated(
      res,
      result.data,
      result.pagination,
      'Users retrieved successfully'
    );
  });

  /**
   * Get user by ID
   * @route GET /api/v1/users/:id
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new BadRequestError('Invalid user ID');
    }
    
    // Get user from service
    const result = await this.userService.findUserById(id);
    
    if (!result) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    
    // Send success response
    ResponseFactory.success(res, result, 'User retrieved successfully');
  });

  /**
   * Create a new user
   * @route POST /api/v1/users
   */
  createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Extract user data from request body
    const userData: UserCreateDTO = req.body;
    
    // Get user context from authenticated request
    const userContext = req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined;
    
    // Create user
    const result = await this.userService.createUser(userData, { userContext });
    
    // Send created response
    ResponseFactory.created(res, result, 'User created successfully');
  });

  /**
   * Update an existing user
   * @route PUT /api/v1/users/:id
   */
  updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new BadRequestError('Invalid user ID');
    }
    
    // Extract user data from request body
    const userData: UserUpdateDTO = req.body;
    
    // Get user context from authenticated request
    const userContext = req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined;
    
    // Update user
    const result = await this.userService.updateUser(id, userData, { userContext });
    
    // Send success response
    ResponseFactory.success(res, result, 'User updated successfully');
  });

  /**
   * Delete a user
   * @route DELETE /api/v1/users/:id
   */
  deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new BadRequestError('Invalid user ID');
    }
    
    // Get user context from authenticated request
    const userContext = req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined;
    
    // Delete user
    await this.userService.deleteUser(id, { userContext });
    
    // Send success response
    ResponseFactory.success(res, { id }, 'User deleted successfully');
  });

  /**
   * Update user status
   * @route PATCH /api/v1/users/:id/status
   */
  updateUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      throw new BadRequestError('Invalid user ID');
    }
    
    // Extract status data from request body
    const { status, note }: UserStatusUpdateDTO = req.body;
    
    // Get user context from authenticated request
    const userContext = req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined;
    
    // Update user status
    const result = await this.userService.updateUserStatus(id, status, { userContext });
    
    // Send success response
    ResponseFactory.success(res, result, 'User status updated successfully');
  });
}

// Create controller instance for use in routes
const userController = new UserController();

// Export controller methods for routes
export const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus
} = userController;

export default userController;