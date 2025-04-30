import { NextResponse, NextRequest } from 'next/server';
import { apiAuth } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { AssignRequestRequest } from '../models/request-request-models';

/**
 * PATCH handler for assigning a request to a processor
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with updated request
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract ID from route parameters
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    const session = await apiAuth(request);
    if (!session) {
      return formatResponse.error('Authentication required', 401);
    }
    // Check if user is authenticated
    if (!session.user) {
      return formatResponse.error('User not authenticated', 401);
    }
    
    // Access user info from either session or request.auth
    const userId = (request as any).auth?.userId || session.user.id;

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.REQUESTS_ASSIGN]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }

    // Parse request body
    const data: AssignRequestRequest = await request.json();

    // Validate processor ID
    if (!data.processorId || isNaN(data.processorId) || data.processorId <= 0) {
      return formatResponse.error('Invalid processor ID', 400);
    }

    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();

    // User ID is already obtained from the auth session above
    
    // Assign request
    const result = await requestService.assignRequest(id, data.processorId, data.note, {
      context: {
        userId
      }
    });

    // Return formatted response
    return formatResponse.success(result, 'Request assigned successfully');
  } catch (error) {
    return formatResponse.error('An error occurred while assigning the request', 500);
  }
}
