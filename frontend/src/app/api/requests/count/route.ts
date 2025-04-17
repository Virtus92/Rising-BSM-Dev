import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiPermissions } from '../../helpers/apiPermissions';

/**
 * GET /api/requests/count
 * Returns the total count of contact requests in the system
 */
export const GET = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      // Context for service calls
      const context = { userId: req.auth?.userId };
      
      // Extract filters from query parameters
      const { searchParams } = new URL(req.url);
      const filters = {
        status: searchParams.get('status') || undefined,
        type: searchParams.get('type') || undefined,
        assignedTo: searchParams.has('assignedTo') ? parseInt(searchParams.get('assignedTo')!) : undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined
      };
      
      // Get count from service with any filters
      const count = await serviceFactory.createRequestService().count({
        context,
        filters
      });
      
      return formatResponse.success({ count }, 'Request count retrieved successfully');
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);
