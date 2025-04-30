import { NextResponse, NextRequest } from 'next/server';
import { authMiddleware } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { ConvertRequestToCustomerRequest } from '../models/request-request-models';

/**
 * POST handler for converting a request to a customer
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with conversion result
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract ID from route parameters
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    const session = await authMiddleware(request);
    if (!session) {
      return formatResponse.error('Authentication required', 401);
    }
    // Check if user is authenticated
    if (!session.user) {
      return formatResponse.error('User not authenticated', 401);
    }
    
    // Access user info from session
    const userId = session.user.id;

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.CUSTOMERS_CREATE]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }

    // Parse request body
    const data: ConvertRequestToCustomerRequest = await request.json();

    // Validate customer data
    if (!data.customerData || !data.customerData.name || !data.customerData.email) {
      return formatResponse.error('Missing required customer data: name and email are required', 400);
    }

    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();

    // User ID is already obtained from the auth session above
    
    const result = await requestService.convertToCustomer({
      requestId: id,
      customerData: data.customerData,
      createAppointment: data.createAppointment,
      appointmentData: data.appointmentData
    }, {
      context: {
        userId
      }
    });

    // Return formatted response
    return formatResponse.success(result, 'Request converted to customer successfully', 200);
  } catch (error) {
    return formatResponse.error('An error occurred while converting the request to a customer', 500);
  }
}
