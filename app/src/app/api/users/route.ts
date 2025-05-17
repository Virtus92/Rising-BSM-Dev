/**
 * Example API Route with Standard Pattern
 * 
 * This demonstrates the proper way to implement API routes with the
 * new architecture and authentication system.
 */

import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { UserRole, UserStatus } from '@/domain';

/**
 * GET /api/users
 * 
 * Get all users with proper auth and error handling
 */
export const GET = routeHandler(
  async (request: NextRequest, context) => {
    // User is available in context
    const { user } = context;
    
    // Get query parameters for pagination and filtering
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    // Get service using dynamic import to prevent circular dependencies
    const { getServiceFactory } = await import('@/core/factories/serviceFactory.server');
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get users with pagination and filtering
    const result = await userService.findUsers({
      page,
      limit,
      status: status as UserStatus || undefined,
    });
    
    // Return data directly - routeHandler will format it properly
    return result;
  },
  {
    // Authentication is required by default
    requiresAuth: true,
    
    // Require specific role
    requiredRole: UserRole.ADMIN,
    
    // Require specific permissions
    requiredPermission: ['users.view'],
  }
);

/**
 * POST /api/users
 * 
 * Create a new user
 */
export const POST = routeHandler(
  async (request: NextRequest, context) => {
    // Parse request body
    const data = await request.json();
    
    // Get service using dynamic import to prevent circular dependencies
    const { getServiceFactory } = await import('@/core/factories/serviceFactory.server');
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Create user
    const result = await userService.create(data, {
      context: {
        userId: context.user.id,
        role: context.user.role,
      }
    });
    
    // Return result
    return result;
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
          context: {
            userId: context.user.id,
            role: context.user.role,
          }
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
