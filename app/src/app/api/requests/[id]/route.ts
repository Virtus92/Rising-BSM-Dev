import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/core/errors/index';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { validateId } from '@/shared/utils/validation-utils';

/**
 * GET /api/requests/[id]
 * 
 * Retrieves a single request by ID
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Get ID from params (provided by Next.js route handler)
  const id = req.nextUrl.pathname.split('/').pop() || '';
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.REQUESTS_VIEW
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.REQUESTS_VIEW}`);
      return formatError(
        `You don't have permission to view request details`, 
        403
      );
    }
    
    if (!id) {
      logger.error('No request ID provided');
      return formatError('No request ID provided', 400);
    }
    
    // Use consistent ID validation
    const requestId = validateId(id);
    if (requestId === null) {
      logger.error(`Invalid request ID: ${id}`);
      return formatError(`Invalid request ID: ${id} - must be a positive number`, 400);
    }
    
    // Log request details for debugging
    logger.debug(`Fetching request details for ID: ${requestId}`, {
      userId: req.auth?.userId
    });
    
    // Get request service from factory
    const requestService = serviceFactory.createRequestService();
    
    // Create context for service calls
    const context = {
      userId: req.auth?.userId,
      userRole: req.auth?.role
    };
    
    // Retrieve request with the specified ID
    const request = await requestService.findRequestById(requestId, { context });
    
    if (!request) {
      logger.warn(`Request not found: ${requestId}`);
      return formatNotFound('Request not found');
    }
    
    // Log successful retrieval
    logger.debug(`Successfully retrieved request: ${requestId}`);
    
    // Success response
    return formatSuccess(request, 'Request retrieved successfully');
    
  } catch (error) {
    logger.error('Error fetching request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId: id,
      userId: req.auth?.userId
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error retrieving the request',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * PUT /api/requests/[id]
 * 
 * Updates a request by ID
 */
export const PUT = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Get ID from params (provided by Next.js route handler)
  const id = req.nextUrl.pathname.split('/').pop() || '';
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.REQUESTS_EDIT
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.REQUESTS_EDIT}`);
      return formatError(
        `You don't have permission to edit request information`, 
        403
      );
    }
    
    if (!id) {
      logger.error('No request ID provided');
      return formatError('No request ID provided', 400);
    }
    
    // Use consistent ID validation
    const requestId = validateId(id);
    if (requestId === null) {
      logger.error(`Invalid request ID: ${id}`);
      return formatError(`Invalid request ID: ${id} - must be a positive number`, 400);
    }
    
    // Parse request body as JSON
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
    
    // Success response
    return formatSuccess(updatedRequest, 'Request updated successfully');
    
  } catch (error) {
    logger.error('Error updating request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId: id,
      userId: req.auth?.userId
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error).validationErrors,
        'Request validation failed'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Error updating request',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * DELETE /api/requests/[id]
 * 
 * Deletes a request by ID
 */
export const DELETE = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Get ID from params (provided by Next.js route handler)
  const id = req.nextUrl.pathname.split('/').pop() || '';
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.REQUESTS_DELETE
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.REQUESTS_DELETE}`);
      return formatError(
        `You don't have permission to delete requests`, 
        403
      );
    }
    
    if (!id) {
      logger.error('No request ID provided');
      return formatError('No request ID provided', 400);
    }
    
    // Use consistent ID validation
    const requestId = validateId(id);
    if (requestId === null) {
      logger.error(`Invalid request ID: ${id}`);
      return formatError(`Invalid request ID: ${id} - must be a positive number`, 400);
    }
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Create context for service calls
    const context = {
      userId: req.auth?.userId,
      userRole: req.auth?.role
    };
    
    // Delete request
    const result = await requestService.deleteRequest(requestId, { context });
    
    if (result) {
      return formatSuccess(null, 'Request deleted successfully');
    } else {
      return formatError('Failed to delete request', 500);
    }
    
  } catch (error) {
    logger.error('Error deleting request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId: id,
      userId: req.auth?.userId
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error deleting request',
      500
    );
  }
}, {
  requiresAuth: true
});
