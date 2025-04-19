/**
 * API route for admin reset of user password
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { generateSecurePassword } from '@/infrastructure/common/security/passwordUtils';

/**
 * POST /api/users/[id]/reset-password
 * Reset a user's password (admin function)
 */
export const POST = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Ensure params is properly resolved before using
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
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
      stack: error instanceof Error ? error.stack : undefined,
      userId: params.id
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to reset password',
      500
    );
  }
}, {
  requiresAuth: true,
  requiresRole: ['ADMIN']
});
