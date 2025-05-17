/**
 * Get Requests API Route Handler
 * 
 * Handles fetching multiple requests with filtering and pagination
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { RequestStatus, RequestType } from '@/domain/enums/CommonEnums';

/**
 * Gets a list of requests with filtering and pagination
 * 
 * @param request - HTTP request
 * @returns HTTP response
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Requests list fetch attempted without authentication');
      return NextResponse.json(
        formatResponse.error('Authentication required', 401),
        { status: 401 }
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
    
    // Extract filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    
    // Parse status array if provided
    let statusFilter: RequestStatus[] | undefined;
    if (searchParams.has('status')) {
      const statusParam = searchParams.get('status');
      if (statusParam) {
        statusFilter = statusParam.split(',') as RequestStatus[];
      }
    }
    
    // Parse type array if provided
    let typeFilter: RequestType[] | undefined;
    if (searchParams.has('type')) {
      const typeParam = searchParams.get('type');
      if (typeParam) {
        typeFilter = typeParam.split(',') as RequestType[];
      }
    }
    
    // Parse tags array if provided
    let tagsFilter: string[] | undefined;
    if (searchParams.has('tags')) {
      const tagsParam = searchParams.get('tags');
      if (tagsParam) {
        tagsFilter = tagsParam.split(',');
      }
    }
    
    const filters = {
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      search: searchParams.get('search') || undefined,
      status: statusFilter,
      type: typeFilter,
      customerId: searchParams.has('customerId') ? parseInt(searchParams.get('customerId')!, 10) : undefined,
      processorId: searchParams.has('processorId') ? parseInt(searchParams.get('processorId')!, 10) : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc',
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      priority: searchParams.get('priority') as 'low' | 'medium' | 'high' | 'urgent' | undefined,
      tags: tagsFilter
    };
    
    // Validate pagination parameters
    if (isNaN(filters.page) || filters.page < 1) {
      filters.page = 1;
    }
    
    if (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 100) {
      filters.limit = 10;
    }
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Fetch requests with filtering
    const requestsResult = await requestService.findAll({ filters });
    
    // Return the requests with pagination metadata
    return NextResponse.json(
      formatResponse.success(requestsResult, 'Requests retrieved'),
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error fetching requests:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to fetch requests',
        500
      ),
      { status: 500 }
    );
  }
}
