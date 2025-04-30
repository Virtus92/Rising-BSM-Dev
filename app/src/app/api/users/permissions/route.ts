/**
 * API route for managing user permissions
 * Uses enhanced error handling without fallbacks
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';

import { UserRole } from '@/domain/enums/UserEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * GET /api/users/permissions?userId=123
 * Get permissions for a specific user
 */
export const GET = routeHandler(async (req: NextRequest) => {
  // Debug logging for authentication
  const logger = getLogger();
  logger.debug('permissions API called with auth data:', {
    authHeader: req.headers.get('Authorization'),
    xAuthToken: req.headers.get('X-Auth-Token'),
    userId: req.auth?.userId
  });
  
  // Get user ID from search params
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  // Enhanced validation with specific error messages
  if (!userId) {
    logger.warn('Missing userId parameter in permissions request', {
      searchParams: Object.fromEntries(searchParams.entries()),
      auth: req.auth,
      headers: Object.fromEntries(req.headers.entries())
    });
    
    throw authErrorHandler.createError(
      'Missing userId parameter in permissions request',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { searchParams: Object.fromEntries(searchParams.entries()) },
      400
    );
  }
  
  const userIdNum = Number(userId);
  if (isNaN(userIdNum)) {
    throw authErrorHandler.createError(
      `Invalid userId format: must be a number, received "${userId}"`,
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId },
      400
    );
  }
  
  if (userIdNum <= 0 || !Number.isInteger(userIdNum)) {
    throw authErrorHandler.createError(
      'Invalid userId: must be a positive integer',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userIdNum },
      400
    );
  }

  // Get the current authenticated user with detailed logging for auth failures
  const currentUserId = req.auth?.userId;
  
  if (!currentUserId) {
    // Log detailed diagnostic information
    logger.error('Authentication required for permissions API - missing userId', {
      endpoint: '/api/users/permissions',
      authHeader: req.headers.get('Authorization'),
      xAuthToken: req.headers.get('X-Auth-Token'),
      cookies: req.cookies,
      hasAuth: !!req.auth,
      authData: req.auth
    });
    
    throw authErrorHandler.createError(
      'Authentication required for permissions API - missing userId',
      AuthErrorType.AUTH_REQUIRED,
      { 
        endpoint: '/api/users/permissions',
        headers: {
          authorization: !!req.headers.get('Authorization'),
          xAuthToken: !!req.headers.get('X-Auth-Token'),
          cookie: !!req.headers.get('cookie')
        }
      },
      401
    );
  }

  // Initialize services
  const serviceFactory = getServiceFactory();
  const userService = serviceFactory.createUserService();
  
  // Get the user to check existence
  const [targetUser, currentUser] = await Promise.all([
    userService.getById(Number(userId)),
    userService.getById(Number(currentUserId))
  ]);
  
  if (!targetUser) {
    throw authErrorHandler.createError(
      'User not found',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId: Number(userId) },
      404
    );
  }
  
  // Security check: Only allow admins or managers to view other users' permissions
  // Users can always view their own permissions
  if (Number(userId) !== currentUserId && 
      currentUser?.role !== UserRole.ADMIN && 
      currentUser?.role !== UserRole.MANAGER) {
    
    // Check if the current user has specific permission to view users
    const hasPermission = await permissionMiddleware.hasPermission(
      currentUserId, 
      SystemPermission.USERS_VIEW
    );
    
    if (!hasPermission) {
      throw authErrorHandler.createPermissionError(
        'You do not have permission to view this user\'s permissions',
        { 
          currentUserId,
          targetUserId: Number(userId),
          requiredPermission: SystemPermission.USERS_VIEW 
        }
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
}, {
  requiresAuth: true,
  detailedErrors: true
});

/**
 * POST /api/users/permissions
 * Update permissions for a user
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  // Parse request body
  const data = await req.json();
  const { userId, permissions } = data;
  
  if (!userId || !permissions || !Array.isArray(permissions)) {
    throw authErrorHandler.createError(
      'Invalid request data: userId and permissions array are required',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { data },
      400
    );
  }

  // Get the current authenticated user
  const currentUserId = req.auth?.userId;
  if (!currentUserId) {
    throw authErrorHandler.createError(
      'Authentication required',
      AuthErrorType.AUTH_REQUIRED,
      { endpoint: '/api/users/permissions', method: 'POST' },
      401
    );
  }

  // Check if the users exist
  const userService = serviceFactory.createUserService();
  const [targetUser, currentUser] = await Promise.all([
    userService.getById(Number(userId)),
    userService.getById(Number(currentUserId))
  ]);
  
  if (!targetUser) {
    throw authErrorHandler.createError(
      'User not found',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId: Number(userId) },
      404
    );
  }
  
  // Security checks
  if (currentUser?.role !== UserRole.ADMIN) {
    // Managers can only edit non-admin users
    if (currentUser?.role === UserRole.MANAGER && targetUser.role === UserRole.ADMIN) {
      throw authErrorHandler.createPermissionError(
        'Managers cannot modify admin permissions',
        { 
          currentUserRole: currentUser?.role,
          targetUserRole: targetUser.role 
        }
      );
    }
    
    // Non-admin/manager users cannot modify permissions at all
    if (currentUser?.role !== UserRole.MANAGER) {
      throw authErrorHandler.createPermissionError(
        'You do not have permission to update user permissions',
        { 
          currentUserRole: currentUser?.role,
          requiredRole: 'ADMIN or MANAGER'
        }
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
  
  // If there are any invalid permissions, log a warning
  if (validatedPermissions.length !== permissions.length) {
    const invalidPermissions = permissions.filter(p => !validSystemPermissions.includes(p as SystemPermission));
    logger.warn('Invalid permissions in update request:', {
      invalidPermissions,
      userId: Number(userId),
      requestedBy: currentUserId
    });
  }
  
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
  await permissionMiddleware.invalidatePermissionCache(Number(userId));
  
  // Log the permission update for audit purposes
  logger.info(`User permissions updated for user ${userId} by ${req.auth?.userId}`, {
    userId: Number(userId),
    updatedBy: req.auth?.userId,
    permissionCount: validatedPermissions.length,
    ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
  });
  
  return formatResponse.success({
    userId: Number(userId),
    success,
    permissions: validatedPermissions
  }, 'User permissions updated successfully');
}, {
  requiresAuth: true,
  detailedErrors: true
});
