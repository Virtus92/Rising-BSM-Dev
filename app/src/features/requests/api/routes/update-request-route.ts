import { NextResponse } from 'next/server';
import { apiAuth } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UpdateRequestRequest } from '../models/request-request-models';
import { UpdateRequestDto, RequestSource } from '@/domain/dtos/RequestDtos';
/**
 * PUT handler for updating a request
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with updated request
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Extract ID from route parameters
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    const auth = await apiAuth.auth(request);
    if (!auth.success) {
      return formatResponse.error(auth.message || 'Authentication required', auth.status || 401);
    }

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.REQUESTS_EDIT]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }
      // Parse request body
    const requestData: UpdateRequestRequest = await request.json();

    // Convert the request model to DTO with proper enum type
    const data: UpdateRequestDto = {
      ...requestData,
      source: requestData.source ? requestData.source as RequestSource : undefined
    };

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
    
    // Update request
    const result = await requestService.updateRequest(id, data, {
      context: {
        userId
      }
    });

    // Return formatted response
    return formatResponse.success(result, 'Request updated successfully');
  } catch (error) {
    return formatResponse.error('An error occurred while updating the request', 500);
  }
}
