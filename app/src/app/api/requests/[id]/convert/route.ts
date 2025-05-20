import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { withPermission } from '@/features/permissions/api/middleware/permissionMiddleware';
import { ConvertToCustomerDto } from '@/domain/dtos/RequestDtos';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/convert
 * 
 * Converts a contact request to a customer.
 */
export const POST = routeHandler(
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
      const { 
        customerData = {}, 
        note
      } = body;
      
      // Create convert to customer DTO - always set createAppointment to false
      const convertData: ConvertToCustomerDto = {
        requestId,
        customerData,
        note,
        createAppointment: false, // Never create appointments from requests
      };
      
      // Create context for service calls
      const context = {
        userId: req.auth?.userId,
        userRole: req.auth?.role
      };
      
      // Get request service
      const requestService = serviceFactory.createRequestService();
      
      // Convert request to customer
      const result = await requestService.convertToCustomer(convertData, { context });
      
      return formatResponse.success(result, 'Request successfully converted to customer');
    },
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);