import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/features/auth/api/middleware/authMiddleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { formatResponse } from '@/core/errors';
import { routeHandler } from '@/core/api/route-handler';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { LinkRequestToCustomerRequest } from '../models/request-request-models';

/**
 * POST handler for linking a request to an existing customer
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with updated request
 */
export const POST = routeHandler(async (request: NextRequest) => {
  try {
    // Extract ID from URL path segments
    const urlParts = request.nextUrl.pathname.split('/');
    const id = Number(urlParts[urlParts.length - 2]); // Take the second-to-last segment (the [id] part)
    console.log(`Request URL: ${request.nextUrl.pathname}`);
    console.log(`Request ID from URL: ${id}`);
    
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    console.log('Authenticating user');
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return formatResponse.error(authResult.message || 'Authentication required', authResult.statusCode || 401);
    }
    console.log('Authentication successful');

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.REQUESTS_EDIT]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }

    // Parse request body
    const data: LinkRequestToCustomerRequest = await request.json();
    console.log('Request data:', JSON.stringify(data));

    // Validate customer ID
    if (!data.customerId || isNaN(data.customerId) || data.customerId <= 0) {
      return formatResponse.error('Invalid customer ID', 400);
    }
    console.log(`Linking request ${id} to customer ${data.customerId}`);

    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();
    console.log('Request service initialized');

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
        console.log(`User ID from token: ${userId}`);
      } catch (e) {
        console.error('Error decoding token:', e);
        // Continue with defaults if token decoding fails
      }
    } else {
      console.log('No token found, using default user ID');
    }
    
    try {
      // Link request to customer
      console.log(`Linking request ${id} to customer ${data.customerId} with userId ${userId}`);
      const result = await requestService.linkToCustomer(id, data.customerId, data.note, {
        context: {
          userId
        }
      });
      
      console.log('Link result:', result ? 'Success' : 'Failure');

      // Return formatted response
      return formatResponse.success(result, 'Request linked to customer successfully', 200);
    } catch (linkError) {
      console.error('Error during link operation:', linkError);
      return formatResponse.error(`Link error: ${(linkError as Error).message || 'Unknown error'}`, 500);
    }
  } catch (error) {
    console.error('Error in link-to-customer route:', error);
    return formatResponse.error('An error occurred while linking the request to a customer', 500);
  }
});

