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
 * GET /api/requests/[id]
 * 
 * Ruft eine einzelne Kontaktanfrage ab.
 */
export const GET = routeHandler(
  withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();

      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }

      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Get request by ID
      const request = await requestService.findRequestById(requestId, { context });
      
      return formatResponse.success(request, 'Request retrieved successfully');
    },
    SystemPermission.REQUESTS_VIEW
  ),
  { requiresAuth: true }
);

/**
 * PUT /api/requests/[id]
 * 
 * Aktualisiert eine Kontaktanfrage.
 */
export const PUT = routeHandler(
  withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }
      
      // Parse request body
      const data = await req.json();
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Update request
      const updatedRequest = await requestService.updateRequest(requestId, data, { context });
      
      return formatResponse.success(updatedRequest, 'Request updated successfully');
    },
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);

/**
 * DELETE /api/requests/[id]
 * 
 * Löscht eine Kontaktanfrage.
 */
export const DELETE = routeHandler(
  withPermission(
    async (req: NextRequest, { params }: RequestParams) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      
      const requestId = parseInt(params.id);
      if (isNaN(requestId)) {
        return formatResponse.error('Invalid request ID', 400);
      }
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Delete request
      const result = await requestService.deleteRequest(requestId, { context });
      
      if (result) {
        return formatResponse.success(null, 'Request deleted successfully');
      } else {
        return formatResponse.error('Failed to delete request', 500);
      }
    },
    SystemPermission.REQUESTS_DELETE
  ),
  { requiresAuth: true }
);
