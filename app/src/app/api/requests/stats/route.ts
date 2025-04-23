import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { apiPermissions } from '../../helpers/apiPermissions';

/**
 * GET /api/requests/stats
 * 
 * Returns statistics about contact requests.
 */
export const GET = apiRouteHandler(
  apiPermissions.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      // Get URL parameters
      const { searchParams } = new URL(req.url);
      const period = searchParams.get('period') || 'month';

      // Create context with user ID
      const context = { userId: req.auth?.userId };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Get request stats
      const stats = await requestService.getRequestStats(period, { context });
      
      return formatResponse.success(stats, 'Request statistics retrieved successfully');
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);
