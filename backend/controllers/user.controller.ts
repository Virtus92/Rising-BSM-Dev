/**
 * User Controller
 * 
 * Controller for User management operations (admin functionality)
 */
import { Request, Response } from 'express';
import { BadRequestError } from '../../backup/utils_bak/errors.js';
import { asyncHandler } from '../../backup/utils_bak/asyncHandler.js';
import { AuthenticatedRequest } from '../types/common/types.js';
import { ResponseFactory } from '../../backup/utils_bak/response.factory.js';
import { UserService, userService } from '../services/user.service.js';
import { 
  UserCreateDTO, 
  UserUpdateDTO, 
  UserFilterParams
} from '../types/dtos/user.dto.js';

/**
 * Get all users with optional filtering
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Extract filter parameters
  const filters: UserFilterParams = {
    status: req.query.status as string,
    role: req.query.role as string,
    search: req.query.search as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined
  };

  // Call service to get users
  const result = await userService.findAllUsers(filters, {
    page: filters.page,
    limit: filters.limit
  });
  
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
 */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid user ID');
  }

  // Call service to get user
  const user = await userService.findUserById(id, {
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, user, 'User retrieved successfully');
});

/**
 * Create a new user
 */
export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Extract user data from request body
  const userData: UserCreateDTO = req.body;
  
  // Call service to create user
  const createdUser = await userService.createUser(userData, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  // Send created response
  ResponseFactory.created(res, createdUser, 'User created successfully');
});

/**
 * Update an existing user
 */
export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid user ID');
  }
  
  // Extract user data from request body
  const userData: UserUpdateDTO = req.body;
  
  // Call service to update user
  const updatedUser = await userService.updateUser(id, userData, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined,
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, updatedUser, 'User updated successfully');
});

/**
 * Delete a user
 */
export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid user ID');
  }
  
  // Call service to delete user
  await userService.deleteUser(id, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined,
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, { id }, 'User deleted successfully');
});

/**
 * Update user status
 */
export const updateUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    throw new BadRequestError('Invalid user ID');
  }
  
  const { status } = req.body;
  
  if (!status) {
    throw new BadRequestError('Status is required');
  }
  
  // Call service to update user status
  const updatedUser = await userService.updateUserStatus(id, status, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined,
    throwIfNotFound: true
  });
  
  // Send success response
  ResponseFactory.success(res, updatedUser, 'User status updated successfully');
});