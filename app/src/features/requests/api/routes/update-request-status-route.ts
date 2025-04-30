/**
 * Update Request Status Route
 * Handles updating request status with proper error handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { NotFoundError, ValidationError } from '@/core/errors/types/AppError';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';
import { routeHandler } from '@/core/api/route-handler';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { RequestStatus } from '@/domain/enums/CommonEnums';
import { apiAuth } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

const logger = getLogger();

/**
 * Request data for updating status
 */
interface UpdateStatusRequest {
  status: RequestStatus;
  note?: string;
}

/**
 * Validate request data
 */
function validateUpdateStatusRequest(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Check if status is provided
  if (!data.status) {
    errors.push('Status is required');
  }
  
  // Check if status is valid
  if (data.status && !Object.values(RequestStatus).includes(data.status)) {
    errors.push(`Invalid status. Must be one of: ${Object.values(RequestStatus).join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Update request status handler
 * 
 * @param request Next.js request
 * @param data Request data
 * @param context Route context
 * @returns Updated request
 */
export const updateRequestStatusHandler = async (
  request: NextRequest,
  data: UpdateStatusRequest,
  context: { auth?: { userId?: number }, params?: { id?: string } }
) => {
  // Extract ID from context
  const id = context.params?.id ? parseInt(context.params.id, 10) : NaN;
  
  if (isNaN(id)) {
    throw new ValidationError('Invalid request ID', 'INVALID_REQUEST_ID');
  }
  
  // User ID is available from context after auth middleware
  const userId = context.auth?.userId;
  
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Validate status
  if (!data.status || !Object.values(RequestStatus).includes(data.status)) {
    throw new ValidationError(
      `Invalid status. Must be one of: ${Object.values(RequestStatus).join(', ')}`,
      'INVALID_STATUS'
    );
  }
  
  // Get request service
  const serviceFactory = getServiceFactory();
  const requestService = serviceFactory.createRequestService();
  
  // Check if request exists
  const request_ = await requestService.getById(id);
  
  if (!request_) {
    throw new NotFoundError(`Request with ID ${id} not found`, 'REQUEST_NOT_FOUND');
  }
  
  // Update request status
  const result = await requestService.updateRequestStatus(
    id,
    {
      status: data.status,
      note: data.note
    },
    {
      context: {
        userId
      }
    }
  );
  
  logger.info(`Request ${id} status updated to ${data.status} by user ${userId}`);
  
  // Return updated request
  return result;
};

/**
 * PATCH /api/requests/:id/status route
 */
export const PATCH = routeHandler(
  async (request: NextRequest) => {
    try {
      // Parse the request body
      const data = await request.json() as UpdateStatusRequest;
      
      // Extract ID from URL path segments
      const urlParts = request.nextUrl.pathname.split('/');
      const id = urlParts[urlParts.length - 2]; // Take the second-to-last segment (the [id] part)
      
      // Create context with authentication info
      const context = {
        auth: { userId: 0 },
        params: { id }
      };
      
      // Authenticate user
      const auth = await apiAuth(request);
      if (!auth) {
        return formatResponse.error('Authentication required', 401);
      }
      
      // Set userId in context if authenticated
      if (auth.user?.id) {
        context.auth.userId = auth.user.id;
      }
      
      // Verify permissions
      const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.REQUESTS_EDIT]);
      if (!permissionCheck.success) {
        return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
      }
      
      // Validate the request data
      const validation = validateUpdateStatusRequest(data);
      if (!validation.valid) {
        return formatResponse.error(validation.errors?.join(', ') || 'Invalid request data', 400);
      }
      
      // Call the handler with the prepared context
      const result = await updateRequestStatusHandler(request, data, context);
      return formatResponse.success(result, 'Status updated successfully');
    } catch (error) {
      return formatResponse.error('An error occurred while updating the request status', 500);
    }
  }
);
