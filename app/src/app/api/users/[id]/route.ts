/**
 * API route for specific user operations
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { apiPermissions } from '@/app/api/helpers/apiPermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { validateId } from '@/shared/utils/validation-utils';

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export const GET = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Check permission using consistent pattern
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.USERS_VIEW
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_VIEW}`);
      return formatResponse.error(
        `You don't have permission to view user details`, 
        403
      );
    }
    
    // Get the ID parameter from params
    // Use consistent ID validation
    const userId = validateId(params.id);
    if (userId === null) {
      return formatResponse.error(`Invalid user ID: ${params.id} - must be a positive number`, 400);
    }

    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Get the user by ID
    const user = await userService.getById(userId, {
      context: { userId: req.auth?.userId }
    });
    
    if (!user) {
      return formatResponse.notFound('User not found');
    }

    return formatResponse.success(user, 'User retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: params.id
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch user',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * PUT /api/users/[id]
 * Update a user
 */
export const PUT = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Check permission using consistent pattern
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.USERS_EDIT
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_EDIT}`);
      return formatResponse.error(
        `You don't have permission to edit user information`, 
        403
      );
    }
    
    // Get the ID parameter from params
    // Use consistent ID validation
    const userId = validateId(params.id);
    if (userId === null) {
      return formatResponse.error(`Invalid user ID: ${params.id} - must be a positive number`, 400);
    }

    // Parse request body
    const data = await req.json();
    
    // Validate input data
    const { validateUserUpdate } = require('@/infrastructure/common/validation/userValidation');
    const validationResult = validateUserUpdate(data);
    
    if (!validationResult.isValid) {
      return formatResponse.error(
        `Validation failed: ${validationResult.errors.join(', ')}`,
        400
      );
    }
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Check if user exists
    const existingUser = await userService.getById(userId);
    if (!existingUser) {
      return formatResponse.notFound('User not found');
    }
    
    // If email is being updated, check if it's already in use by another user
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await userService.findByEmail(data.email);
      if (userWithEmail && userWithEmail.id !== userId) {
        return formatResponse.error('Email already in use by another user', 400);
      }
    }
    
    // Update the user
    const updatedUser = await userService.update(userId, data, {
      context: { 
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    return formatResponse.success(updatedUser, 'User updated successfully');
  } catch (error) {
    logger.error('Error updating user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: params.id
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to update user',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * DELETE /api/users/[id]
 * Delete a user
 */
export const DELETE = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using consistent pattern
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.USERS_DELETE
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_DELETE}`);
      return formatResponse.error(
        `You don't have permission to delete users`, 
        403
      );
    }
    
    // Get the ID parameter from params
    // Use consistent ID validation
    const userId = validateId(params.id);
    if (userId === null) {
      return formatResponse.error(`Invalid user ID: ${params.id} - must be a positive number`, 400);
    }
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Check if user exists
    const existingUser = await userService.getById(userId);
    if (!existingUser) {
      return formatResponse.notFound('User not found');
    }
    
    // Check if the user is trying to delete themselves
    if (userId === req.auth?.userId) {
      return formatResponse.error('You cannot delete your own account', 400);
    }
    
    // Perform soft delete instead of hard delete
    const success = await userService.softDelete(userId, {
      context: { 
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    return formatResponse.success({ success }, 'User deleted successfully');
  } catch (error) {
    logger.error('Error deleting user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: params.id
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to delete user',
      500
    );
  }
}, {
  requiresAuth: true
});
