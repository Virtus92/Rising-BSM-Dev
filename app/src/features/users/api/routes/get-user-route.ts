/**
 * Get User API Route Handler
 * Handles retrieving a user by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * Handles GET /api/users/[id] - Get user by ID
 */
export async function getUserHandler(
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
      logger.warn('User detail access attempted without authentication');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Allow users to access their own profile without specific permissions
    const isOwnProfile = request.auth.userId === userId;
    
    if (!isOwnProfile && !await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.USERS_VIEW
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission to view user ${userId}`);
      return formatResponse.error(
        `You don't have permission to view this user`, 
        403
      );
    }
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Get user by ID
    const user = await userService.getById(userId);
    
    if (!user) {
      return formatResponse.error('User not found', 404);
    }
    
    // For detailed view with activities, we might want different permission
    const includeDetails = request.nextUrl.searchParams.get('details') === 'true';
    
    if (includeDetails && !isOwnProfile && !await permissionMiddleware.hasPermission(
      request.auth.userId,
      SystemPermission.USERS_EDIT
    )) {
      // If no permission for detailed view, return basic user data
      return formatResponse.success(user, 'User found');
    }
    
    // Get detailed info if requested
    if (includeDetails) {
      const userDetails = await userService.getUserDetails(userId);
      return formatResponse.success(userDetails, 'User details retrieved successfully');
    }
    
    // Return basic user data
    return formatResponse.success(user, 'User found');
  } catch (error) {
    logger.error('Error fetching user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch user',
      500
    );
  }
}