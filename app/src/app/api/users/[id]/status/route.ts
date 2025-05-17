import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/route-handler';
import { prisma } from '@/core/db/index';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';
import { UserStatus, isUserManageableStatus } from '@/domain/enums/UserEnums';
import { requirePermission } from '@/features/permissions';

const logger = getLogger();

/**
 * PATCH /api/users/[id]/status
 * 
 * Updates a user's status
 * Requires USERS_EDIT permission
 */
export const PATCH = requirePermission(SystemPermission.USERS_EDIT)(
  routeHandler(async (req: NextRequest) => {
    // Extract ID from URL path
    const userId = parseInt(req.nextUrl.pathname.split('/')[3]);
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

    try {
      // Permission is already checked by middleware

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        logger.warn(`Status update attempted for non-existent user ID: ${userId}`);
        return formatResponse.error('User not found', 404);
      }

      // Prevent users from changing their own status (except admins)
      if (req.auth?.userId === userId && req.auth?.role !== 'admin') {
        return formatResponse.error('You cannot change your own status', 403);
      }

      // Update user status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: status,
          updatedAt: new Date(),
          updatedBy: req.auth?.userId
        }
      });

      return formatResponse.success({
        message: 'User status updated successfully',
        user: {
          id: updatedUser.id,
          status: updatedUser.status
        }
      });
    } catch (error) {
      logger.error('Error updating user status:', error instanceof Error ? error.message : String(error), {
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      return formatResponse.error('Failed to update user status', 500);
    }
  })
);

export const dynamic = 'force-dynamic';
