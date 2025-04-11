/**
 * API route for specific user operations
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatNotFound } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/users/[id]
 * Get a specific user by ID
 */
export const GET = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return formatError('Invalid user ID', 400);
    }

    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Get the user by ID
    const user = await userService.getById(id, {
      context: { userId: req.auth?.userId }
    });
    
    if (!user) {
      return formatNotFound('User not found');
    }

    return formatSuccess(user, 'User retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: params.id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to fetch user',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * PUT /api/users/[id]
 * Update a user
 */
export const PUT = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return formatError('Invalid user ID', 400);
    }

    // Parse request body
    const data = await req.json();
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Check if user exists
    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return formatNotFound('User not found');
    }
    
    // Update the user
    const updatedUser = await userService.update(id, data, {
      context: { userId: req.auth?.userId }
    });

    return formatSuccess(updatedUser, 'User updated successfully');
  } catch (error) {
    logger.error('Error updating user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: params.id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to update user',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * DELETE /api/users/[id]
 * Delete a user
 */
export const DELETE = apiRouteHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  // Check if user has admin role
  if (req.auth?.role !== 'ADMIN') {
    return formatError('Unauthorized - Admin access required', 403);
  }
  
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return formatError('Invalid user ID', 400);
    }
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Check if user exists
    const existingUser = await userService.getById(id);
    if (!existingUser) {
      return formatNotFound('User not found');
    }
    
    // Delete the user
    const success = await userService.delete(id, {
      context: { userId: req.auth?.userId }
    });
    
    return formatSuccess({ success }, 'User deleted successfully');
  } catch (error) {
    logger.error('Error deleting user:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: params.id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to delete user',
      500
    );
  }
}, {
  requiresAuth: true,
  requiresRole: ['ADMIN']
});
