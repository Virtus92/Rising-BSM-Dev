import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { withPermission } from '@/features/permissions/api/middleware/permissionMiddleware';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/link-customer
 * 
 * Links a request with an existing customer.
 */
export const POST = routeHandler(
  // Fix: Re-adding await here to match your implementation requirements
  await withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();

      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }
      
      // Parse request body
      const body = await req.json();
      const { customerId, note } = body;
      
      if (!customerId) {
        return formatResponse.error('Customer ID is required', 400);
      }
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      try {
        // Link request to customer
        const updatedRequest = await requestService.linkToCustomer(requestId, customerId, note, { context });
        
        return formatResponse.success(updatedRequest, 'Request successfully linked to customer');
      } catch (error) {
        logger.error('Error linking request to customer', {
          error,
          requestId,
          customerId,
          userId: context.userId
        });
        return formatResponse.error(
          error instanceof Error ? error.message : 'Failed to link request to customer',
          500
        );
      }
    },
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);