import { NextRequest } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/route-handler';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
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
export const PUT = auth(
  async (request: NextRequest, user: any) => {
    try {
      // Extract ID from URL path segments
      const urlParts = request.nextUrl.pathname.split('/');
      const id = Number(urlParts[urlParts.length - 2]); // Take the second-to-last segment (the [id] part)
      
      if (isNaN(id) || id <= 0) {
        return formatResponse.error('Invalid request ID', 400);
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

    // User is already authenticated by auth middleware
    const userId = user.id;
    
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
  },
  {
    requireAuth: true,
    requiredPermission: [SystemPermission.REQUESTS_EDIT]
  }
);

