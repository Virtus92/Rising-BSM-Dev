import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/features/auth/api/middleware/authMiddleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/route-handler';
import { IRequestService } from '@/domain/services/IRequestService';

/**
 * DELETE handler for deleting a request
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with success status
 */
export const DELETE = routeHandler(async (request: NextRequest) => {
  // Extract ID from URL path segments
  const urlParts = request.nextUrl.pathname.split('/');
  const id = Number(urlParts[urlParts.length - 2]); // Take the second-to-last segment (the [id] part)
  try {
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return formatResponse.error(authResult.message || 'Authentication required', authResult.statusCode || 401);
    }

    // Check permission
    const permissionCheck = await permissionMiddleware.checkPermission(
      request, 
      [SystemPermission.REQUESTS_DELETE]
    );
    
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }
    // Initialize request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();
    
    // Import proper auth middleware and get user details from JWT token
    const { extractAuthToken } = await import('@/features/auth/api/middleware/authMiddleware');
    const token = await extractAuthToken(request);
    let userId = 0;
    
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, jwtSecret);
        userId = Number(decoded.sub) || 0;
      } catch (e) {
        // Continue with defaults if token decoding fails
      }
    }
    
    // Delete the request
    const success = await requestService.deleteRequest(id, {
      context: {
        userId
      }
    });

    // Return formatted response
    if (success) {
      return formatResponse.success({ success }, 'Request deleted successfully');
    } else {
      return formatResponse.notFound('Request not found or could not be deleted');
    }
  } catch (error) {
    return formatResponse.error('An error occurred while deleting the request', 500);
  }
});
