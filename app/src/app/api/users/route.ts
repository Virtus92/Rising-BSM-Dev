/**
 * User API Route
 * 
 * This endpoint handles user listing, creation, and bulk deletion
 * with proper authentication and permission checks.
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { UserRole, UserStatus } from '@/domain';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';

const logger = getLogger();

/**
 * GET /api/users
 * 
 * Get all users with proper auth and error handling
 */
export const GET = routeHandler(
  async (request: NextRequest, context) => {
    // Get authenticated user ID from request.auth
    const userId = request.auth?.userId;
    
    if (!userId) {
      logger.error('Authentication required for /api/users', {
        requestId: request.headers.get('X-Request-ID') || crypto.randomUUID().substring(0, 8)
      });
      
      return formatResponse.unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
    }
    
    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortDirection = searchParams.get('sortDirection') || 'asc';
    const search = searchParams.get('search') || '';
    
    // Log request info for debugging
    logger.debug('Processing GET /users request', {
      userId,
      params: {
        page,
        limit,
        status: status || 'undefined',
        sortBy,
        sortDirection,
        search: search || 'none'
      }
    });
    
    // Get service using dynamic import to prevent circular dependencies
    const { getServiceFactory } = await import('@/core/factories/serviceFactory.server');
    const serviceFactory = getServiceFactory();
    
    // Permission check is now handled by the middleware
    // The handler will only execute if the user has the required permission
    
    // Get user service and request data
    const userService = serviceFactory.createUserService();
    
    try {
      // Get users with pagination and filtering
      const result = await userService.findUsers({
        page,
        limit,
        status: status as UserStatus || undefined,
        search,
        sortBy,
        sortDirection: sortDirection as 'asc' | 'desc'
      }, {
        userId, // Pass the authenticated user ID
      });
      
      // Log success details for debugging
      logger.debug('Successfully retrieved users', {
        count: result.data.length,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit
      });
      
      // Return success
      return formatResponse.success(result, 'Users retrieved successfully');
    } catch (error) {
      logger.error('Error fetching users:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        page,
        limit
      });
      
      return formatResponse.error(
        error instanceof Error ? error.message : 'Failed to fetch users',
        500
      );
    }
  },
  {
    // Use the routeHandler authentication middleware
    requiresAuth: true,
    
    // Require specific permissions
    requiredPermission: ['users.view']
  }
);

/**
 * POST /api/users
 * 
 * Create a new user
 */
export const POST = routeHandler(
  async (request: NextRequest, context) => {
    // Get authenticated user ID directly from request.auth
    const userId = request.auth?.userId;
    const userRole = request.auth?.role;
    
    if (!userId) {
      logger.error('Authentication required for POST /api/users', {
        requestId: request.headers.get('X-Request-ID') || crypto.randomUUID().substring(0, 8)
      });
      return formatResponse.unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
    }
    
    // Parse request body
    const data = await request.json();
    
    // Remove confirmPassword field if it exists to prevent Prisma errors
    const { confirmPassword, ...cleanData } = data;
    
    // Get service using dynamic import to prevent circular dependencies
    const { getServiceFactory } = await import('@/core/factories/serviceFactory.server');
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    try {
      // Create user
      const newUser = await userService.create(cleanData, {
        userId: userId,  // Proper context for audit
        role: userRole,
      });
      
      // Return formatted success response
      return formatResponse.success(newUser, 'User created successfully', 201);
    } catch (error) {
      logger.error('Error creating user:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return formatResponse.error(
        error instanceof Error ? error.message : 'Failed to create user',
        500
      );
    }
  },
  {
    // Authentication is required
    requiresAuth: true,
    
    // Only admins can create users
    requiredRole: UserRole.ADMIN,
    
    // Require specific permissions
    requiredPermission: ['users.create'],
  }
);

/**
 * DELETE /api/users
 * 
 * Bulk delete users
 */
export const DELETE = routeHandler(
  async (request: NextRequest, context) => {
    // Parse request body
    const data = await request.json();
    const { ids } = data;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('Invalid request: missing or empty ids array');
    }
    
    // Get authenticated user ID directly from request.auth
    const userId = request.auth?.userId;
    const userRole = request.auth?.role;
    
    if (!userId) {
      logger.error('Authentication required for DELETE /api/users');
      return formatResponse.unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
    }
    
    // Get service using dynamic import to prevent circular dependencies
    const { getServiceFactory } = await import('@/core/factories/serviceFactory.server');
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Delete users
    const result = {
      success: true,
      deletedCount: 0,
      errors: [] as { id: number; error: string }[]
    };
    
    // Process each ID
    for (const id of ids) {
      try {
        await userService.delete(Number(id), {
          userId: userId,
          role: userRole
        });
        result.deletedCount++;
      } catch (error) {
        result.errors.push({
          id: Number(id),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Return result
    return result;
  },
  {
    // Authentication is required
    requiresAuth: true,
    
    // Only admins can delete users
    requiredRole: UserRole.ADMIN,
    
    // Require specific permissions
    requiredPermission: ['users.delete'],
  }
);