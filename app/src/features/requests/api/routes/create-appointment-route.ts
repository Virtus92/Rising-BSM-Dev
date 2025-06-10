import { NextResponse, NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/route-handler';
import { apiAuth } from '@/features/auth/api/middleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { formatResponse } from '@/core/errors';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { IRequestService } from '@/domain/services/IRequestService';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * POST handler for creating an appointment from a request
 * @param request - Next.js request object
 * @returns Response with created appointment
 */
export const POST = apiAuth(async (request: NextRequest, user: any) => {
  try {
    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const idIdx = segments.findIndex(s => s === 'appointment') - 1;
    const id = Number(idIdx >= 0 ? segments[idIdx] : 0);
    console.log(`Request URL: ${request.nextUrl.pathname}`);
    console.log(`Request ID from params: ${id}`);
    
    if (isNaN(id) || id <= 0) {
      return formatResponse.error('Invalid request ID', 400);
    }

    // User is already authenticated by apiAuth middleware
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

    // Get user ID from the authenticated user object
    const userId = user?.id || 0;
    console.log(`User ID: ${userId}`);
    
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
});