/**
 * API route for admin reset of user password
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { generateSecurePassword } from '@/core/security/password-utils';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * POST /api/users/[id]/reset-password
 * Reset a user's password (admin function)
 */
export const POST = routeHandler(async (req: NextRequest, { params }) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Check permission directly - using the user management permission
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number,
      SystemPermission.USERS_MANAGE
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_MANAGE}`);
      return formatResponse.error(
        `You don't have permission to perform this action (requires ${SystemPermission.USERS_MANAGE})`,
        403
      );
    }

    // Extract ID from params (more reliable than parsing URL)
    const id = parseInt(params?.id || '');
    if (isNaN(id)) {
      return formatResponse.error('Invalid user ID', 400);
    }

    // Get the user
    const userService = serviceFactory.createUserService();
    const user = await userService.getById(id);
    
    if (!user) {
      return formatResponse.notFound('User not found');
    }
    
    // Generate a secure password
    const password = generateSecurePassword();
    
    // Verify password is strong (optional extra safety check)
    if (password.length < 8) {
      return formatResponse.error('System error: Generated password is not secure', 500);
    }
    
    // In the User model, we need to update the password directly
    // since UpdateUserDto doesn't include password field for security reasons
    await userService.updatePassword(id, password, {
      context: { 
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // Log the action
    logger.info(`Password reset for user ${id} by admin ${req.auth?.userId}`);
    
    // Return the new password (ONLY for admin interface)
    return formatResponse.success({ 
      password 
    }, 'Password reset successfully');
    
  } catch (error) {
    logger.error('Error resetting user password:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to reset password',
      500
    );
  }
}, {
  requiresAuth: true
  // Removed requiredRoles: ['ADMIN'] - we're checking permissions directly in the handler now
});
