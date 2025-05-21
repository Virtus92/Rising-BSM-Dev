import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { RequestStatusUpdateDto } from '@/domain/dtos/RequestDtos';

/**
 * PATCH /api/requests/[id]/status
 * 
 * Updates the status of a request.
 */
export const PATCH = routeHandler(async (req: NextRequest) => {
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
  
  try {
    // Update request status
    const updatedRequest = await requestService.updateRequestStatus(requestId, statusUpdateData, { context });
    
    return formatResponse.success(updatedRequest, 'Request status updated successfully');
  } catch (error) {
    logger.error('Error updating request status', {
      error,
      requestId,
      status: statusUpdateData.status,
      userId: context.userId
    });
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to update request status',
      500
    );
  }
}, { requiresAuth: true });

/**
 * PUT /api/requests/[id]/status
 * 
 * Alias for PATCH to maintain compatibility with client implementation.
 */
export const PUT = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  logger.debug('PUT request received for status update, delegating to PATCH handler');
  
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
  const statusUpdateData: RequestStatusUpdateDto = {
    status: body.status,
    note: body.note
  };
  
  // Create context for service calls
  const context = {
    userId: req.auth?.userId,
    userRole: req.auth?.role
  };
  
  try {
    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();
    
    // Update request status
    const updatedRequest = await requestService.updateRequestStatus(requestId, statusUpdateData, { context });
    
    return formatResponse.success(updatedRequest, 'Request status updated successfully');
  } catch (error) {
    logger.error('Error updating request status (PUT)', {
      error,
      requestId,
      status: statusUpdateData.status,
      userId: context.userId
    });
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to update request status',
      500
    );
  }
}, { requiresAuth: true });