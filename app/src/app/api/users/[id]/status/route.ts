import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/route-handler';
import { getUserService } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';
import { UserStatus, isUserManageableStatus } from '@/domain/enums/UserEnums';
import { requirePermission } from '@/features/permissions/server';

const logger = getLogger();

/**
 * PATCH /api/users/[id]/status
 * 
 * Updates a user's status
 * Requires USERS_EDIT permission
 */
export const PATCH = requirePermission(SystemPermission.USERS_EDIT)(
  async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract ID from URL path
      const pathParts = req.nextUrl.pathname.split('/');
      const idIndex = pathParts.indexOf('users') + 1;
      const userIdString = pathParts[idIndex];
      
      const userId = parseInt(userIdString);
      if (isNaN(userId)) {
        return formatResponse.error('Invalid user ID', 400);
      }

      // Get request body
      const body = await req.json();
      const { status } = body;

      if (!status || !Object.values(UserStatus).includes(status as UserStatus)) {
        return formatResponse.error('Invalid status value', 400);
      }

      // Check if status is user-manageable
      if (!isUserManageableStatus(status as UserStatus)) {
        return formatResponse.error('This status cannot be set manually', 400);
      }

      // Get user service
      const userService = getUserService();
      
      // Check if user exists
      const user = await userService.getById(userId);

      if (!user) {
        logger.warn(`Status update attempted for non-existent user ID: ${userId}`);
        return formatResponse.error('User not found', 404);
      }

      // Prevent users from changing their own status (except admins)
      if (req.auth?.userId === userId && req.auth?.role !== 'admin') {
        return formatResponse.error('You cannot change your own status', 403);
      }

      // Update user status using the service
      const updatedUser = await userService.updateStatus(
        userId, 
        { status: status as UserStatus },
        { userId: req.auth?.userId }
      );

      return formatResponse.success({
        message: 'User status updated successfully',
        user: {
          id: updatedUser.id,
          status: updatedUser.status
        }
      });
    } catch (error) {
      logger.error('Error updating user status:', error instanceof Error ? error.message : String(error), {
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return formatResponse.error('Failed to update user status', 500);
    }
  }
);

export const dynamic = 'force-dynamic';
