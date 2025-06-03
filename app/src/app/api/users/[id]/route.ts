/**
 * User By ID API Routes
 * 
 * These routes follow the standardized API pattern with proper error handling
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { getUserHandler } from '@/features/users/api/routes/get-user-route';
import { updateUserHandler } from '@/features/users/api/routes/update-user-route';
import { deleteUserHandler } from '@/features/users/api/routes/delete-user-route';
import { formatSuccess, formatError, formatNotFound } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { validateId } from '@/shared/utils/validation-utils';
import { AuthErrorType } from '@/types/types/auth';

const logger = getLogger();

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export async function GET(req: NextRequest) {
  const handler = routeHandler(async (req: NextRequest) => {
  logger.debug('GET /api/users/[id] handler called');
  
  try {
    // Get ID from params (provided by Next.js route handler)
    const id = req.nextUrl.pathname.split('/').pop() || '';
    
    // No need to check auth.userId explicitly - permissionMiddleware will handle this properly
    // and throw appropriate error that will be caught and formatted consistently

    // Check permission using improved error-throwing pattern
    try {
      const hasViewPermission = await permissionMiddleware.hasPermission(
        req.auth?.userId,  // Let permissionMiddleware handle undefined/null checks
        SystemPermission.USERS_VIEW
      );
      
      if (!hasViewPermission) {
        logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_VIEW}`);
        return formatError(
          `You don't have permission to view user details`, 
          403
        );
      }
    } catch (permError) {
      // If this is an auth error, return 401
      if (permError instanceof Error && 
          'type' in permError && 
          permError.type === AuthErrorType.AUTH_REQUIRED) {
        return formatError('Authentication required', 401);
      }
      // Otherwise re-throw for the outer catch block
      throw permError;
    }
    
    if (!id) {
      logger.error('No user ID provided');
      return formatError('No user ID provided', 400);
    }
    
    // Use consistent ID validation
    const userId = validateId(id);
    if (userId === null) {
      logger.error(`Invalid user ID: ${id}`);
      return formatError(`Invalid user ID: ${id} - must be a positive number`, 400);
    }
    
    // Call the handler with constructed params
    const params = { id };
    return await getUserHandler(req, { params });
    
  } catch (error) {
    logger.error('Error in GET /api/users/[id]:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to get user',
      500
    );
  }
  }, {
    requiresAuth: true
  });
  return handler(req);
}

/**
 * PUT /api/users/[id]
 * Update a user
 */
export async function PUT(req: NextRequest) {
  const handler = routeHandler(async (req: NextRequest) => {
  try {
    // Get ID from params (provided by Next.js route handler)
    const id = req.nextUrl.pathname.split('/').pop() || '';
    
    // Check permission using improved error-throwing pattern
    try {
      const hasEditPermission = await permissionMiddleware.hasPermission(
        req.auth?.userId, 
        SystemPermission.USERS_EDIT
      );
      
      if (!hasEditPermission) {
        logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_EDIT}`);
        return formatError(
          `You don't have permission to edit user information`, 
          403
        );
      }
    } catch (permError) {
      // If this is an auth error, return 401
      if (permError instanceof Error && 
          'type' in permError && 
          permError.type === AuthErrorType.AUTH_REQUIRED) {
        return formatError('Authentication required', 401);
      }
      // Otherwise re-throw for the outer catch block
      throw permError;
    }
    
    if (!id) {
      logger.error('No user ID provided');
      return formatError('No user ID provided', 400);
    }
    
    // Use consistent ID validation
    const userId = validateId(id);
    if (userId === null) {
      logger.error(`Invalid user ID: ${id}`);
      return formatError(`Invalid user ID: ${id} - must be a positive number`, 400);
    }
    
    // Call the handler with constructed params
    const params = { id };
    return await updateUserHandler(req, { params });
    
  } catch (error) {
    logger.error('Error in PUT /api/users/[id]:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to update user',
      500
    );
  }
  }, {
    requiresAuth: true
  });
  return handler(req);
}

/**
 * DELETE /api/users/[id]
 * Delete a user
 */
export async function DELETE(req: NextRequest) {
  const handler = routeHandler(async (req: NextRequest) => {
  try {
    // Get ID from params (provided by Next.js route handler)
    const id = req.nextUrl.pathname.split('/').pop() || '';
    
    // Check permission using improved error-throwing pattern
    try {
      const hasDeletePermission = await permissionMiddleware.hasPermission(
        req.auth?.userId, 
        SystemPermission.USERS_DELETE
      );
      
      if (!hasDeletePermission) {
        logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_DELETE}`);
        return formatError(
          `You don't have permission to delete users`, 
          403
        );
      }
    } catch (permError) {
      // If this is an auth error, return 401
      if (permError instanceof Error && 
          'type' in permError && 
          permError.type === AuthErrorType.AUTH_REQUIRED) {
        return formatError('Authentication required', 401);
      }
      // Otherwise re-throw for the outer catch block
      throw permError;
    }
    
    if (!id) {
      logger.error('No user ID provided');
      return formatError('No user ID provided', 400);
    }
    
    // Use consistent ID validation
    const userId = validateId(id);
    if (userId === null) {
      logger.error(`Invalid user ID: ${id}`);
      return formatError(`Invalid user ID: ${id} - must be a positive number`, 400);
    }
    
    // Call the handler with constructed params
    const params = { id };
    return await deleteUserHandler(req, { params });
    
  } catch (error) {
    logger.error('Error in DELETE /api/users/[id]:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to delete user',
      500
    );
  }
  }, {
    requiresAuth: true
  });
  return handler(req);
}