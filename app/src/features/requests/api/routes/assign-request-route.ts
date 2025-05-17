import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/features/auth/api/middleware/authMiddleware';
import { formatResponse } from '@/core/errors';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { AssignRequestRequest } from '../models/request-request-models';

/**
 * PATCH handler for assigning a request to a processor
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with updated request
 */
export const PATCH = auth(
  async (request: NextRequest, user: any) => {
    try {
      // Extract ID from URL
      const urlParts = request.url.split('/');
      const idStr = urlParts[urlParts.length - 2]; // Get the ID from the URL path
      const id = Number(idStr);
      
      if (isNaN(id) || id <= 0) {
        return formatResponse.error('Invalid request ID', 400);
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
      
      // Assign request
      const result = await requestService.assignRequest(id, data.processorId, data.note, {
        context: {
          userId: user.id // Use the user from auth middleware
        }
      });

      // Return formatted response
      return formatResponse.success(result, 'Request assigned successfully');
    } catch (error) {
      console.error('Error assigning request:', error);
      return formatResponse.error(
        error instanceof Error ? error.message : 'An error occurred while assigning the request', 
        500
      );
    }
  },
  {
    requireAuth: true,
    requiredPermission: [SystemPermission.REQUESTS_ASSIGN]
  }
);
