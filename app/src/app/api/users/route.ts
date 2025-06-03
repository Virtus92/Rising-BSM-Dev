/**
 * User API Route
 * 
 * This endpoint handles user listing, creation, and bulk deletion
 * with proper authentication and permission checks.
 * Supports both JWT and API key authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { UserRole, UserStatus } from '@/domain';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';

const logger = getLogger();

/**
 * GET /api/users
 * 
 * Get all users with proper auth and error handling
 * Supports both JWT and API key authentication
 */
export const GET = routeHandler(
  async (req: NextRequest) => {
    try {
      // Get user context from auth
      const auth = (req as any).auth;
      const userId = auth?.userId || auth?.user?.id;
      
      logger.debug('Processing GET /users request', {
        authMethod: auth?.authMethod,
        userId: userId,
        userRole: auth?.role
      });

      // Get query parameters for pagination and filtering
      const searchParams = req.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status') || undefined;
      const role = searchParams.get('role') || undefined;
      const sortBy = searchParams.get('sortBy') || 'name';
      const sortDirection = searchParams.get('sortDirection') || 'asc';
      const search = searchParams.get('search') || undefined;

      // Get service using dynamic import to prevent circular dependencies
      const { getServiceFactory } = await import('@/core/factories/serviceFactory.server');
      const serviceFactory = getServiceFactory();
      const userService = serviceFactory.createUserService();

      // Get users with pagination and filtering
      const result = await userService.findUsers({
        page,
        limit,
        status: status as UserStatus || undefined,
        role: role as any || undefined,
        search,
        sortBy,
        sortDirection: sortDirection as 'asc' | 'desc'
      }, {
        userId: userId
      });

      logger.debug('Successfully retrieved users', {
        count: result.data.length,
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit
      });

      return NextResponse.json(formatResponse.success(result, 'Users retrieved successfully'));
    } catch (error) {
      logger.error('Error fetching users:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        formatResponse.error(
          error instanceof Error ? error.message : 'Failed to fetch users',
          500
        ),
        { status: 500 }
      );
    }
  },
  {
    requiresAuth: true,
    allowApiKeyAuth: true,
    allowBothAuth: true,
    requiredPermission: [SystemPermission.USERS_VIEW],
    allowedApiKeyTypes: ['admin', 'standard'],
    allowedApiKeyEnvironments: ['production', 'development']
  }
);

/**
 * POST /api/users
 * 
 * Create a new user with API key or JWT authentication
 */
export const POST = routeHandler(
  async (req: NextRequest) => {
    try {
      // Get user context from auth
      const auth = (req as any).auth;
      const userId = auth?.userId || auth?.user?.id;
      const userRole = auth?.role || auth?.user?.role;

      logger.debug('Processing POST /users request', {
        authMethod: auth?.authMethod,
        userId: userId,
        userRole: userRole
      });

      // Parse request body
      const data = await req.json();
      
      // Remove confirmPassword field if it exists to prevent Prisma errors
      const { confirmPassword, ...cleanData } = data;

      // Get service using dynamic import to prevent circular dependencies
      const { getServiceFactory } = await import('@/core/factories/serviceFactory.server');
      const serviceFactory = getServiceFactory();
      const userService = serviceFactory.createUserService();

      // Create user
      const newUser = await userService.create(cleanData, {
        userId: userId,
        role: userRole
      });

      return NextResponse.json(
        formatResponse.success(newUser, 'User created successfully', 201),
        { status: 201 }
      );
    } catch (error) {
      logger.error('Error creating user:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        formatResponse.error(
          error instanceof Error ? error.message : 'Failed to create user',
          500
        ),
        { status: 500 }
      );
    }
  },
  {
    requiresAuth: true,
    allowApiKeyAuth: true,
    allowBothAuth: true,
    requiredPermission: [SystemPermission.USERS_CREATE],
    allowedApiKeyTypes: ['admin'], // Only admin API keys can create users
    allowedApiKeyEnvironments: ['production', 'development']
  }
);

/**
 * DELETE /api/users
 * 
 * Bulk delete users with API key or JWT authentication
 */
export const DELETE = routeHandler(
  async (req: NextRequest) => {
    try {
      // Parse request body
      const data = await req.json();
      const { ids } = data;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          formatResponse.error('Invalid request: missing or empty ids array', 400),
          { status: 400 }
        );
      }

      // Get user context from auth
      const auth = (req as any).auth;
      const userId = auth?.userId || auth?.user?.id;
      const userRole = auth?.role || auth?.user?.role;

      logger.debug('Processing DELETE /users request', {
        authMethod: auth?.authMethod,
        userId: userId,
        userRole: userRole,
        idsToDelete: ids
      });

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

      return NextResponse.json(formatResponse.success(result, 'Bulk delete completed'));
    } catch (error) {
      logger.error('Error in bulk delete:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return NextResponse.json(
        formatResponse.error(
          error instanceof Error ? error.message : 'Failed to delete users',
          500
        ),
        { status: 500 }
      );
    }
  },
  {
    requiresAuth: true,
    allowApiKeyAuth: true,
    allowBothAuth: true,
    requiredPermission: [SystemPermission.USERS_DELETE],
    allowedApiKeyTypes: ['admin'], // Only admin API keys can delete users
    allowedApiKeyEnvironments: ['production', 'development']
  }
);
