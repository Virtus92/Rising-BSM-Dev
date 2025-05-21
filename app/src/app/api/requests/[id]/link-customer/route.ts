import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

/**
 * POST /api/requests/[id]/link-customer
 * 
 * Links a request with an existing customer.
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
  const { customerId, note } = body;
  
  if (!customerId) {
    return formatResponse.error('Customer ID is required', 400);
  }
  
  // Create context for service calls
  const context = {
    userId: req.auth?.userId,
    userRole: req.auth?.role
  };
  
  try {
    // Get repositories
    const requestService = serviceFactory.createRequestService();
    const customerService = serviceFactory.createCustomerService();
    
    // Verify customer exists using the standard getById method from IBaseService
    const customer = await customerService.getById(customerId);
    if (!customer) {
      return formatResponse.error('Customer not found', 404);
    }
    
    // Link request to customer
    const updatedRequest = await requestService.linkToCustomer(requestId, customerId, note, { context });
    
    return formatResponse.success(updatedRequest, 'Request linked to customer successfully');
  } catch (error) {
    logger.error('Error linking request to customer:', error as Error);
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to link request to customer',
      500
    );
  }
}, { requiresAuth: true });