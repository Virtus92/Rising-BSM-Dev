/**
 * API route for requests
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiPermissions } from '../helpers/apiPermissions';
import { RequestFilterParamsDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/requests
 * Get requests with optional filtering
 */
export const GET = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      // Get query parameters for filtering
      const { searchParams } = new URL(req.url);
      const filters: RequestFilterParamsDto = {
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
        status: searchParams.get('status') as RequestStatus | undefined,
        service: searchParams.get('service') || undefined,
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortDirection: (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc',
        processorId: searchParams.get('processorId') ? parseInt(searchParams.get('processorId')!) : undefined,
        unassigned: searchParams.get('unassigned') === 'true',
        notConverted: searchParams.get('notConverted') === 'true'
      };
      
      // Parse date parameters if present
      if (searchParams.get('startDate')) {
        filters.startDate = new Date(searchParams.get('startDate')!);
      }
      
      if (searchParams.get('endDate')) {
        filters.endDate = new Date(searchParams.get('endDate')!);
      }
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Get requests with filtering
      const result = await requestService.findRequests(filters, { context });
      
      // Return paginated results
      return formatResponse.success(
        result,
        'Requests retrieved successfully'
      );
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);

/**
 * POST /api/requests
 * Create a new request
 */
export const POST = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  // Parse request body
  const data = await req.json();
  
  // Create context info
  const context = {
    userId: req.auth?.userId,
    ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
  };
  
  // Get request service
  const requestService = serviceFactory.createRequestService();
  
  // Create the request with proper validation
  const newRequest = await requestService.createRequest(data, { context });
  
  return formatResponse.success(newRequest, 'Request created successfully', 201);
}, {
  // This endpoint is public for contact form submissions
  requiresAuth: false
});
