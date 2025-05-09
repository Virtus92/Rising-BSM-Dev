import { NextResponse, NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { apiAuth } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * POST handler for creating an appointment from a request
 * @param request - Next.js request object
 * @param params - Route parameters with request ID
 * @returns Response with created appointment
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Extract ID from route parameters - properly access params in App Router
    const id = Number(params.id);
    console.log(`Request URL: ${request.nextUrl.pathname}`);
    console.log(`Request ID from params: ${id}`);
    
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // Authenticate user
    console.log('Authenticating user');
    const auth = await apiAuth(request);
    if (!auth) {
      return formatResponse.error('Authentication required', 401);
    }
    console.log('Authentication successful');

    // Verify permissions
    const permissionCheck = await permissionMiddleware.checkPermission(request, [SystemPermission.APPOINTMENTS_CREATE]);
    if (!permissionCheck.success) {
      return formatResponse.error(permissionCheck.message || 'Permission denied', permissionCheck.status || 403);
    }

    // Parse request body
    const data = await request.json();
    console.log('Request data:', JSON.stringify(data));

    // Validate appointment date
    if (!data.appointmentDate) {
      return formatResponse.error('Appointment date is required', 400);
    }
    
    console.log(`Creating appointment for request ${id}`);

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
        const decoded = jwt.verify(token, jwtSecret) as any;
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
      // Parse the appointment date
      let appointmentDate;
      try {
        // Handle both ISO string and separate date+time fields
        if (data.appointmentDate) {
          if (typeof data.appointmentDate === 'string') {
            // Check if it's already an ISO string
            if (data.appointmentDate.includes('T')) {
              appointmentDate = new Date(data.appointmentDate);
            } else if (data.appointmentTime) {
              // Combine date and time
              appointmentDate = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
            } else {
              // Just date without time
              appointmentDate = new Date(data.appointmentDate);
            }
          } else {
            // Already a Date object
            appointmentDate = data.appointmentDate;
          }
        } else {
          return formatResponse.error('Appointment date is required', 400);
        }
        
        console.log(`Parsed appointment date: ${appointmentDate}`);
        
        // Check if the date is valid
        if (isNaN(appointmentDate.getTime())) {
          return formatResponse.error('Invalid appointment date format', 400);
        }
      } catch (dateError) {
        console.error('Error parsing appointment date:', dateError);
        return formatResponse.error(`Invalid date format: ${(dateError as Error).message}`, 400);
      }
      
      // Create appointment with the parsed date
      console.log(`Creating appointment for request ${id} with user ${userId}`);
      
      // Create a formatted ISO date string
      const isoDateString = appointmentDate.toISOString();
      console.log(`ISO date string: ${isoDateString}`);
      
      const result = await requestService.createAppointmentForRequest(
        id,
        {
          title: data.title,
          appointmentDate: appointmentDate,
          duration: data.duration || 60,
          location: data.location,
          description: data.description
        },
        data.note,
        {
          context: {
            userId
          }
        }
      );
      
      console.log('Appointment creation result:', result ? 'Success' : 'Failure');

      // Return formatted response
      return formatResponse.success(result, 'Appointment created successfully', 201);
    } catch (appointmentError) {
      console.error('Error during appointment creation:', appointmentError);
      return formatResponse.error(`Appointment creation error: ${(appointmentError as Error).message || 'Unknown error'}`, 500);
    }
  } catch (error) {
    console.error('Error in create-appointment route:', error);
    return formatResponse.error('An error occurred while creating the appointment', 500);
  }
}

