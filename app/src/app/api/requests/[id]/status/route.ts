import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { withPermission } from '@/features/permissions/api/middleware/permissionMiddleware';
import { RequestStatusUpdateDto } from '@/domain/dtos/RequestDtos';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * PATCH and PUT /api/requests/[id]/status
 * 
 * Aktualisiert den Status einer Kontaktanfrage.
 */
export const PATCH = routeHandler(
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
      const statusUpdateData: RequestStatusUpdateDto = {
        status: body.status,
        note: body.note
      };
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Update request status
      const updatedRequest = await requestService.updateRequestStatus(requestId, statusUpdateData, { context });
      
      return formatResponse.success(updatedRequest, 'Request status updated successfully');
    },
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);

/**
 * PUT /api/requests/[id]/status
 * 
 * Alias for PATCH to maintain compatibility with client implementation.
 */
export const PUT = routeHandler(
  withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      logger.debug('PUT request received for status update, delegating to PATCH handler');
      
      // Call the same handler code as PATCH
      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }
      
      // Parse request body
      const body = await req.json();
      const statusUpdateData: RequestStatusUpdateDto = {
        status: body.status,
        note: body.note
      };
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const serviceFactory = getServiceFactory();
      const requestService = serviceFactory.createRequestService();
      
      // Update request status
      const updatedRequest = await requestService.updateRequestStatus(requestId, statusUpdateData, { context });
      
      return formatResponse.success(updatedRequest, 'Request status updated successfully');
    },
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);