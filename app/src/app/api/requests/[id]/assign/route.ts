import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { withPermission } from '@/app/api/helpers/apiPermissions';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/assign
 * 
 * Weist eine Kontaktanfrage einem Benutzer zu.
 */
export const POST = routeHandler(
  withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();

      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }
      
      // Parse request body
      const body = await req.json();
      const { userId, note } = body;
      
      if (!userId) {
        return formatResponse.error('User ID is required', 400);
      }
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Assign request to user
      const updatedRequest = await requestService.assignRequest(requestId, userId, note, { context });
      
      return formatResponse.success(updatedRequest, 'Request assigned successfully');
    },
    SystemPermission.REQUESTS_ASSIGN
  ),
  { requiresAuth: true }
);
