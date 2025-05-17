import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { withPermission } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * GET /api/requests/stats
 * 
 * Returns statistics about contact requests.
 */
export const GET = routeHandler(
  await withPermission(
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
