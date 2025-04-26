import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { API_PERMISSIONS } from '../../helpers/apiPermissions';

/**
 * GET /api/requests/count
 * Returns the total count of contact requests in the system
 */
export const GET = routeHandler(
  permissionMiddleware.withPermission(
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
      const result = await serviceFactory.createRequestService().count({
        context,
        filters
      });
      
      // Ensure we have a proper count response
      let count = 0;
      
      if (typeof result === 'number') {
        count = result;
      } else if (result && typeof result === 'object') {
        // Use type assertion to avoid 'never' type issues
        const typedResult = result as Record<string, any>;
        if ('count' in typedResult) {
          count = typedResult.count;
        } else if ('total' in typedResult) {
          count = typedResult.total;
        }
      }
      
      return formatResponse.success({ count }, 'Request count retrieved successfully');
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);
