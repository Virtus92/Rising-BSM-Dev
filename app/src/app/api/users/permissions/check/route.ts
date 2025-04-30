/**
 * API route for checking user permissions
 * Uses enhanced error handling without fallbacks
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';

/**
 * GET /api/users/permissions/check?userId=123&permission=USERS_VIEW
 * Check if a user has a specific permission
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  
  // Get user ID and permission code from search params
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const permission = searchParams.get('permission');
  
  if (!userId || isNaN(Number(userId))) {
    // Log detailed diagnostic information
    logger.warn('Invalid or missing user ID in permission check', {
      searchParams: Object.fromEntries(searchParams.entries()),
      userId,
      auth: req.auth,
      headers: Object.fromEntries(req.headers.entries())
    });
    
    throw authErrorHandler.createError(
      'Invalid or missing user ID',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { searchParams: Object.fromEntries(searchParams.entries()) },
      400
    );
  }
  
  if (!permission) {
    throw authErrorHandler.createError(
      'Missing permission parameter',
      AuthErrorType.PERMISSION_CHECK_FAILED,
      { userId },
      400
    );
  }

  // Get the current authenticated user with detailed logging for auth failures
  const currentUserId = req.auth?.userId;
  if (!currentUserId) {
    // Log detailed diagnostic information
    logger.error('Authentication required for permission check API - missing userId', {
      endpoint: '/api/users/permissions/check',
      authHeader: req.headers.get('Authorization'),
      xAuthToken: req.headers.get('X-Auth-Token'),
      cookies: req.cookies,
      hasAuth: !!req.auth,
      authData: req.auth,
      requestId: req.headers.get('x-request-id') || 'unknown'
    });
    
    throw authErrorHandler.createError(
      'Authentication required',
      AuthErrorType.AUTH_REQUIRED,
      { 
        endpoint: '/api/users/permissions/check',
        headers: {
          authorization: !!req.headers.get('Authorization'),
          xAuthToken: !!req.headers.get('X-Auth-Token'),
          cookie: !!req.headers.get('cookie')
        }
      },
      401
    );
  }

  // Create permission service
  const serviceFactory = getServiceFactory();
  const permissionService = serviceFactory.createPermissionService();
  
  try {
    // Check if user has the permission
    const hasPermission = await permissionService.hasPermission(
      Number(userId), 
      permission,
      { context: { userId: req.auth?.userId } }
    );
    
    // Log the check for audit purposes
    logger.debug('Permission check:', {
      userId: Number(userId),
      permission,
      hasPermission,
      checkedBy: currentUserId
    });
    
    return formatResponse.success(hasPermission, hasPermission 
      ? `User has permission: ${permission}` 
      : `User does not have permission: ${permission}`
    );
  } catch (error) {
    // Convert to standard error format
    const permissionError = authErrorHandler.normalizeError(error, {
      operation: 'hasPermission',
      userId: Number(userId),
      permission,
      endpoint: '/api/users/permissions/check'
    });
    
    // Log the error
    logger.error('Error checking user permission:', {
      error: permissionError,
      userId: Number(userId),
      permission
    });
    
    // Throw the error to be handled by route handler
    throw permissionError;
  }
}, {
  requiresAuth: true,
  detailedErrors: true
});
