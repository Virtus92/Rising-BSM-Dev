/**
 * Update User API Route Handler
 * Handles updating a user by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { validateUserUpdate } from '@/core/validation';

/**
 * Handles PUT /api/users/[id] - Update user by ID
 */
export async function updateUserHandler(
  request: NextRequest, 
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  const userId = parseInt(params.id, 10);

  try {
    // Validate ID
    if (isNaN(userId)) {
      return formatResponse.error('Invalid user ID', 400);
    }

    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('User update attempted without authentication');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Parse request body
    let data = await request.json();
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Check if user exists
    const existingUser = await userService.getById(userId);
    if (!existingUser) {
      return formatResponse.error('User not found', 404);
    }
    
    // Check permissions based on update type
    const isOwnProfile = request.auth.userId === userId;
    
    // Different permission checks based on what's being updated
    // Regular users can update their own basic info
    // Admin/role changes require higher permissions
    const isRoleChange = data.role && data.role !== existingUser.role;
    const isStatusChange = data.status && data.status !== existingUser.status;
    
    // For role or status changes, require USERS_MANAGE permission
    if ((isRoleChange || isStatusChange) && 
        !await permissionMiddleware.hasPermission(request.auth.userId, SystemPermission.USERS_MANAGE)) {
      logger.warn(`Permission denied: User ${request.auth.userId} attempted to change role/status for user ${userId}`);
      return formatResponse.error('You do not have permission to change user roles or status', 403);
    }
    
    // For updating other users, require USERS_EDIT permission
    if (!isOwnProfile && 
        !await permissionMiddleware.hasPermission(request.auth.userId, SystemPermission.USERS_EDIT)) {
      logger.warn(`Permission denied: User ${request.auth.userId} attempted to update user ${userId}`);
      return formatResponse.error('You do not have permission to edit this user', 403);
    }
    
    // For updating own profile, some fields may be restricted
    if (isOwnProfile) {
      // Users can't change their own role or status
      if (isRoleChange || isStatusChange) {
        logger.warn(`Denied: User ${request.auth.userId} attempted to change their own role/status`);
        return formatResponse.error('You cannot change your own role or status', 403);
      }
      
      // Remove restricted fields from self-updates
      const { role, status, ...allowedData } = data;
      data = allowedData;
    }
    
    // Validate update data
    const validationResult = validateUserUpdate(data);
    
    if (!validationResult.valid) {
      return formatResponse.error(
        `Validation failed: ${Object.values(validationResult.errors).join(', ')}`,
        400
      );
    }
    
    // Create context with user ID for audit
    const context = { 
      userId: request.auth?.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Update the user
    const updatedUser = await userService.update(userId, data, { context });
    
    return formatResponse.success(updatedUser, 'User updated successfully');
  } catch (error) {
    logger.error('Error updating user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to update user',
      500
    );
  }
}