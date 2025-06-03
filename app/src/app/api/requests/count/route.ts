/**
 * GET /api/requests/count
 * Returns the total count of contact requests in the system
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
      SystemPermission.REQUESTS_VIEW,
      request.auth?.role
    )) {
      logger.warn(`Permission denied: User ${request.auth?.userId} does not have permission ${SystemPermission.REQUESTS_VIEW}`);
      return NextResponse.json(
        formatResponse.error('You dont have permission to view request statistics', 403),
        { status: 403 }
      );
    }
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Extract filters from query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      startDate: searchParams.has('startDate') 
        ? new Date(searchParams.get('startDate') as string) 
        : undefined,
      endDate: searchParams.has('endDate') 
        ? new Date(searchParams.get('endDate') as string) 
        : undefined,
      customerId: searchParams.has('customerId') 
        ? parseInt(searchParams.get('customerId') as string) 
        : undefined
    };
    
    // Get count from service with any filters
    const result = await requestService.count({
      context,
      filters
    });
    
    // Ensure we always respond with a consistent format
    const count = typeof result === 'number' ? result : 0;
    
    return NextResponse.json(
      formatResponse.success({ count }, 'Request count retrieved successfully'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error counting requests:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to retrieve request count',
        500
      ),
      { status: 500 }
    );
  }
}, {
  requiresAuth: true
});
