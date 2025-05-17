/**
 * List Users API Route Handler
 * Handles retrieving users with filtering and pagination
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { UserFilterParamsDto } from '@/domain/dtos/UserDtos';
import { UserStatus, UserRole } from '@/domain/enums/UserEnums';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * Handles GET /api/users - List all users with filtering and pagination
 */
export async function listUsersHandler(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('User list access attempted without authentication');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.USERS_VIEW
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.USERS_VIEW}`);
      return formatResponse.error(
        `You don't have permission to view users`, 
        403
      );
    }
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const sortDirectionParam = searchParams.get('sortDirection');
    
    const filterParams: UserFilterParamsDto = {
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: (sortDirectionParam === 'asc' || sortDirectionParam === 'desc') 
        ? sortDirectionParam 
        : 'desc',
      status: searchParams.get('status') ? (searchParams.get('status') as UserStatus) : undefined,
      role: searchParams.get('role') ? (searchParams.get('role') as UserRole) : undefined,
      search: searchParams.get('search') || undefined
    };

    // Debug log the filter parameters
    logger.debug('Filter parameters for user list:', filterParams);

    // Get user service from service factory
    const userService = serviceFactory.createUserService();
    
    // Get users through the service
    const result = await userService.getAll({
      context: { userId: request.auth?.userId },
      page: filterParams.page,
      limit: filterParams.limit,
      filters: {
        status: filterParams.status,
        role: filterParams.role,
        search: filterParams.search
      },
      sort: {
        field: filterParams.sortBy || 'createdAt',
        direction: (filterParams.sortDirection?.toLowerCase() || 'desc') as 'asc' | 'desc'
      }
    });
    
    return formatResponse.success(result, 'Users retrieved successfully');
  } catch (error) {
    logger.error('Error fetching users:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch users',
      500
    );
  }
}