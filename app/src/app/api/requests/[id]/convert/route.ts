import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { ConvertToCustomerDto } from '@/domain/dtos/RequestDtos';

/**
 * POST /api/requests/[id]/convert
 * 
 * Converts a contact request to a customer.
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  // Extract the ID from the URL path
  const urlParts = req.nextUrl.pathname.split('/');
  const requestIdIndex = urlParts.findIndex(part => part === 'requests') + 1;
  const id = urlParts[requestIdIndex];
  const requestId = parseInt(id);
  
  if (isNaN(requestId)) {
    return formatResponse.error('Invalid request ID', 400);
  }
  
  // Check permission directly
  const permissionCheck = await permissionMiddleware.checkPermission(req, SystemPermission.REQUESTS_EDIT);
  if (!permissionCheck.success) {
    return formatResponse.forbidden(permissionCheck.message || 'Permission denied', permissionCheck.error);
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
  
  try {
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Convert request to customer
    const result = await requestService.convertToCustomer(convertData, { context });
    
    return formatResponse.success(result, 'Request successfully converted to customer');
  } catch (error) {
    logger.error('Error converting request to customer', {
      error,
      requestId,
      userId: context.userId
    });
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to convert request to customer',
      500
    );
  }
}, { requiresAuth: true });