/**
 * API route for managing user permissions
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

import { UserRole } from '@/domain/enums/UserEnums';
import { apiPermissions } from '../../helpers/apiPermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * GET /api/users/permissions?userId=123
 * Get permissions for a specific user
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Get user ID from search params
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId || isNaN(Number(userId))) {
      return formatResponse.error('Invalid or missing user ID', 400);
    }

    // Get the current authenticated user
    const currentUserId = req.auth?.userId;
    if (!currentUserId) {
      return formatResponse.error('Authentication required', 401);
    }

    // Get the user to check existence
    const userService = serviceFactory.createUserService();
    const [targetUser, currentUser] = await Promise.all([
      userService.getById(Number(userId)),
      userService.getById(Number(currentUserId))
    ]);
    
    if (!targetUser) {
      return formatResponse.notFound('User not found');
    }
    
    // Security check: Only allow admins or managers to view other users' permissions
    // Users can always view their own permissions
    if (Number(userId) !== currentUserId && 
        currentUser?.role !== UserRole.ADMIN && 
        currentUser?.role !== UserRole.MANAGER) {
      
      // Check if the current user has specific permission to view users
      const hasPermission = await apiPermissions.hasPermission(
        Number(currentUserId), 
        SystemPermission.USERS_VIEW
      );
      
      if (!hasPermission) {
        return formatResponse.error(
          'You do not have permission to view this user\'s permissions', 
          403
        );
      }
    }
    
    // Create permission service
    const permissionService = serviceFactory.createPermissionService();
    
    // Get permissions for the user
    const userPermissions = await permissionService.getUserPermissions(Number(userId), {
      context: {
        userId: req.auth?.userId,
        serviceFactory
      }
    });
    
    return formatResponse.success(userPermissions, 'User permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user permissions:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch user permissions',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * POST /api/users/permissions
 * Update permissions for a user
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Parse request body
    const data = await req.json();
    const { userId, permissions } = data;
    
    if (!userId || !permissions || !Array.isArray(permissions)) {
      return formatResponse.error('Invalid request data', 400);
    }

    // Get the current authenticated user
    const currentUserId = req.auth?.userId;
    if (!currentUserId) {
      return formatResponse.error('Authentication required', 401);
    }

    // Check if the users exist
    const userService = serviceFactory.createUserService();
    const [targetUser, currentUser] = await Promise.all([
      userService.getById(Number(userId)),
      userService.getById(Number(currentUserId))
    ]);
    
    if (!targetUser) {
      return formatResponse.notFound('User not found');
    }
    
    // Security checks
    if (currentUser?.role !== UserRole.ADMIN) {
      // Managers can only edit non-admin users
      if (currentUser?.role === UserRole.MANAGER && targetUser.role === UserRole.ADMIN) {
        return formatResponse.error(
          'Managers cannot modify admin permissions', 
          403
        );
      }
      
      // Non-admin/manager users cannot modify permissions at all
      if (currentUser?.role !== UserRole.MANAGER) {
        return formatResponse.error(
          'You do not have permission to update user permissions', 
          403
        );
      }
    }
    
    // Validate permissions array for security
    // This prevents someone from adding permissions they shouldn't have
    const validSystemPermissions = Object.values(SystemPermission);
    
    // Filter out any invalid permission codes
    const validatedPermissions = permissions.filter(permission => {
      // Check if it's a valid system permission
      return validSystemPermissions.includes(permission as SystemPermission);
    });
    
    // Create permission service
    const permissionService = serviceFactory.createPermissionService();
    
    // Update permissions
    const success = await permissionService.updateUserPermissions(
      {
        userId: Number(userId),
        permissions: validatedPermissions
      },
      {
        context: {
          userId: req.auth?.userId,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          serviceFactory
        }
      }
    );
    
    // Invalidate the permissions cache for this user
    await apiPermissions.invalidatePermissionCache(Number(userId));
    
    return formatResponse.success({
      userId: Number(userId),
      success,
      permissions: validatedPermissions
    }, 'User permissions updated successfully');
  } catch (error) {
    logger.error('Error updating user permissions:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to update user permissions',
      500
    );
  }
}, {
  requiresAuth: true
});
