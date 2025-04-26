import { NextResponse } from 'next/server';
import { apiAuth } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UpdateRequestStatusRequest } from '../models/request-request-models';
import { RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * PATCH handler for updating a request's status
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with updated request
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Extract ID from route parameters
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    const auth = await apiAuth.auth(request);
    if (!auth || !auth.success) {
      return formatResponse.error(auth.message || 'Authentication required', auth.status || 401);
    }

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.REQUESTS_EDIT]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }

    // Parse request body
    const data: UpdateRequestStatusRequest = await request.json();

    // Validate status
    if (!data.status || !Object.values(RequestStatus).includes(data.status)) {
      return formatResponse.error(`Invalid status. Must be one of: ${Object.values(RequestStatus).join(', ')}`, 400);
    }

    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();

    // Import proper auth middleware and get user details from JWT token
    const { extractAuthToken } = await import('@/features/auth/api/middleware/authMiddleware');
    const token = extractAuthToken(request);
    let userId = 0;
    
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, jwtSecret) as any;
        userId = Number(decoded.sub) || 0;
      } catch (e) {
        // Continue with defaults if token decoding fails
      }
    }

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

    // Return formatted response
    return formatResponse.success(result, 'Request status updated successfully', 200);
  } catch (error) {
    return formatResponse.error('An error occurred while updating the request status', 500);
  }
}
