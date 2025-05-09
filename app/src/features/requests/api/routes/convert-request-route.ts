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
    // Extract ID from route parameters - properly access params in App Router
    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Debug the request to see what we're receiving
    console.log(`Converting request ID ${id} to customer`);

    // Authenticate user - check if we have a valid session
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
    console.log(`User ID from session: ${userId}`);

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.CUSTOMERS_CREATE]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }

    // Parse request body
    const data: ConvertRequestToCustomerRequest = await request.json();
    console.log('Request data:', JSON.stringify(data));

    // Validate customer data
    if (!data.customerData || !data.customerData.name || !data.customerData.email) {
      return formatResponse.error('Missing required customer data: name and email are required', 400);
    }

    // Get request service
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();
    console.log('Request service initialized');

    // User ID is already obtained from the auth session above
    try {
      console.log('Converting request to customer with data:', {
        requestId: id,
        customerData: {
          name: data.customerData.name,
          email: data.customerData.email,
          // Other fields omitted for brevity
        },
        createAppointment: data.createAppointment,
        hasAppointmentData: data.appointmentData ? true : false
      });
      
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
      
      console.log('Conversion result:', result ? 'Success' : 'Failure', result);

    // Return formatted response
    return formatResponse.success(result, 'Request converted to customer successfully', 200);
    } catch (conversionError) {
      console.error('Error during conversion:', conversionError);
      return formatResponse.error(`Conversion error: ${(conversionError as Error).message || 'Unknown error'}`, 500);
    }
  } catch (error) {
    return formatResponse.error('An error occurred while converting the request to a customer', 500);
  }
}
