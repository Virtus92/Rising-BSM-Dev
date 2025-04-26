/**
 * Delete User API Route Handler
 * Handles deleting a user by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * Handles DELETE /api/users/[id] - Delete user by ID
 */
export async function deleteUserHandler(
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
      logger.warn('User deletion attempted without authentication');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Check permission
    const { permissionMiddleware } = await import('@/features/permissions/api/middleware');
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.USERS_DELETE
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission to delete users`);
      return formatResponse.error('You do not have permission to delete users', 403);
    }
    
    // Prevent users from deleting themselves
    if (request.auth.userId === userId) {
      logger.warn(`User ${userId} attempted to delete their own account`);
      return formatResponse.error('You cannot delete your own account', 403);
    }
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Check if user exists
    const existingUser = await userService.getById(userId);
    if (!existingUser) {
      return formatResponse.error('User not found', 404);
    }
    
    // Check if this is a hard delete or soft delete
    const hardDelete = request.nextUrl.searchParams.get('hard') === 'true';
    
    // Create context with user ID for audit
    const context = { 
      userId: request.auth.userId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    };
    
    let success: boolean;
    
    // Default to soft delete unless hard delete is explicitly requested
    if (hardDelete) {
      // Hard delete requires additional permission check
      if (!await permissionMiddleware.hasPermission(
        request.auth.userId,
        SystemPermission.USERS_DELETE
      )) {
        logger.warn(`Permission denied: User ${request.auth.userId} does not have permission for hard delete`);
        return formatResponse.error('You do not have permission to hard delete users', 403);
      }
      
      success = await userService.hardDelete(userId, { context });
    } else {
      success = await userService.softDelete(userId, { context });
    }
    
    if (!success) {
      return formatResponse.error('Failed to delete user', 500);
    }
    
    return formatResponse.success(
      { id: userId, deleted: true, type: hardDelete ? 'hard' : 'soft' },
      `User successfully ${hardDelete ? 'permanently deleted' : 'deleted'}`
    );
  } catch (error) {
    logger.error('Error deleting user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to delete user',
      500
    );
  }
}
