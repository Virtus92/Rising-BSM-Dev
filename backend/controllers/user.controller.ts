/**
 * User Controller
 * 
 * Handles API requests related to user management.
 * @module controllers/user
 */
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/controller.types.js';
import { 
  UserCreateDTO, 
  UserUpdateDTO, 
  UserStatusUpdateDTO,
  UserFilterParams
} from '../types/dtos/user.dto.js';
import { UserService } from '../services/user.service.js';
import { ResponseFactory, processPagination } from '../utils/http.utils.js';
import { asyncHandler } from '../utils/error.utils.js';
import { ValidationError } from '../utils/error.utils.js';
import { logger } from '../utils/common.utils.js';

// Create user service instance
const userService = new UserService();

 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves paginated list of users with filtering options
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, email, phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by user status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, manager, employee, user]
 *         description: Filter by user role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponseDTO'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 */
export const getAllUsers = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get validated query params or use raw query
    const query = (req as any).validatedQuery || req.query;
    
    // Build filter parameters
    const filters: UserFilterParams = {
      search: query.search as string,
      status: query.status as string,
      role: query.role as string,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      sortBy: query.sortBy as string || 'createdAt',
      sortDirection: (query.sortDirection as 'asc' | 'desc') || 'desc',
      startDate: query.startDate ? new Date(query.startDate as string) : undefined,
      endDate: query.endDate ? new Date(query.endDate as string) : undefined
    };
    
    // Use service to get users
    const result = await userService.findAll(filters);
    
    // Add skip property for pagination
    const paginationWithSkip = {
      ...result.pagination,
      skip: (result.pagination.current - 1) * result.pagination.limit
    };
    
    // Return paginated response
    ResponseFactory.paginated(
      res,
      result.data,
      paginationWithSkip,
      'Users retrieved successfully'
    );
  } catch (error) {
    logger.error('Error getting users', { error, userId: req.user?.id });
    next(error);
  }
});

 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves detailed information about a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDetailResponseDTO'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: User not found
 */
export const getUserById = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    
    // Get detailed user data
    const user = await userService.getUserDetails(id);
    
    // Return success response
    ResponseFactory.success(
      res,
      user,
      'User retrieved successfully'
    );
  } catch (error) {
    logger.error('Error getting user by ID', { error, userId: req.user?.id, targetId: req.params.id });
    next(error);
  }
});

 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create new user
 *     description: Creates a new user with the provided information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreateDTO'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserResponseDTO'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 */
export const createUser = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get validated data
    const userData = (req as any).validatedData as UserCreateDTO;
    
    // Create user with admin context
    const user = await userService.create(userData, {
      userId: req.user?.id,
      ipAddress: req.ip
    });
    
    // Return created response
    ResponseFactory.created(
      res,
      user,
      'User created successfully'
    );
  } catch (error) {
    logger.error('Error creating user', { error, userId: req.user?.id });
    next(error);
  }
});

 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Updates an existing user with the provided information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateDTO'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserResponseDTO'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: User not found
 */
export const updateUser = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const userData = (req as any).validatedData as UserUpdateDTO;
    
    // Update user with admin context
    const user = await userService.update(id, userData, {
      userId: req.user?.id,
      ipAddress: req.ip
    });
    
    // Return success response
    ResponseFactory.success(
      res,
      user,
      'User updated successfully'
    );
  } catch (error) {
    logger.error('Error updating user', { error, userId: req.user?.id, targetId: req.params.id });
    next(error);
  }
});

 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Deletes a user by ID (soft delete by default, hard delete with mode=hard)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [soft, hard]
 *           default: soft
 *         description: Delete mode (soft=suspend user, hard=permanently delete)
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserResponseDTO'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: User not found
 */
export const deleteUser = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    
    // Check for delete mode
    const deleteMode = (req.query.mode as string) || 'soft';
    
    // Prevent deletion of own account
    if (id === req.user?.id) {
      throw new ValidationError('Cannot delete your own account', ['Cannot delete your own account']);
    }
    
    let result;
    if (deleteMode === 'hard') {
      // Hard delete - permanently remove user from database
      result = await userService.hardDelete(id, {
        userId: req.user?.id,
        ipAddress: req.ip
      });

      // Return success response
      ResponseFactory.success(
        res,
        result,
        'User permanently deleted successfully'
      );
    } else {
      // Soft delete - update status to 'suspended'
      result = await userService.update(id, { status: 'suspended' }, {
        userId: req.user?.id,
        ipAddress: req.ip
      });
      
      // Return success response
      ResponseFactory.success(
        res,
        result,
        'User suspended successfully'
      );
    }
  } catch (error) {
    logger.error('Error deleting user', { error, userId: req.user?.id, targetId: req.params.id });
    next(error);
  }
});

 * @swagger
 * /api/v1/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     description: Updates a user's status (activate/deactivate)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserStatusUpdateDTO'
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserResponseDTO'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: User not found
 */
export const updateUserStatus = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status, note } = (req as any).validatedData;
    
    // Prevent changing own status
    if (id === req.user?.id) {
      throw new ValidationError('Cannot change your own status', ['Administrators cannot change their own status']);
    }
    
    // Update status
    const statusUpdateDto: UserStatusUpdateDTO = {
      id,
      status,
      note
    };
    
    const user = await userService.updateStatus(statusUpdateDto, {
      userId: req.user?.id,
      ipAddress: req.ip
    });
    
    // Return success response
    ResponseFactory.success(
      res,
      user,
      'User status updated successfully'
    );
  } catch (error) {
    logger.error('Error updating user status', { 
      error, 
      userId: req.user?.id, 
      targetId: req.params.id 
    });
    next(error);
  }
});

 * @swagger
 * /api/v1/users/search:
 *   get:
 *     summary: Search users
 *     description: Search users by name, email, or phone number
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search term
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponseDTO'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 */
export const searchUsers = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get query parameters
    const query = (req as any).validatedQuery || req.query;
    const term = query.term as string;
    
    if (!term || term.length < 2) {
      throw new ValidationError('Invalid search term', ['Search term must be at least 2 characters']);
    }
    
    // Process pagination params
    const pagination = processPagination({
      page: req.query.page as string,
      limit: req.query.limit as string
    });
    
    // Search users
    const result = await userService.searchUsers(term, {
      page: pagination.current,
      limit: pagination.limit
    });
    
    // Add skip property for pagination
    const paginationWithSkip = {
      ...result.pagination,
      skip: (pagination.current - 1) * pagination.limit
    };
    
    // Return paginated response
    ResponseFactory.paginated(
      res,
      result.data,
      paginationWithSkip,
      'Users retrieved successfully'
    );
  } catch (error) {
    logger.error('Error searching users', { 
      error, 
      userId: req.user?.id, 
      query: req.query 
    });
    next(error);
  }
});

 * @swagger
 * /api/v1/users/statistics:
 *   get:
 *     summary: User statistics
 *     description: Get statistics about users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 */
export const getUserStatistics = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get statistics
    const statistics = await userService.getUserStatistics();
    
    // Return success response
    ResponseFactory.success(
      res,
      statistics,
      'User statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error getting user statistics', { error, userId: req.user?.id });
    next(error);
  }
});

 * @swagger
 * /api/v1/users/export:
 *   get:
 *     summary: Export users
 *     description: Export users data to CSV or Excel
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 */
export const exportUsers = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get export parameters
    const format = (req.query.format as string) || 'csv';
    
    // Validate format
    if (!['csv', 'excel'].includes(format)) {
      throw new ValidationError('Invalid format', ['Format must be csv or excel']);
    }
    
    // Build filters
    const filters: UserFilterParams = {
      status: req.query.status as string,
      role: req.query.role as string,
      search: req.query.search as string
    };
    
    // Export users
    const { buffer, filename } = await userService.exportUsers(filters, format);
    
    // Set headers and send file
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    }
  } catch (error) {
    logger.error('Error exporting users', { error, userId: req.user?.id });
    next(error);
  }
});

 * @swagger
 * /api/v1/users/bulk-update:
 *   post:
 *     summary: Bulk update users
 *     description: Update multiple users at once
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               data:
 *                 $ref: '#/components/schemas/UserUpdateDTO'
 *     responses:
 *       200:
 *         description: Users updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of users updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an admin
 */
export const bulkUpdateUsers = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userIds, data } = (req as any).validatedData;
    
    // Validate data
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('Invalid user IDs', ['User IDs must be a non-empty array of numbers']);
    }
    
    if (!data || Object.keys(data).length === 0) {
      throw new ValidationError('Invalid update data', ['Update data is required']);
    }
    
    // Prevent updating own user
    if (userIds.includes(req.user?.id)) {
      throw new ValidationError('Cannot update own user in bulk', ['Administrators cannot update their own user in bulk operations']);
    }
    
    // Perform bulk update
    const count = await userService.bulkUpdate(userIds, data, {
      userId: req.user?.id,
      ipAddress: req.ip
    });
    
    // Return success response
    ResponseFactory.success(
      res,
      { count, ids: userIds },
      `${count} users updated successfully`
    );
  } catch (error) {
    logger.error('Error bulk updating users', { error, userId: req.user?.id });
    next(error);
  }
});