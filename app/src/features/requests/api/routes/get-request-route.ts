/**
 * Get Request API Route Handler
 * 
 * Handles fetching a single request by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * Gets a request by ID
 * 
 * @param request - HTTP request
 * @param params - URL parameters including request ID
 * @returns HTTP response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Request fetch attempted without authentication');
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
      );
    }
    
    // Validate ID
    const requestId = parseInt(params.id, 10);
    if (isNaN(requestId)) {
      return NextResponse.json(
        formatResponse.error('Invalid request ID', 400),
        { status: 400 }
      );
    }
    
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.REQUESTS_VIEW
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission ${SystemPermission.REQUESTS_VIEW}`);
      return NextResponse.json(
        formatResponse.error(
          `You don't have permission to view requests`, 
          403
        ),
        { status: 403 }
      );
    }
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Check if request exists and fetch details
    const requestData = await requestService.getById(requestId);
    
    if (!requestData) {
      return NextResponse.json(
        formatResponse.error('Request not found', 404),
        { status: 404 }
      );
    }
    
    // Optionally get additional details if requested
    const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
    
    if (detailed) {
      const detailedRequest = await requestService.findRequestById(requestId);
      return NextResponse.json(
        formatResponse.success(detailedRequest, 'Request details retrieved'),
        { status: 200 }
      );
    }
    
    // Return the request data
    return NextResponse.json(
      formatResponse.success(requestData, 'Request retrieved'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId: params.id
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to fetch request',
        500
      ),
      { status: 500 }
    );
  }
}
