/**
 * GET /api/users/count
 * Get user count
 */
import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using the correct pattern with role
    if (!await permissionMiddleware.hasPermission(
      request.auth?.userId as number, 
      SystemPermission.USERS_VIEW,
      request.auth?.role
    )) {
      logger.warn(`Permission denied: User ${request.auth?.userId} does not have permission ${SystemPermission.USERS_VIEW}`);
      return NextResponse.json(
        formatResponse.error('You dont have permission to view user statistics', 403),
        { status: 403 }
      );
    }
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Extract filters from query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
      includeDeleted: searchParams.get('includeDeleted') === 'true'
    };
    
    // Get count from service with any filters
    const result = await userService.count({
      context,
      filters
    });
    
    // Ensure we always respond with a consistent format
    const count = typeof result === 'number' ? result : 0;
    
    return NextResponse.json(
      formatResponse.success({ count }, 'User count retrieved successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error counting users:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to retrieve user count',
        500
      ),
      { status: 500 }
    );
  }
}, {
  requiresAuth: true
});
