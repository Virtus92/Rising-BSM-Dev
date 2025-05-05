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
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { validateId } from '@/shared/utils/validation-utils';

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
    
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.USERS_VIEW
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_VIEW}`);
      return formatError(
        `You don't have permission to view user details`, 
        403
      );
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
    
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.USERS_EDIT
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_EDIT}`);
      return formatError(
        `You don't have permission to edit user information`, 
        403
      );
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
    
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.USERS_DELETE
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.USERS_DELETE}`);
      return formatError(
        `You don't have permission to delete users`, 
        403
      );
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