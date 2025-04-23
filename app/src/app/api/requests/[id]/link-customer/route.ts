import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiPermissions } from '../../../helpers/apiPermissions';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/link-customer
 * 
 * Verknüpft eine Kontaktanfrage mit einem bestehenden Kunden.
 */
export const POST = apiRouteHandler(
  apiPermissions.withPermission(
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
      
      // Link request to customer
      const updatedRequest = await requestService.linkToCustomer(requestId, customerId, note, { context });
      
      return formatResponse.success(updatedRequest, 'Request successfully linked to customer');
    },
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);