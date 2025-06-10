import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/appointment
 * 
 * Creates an appointment for a contact request.
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using the correct pattern with role
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.REQUESTS_EDIT,
      req.auth?.role
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.REQUESTS_EDIT}`);
      return NextResponse.json(
        formatResponse.error('You dont have permission to create appointments for requests', 403),
        { status: 403 }
      );
    }
    
    // Get request ID from URL
    const requestId = parseInt(req.nextUrl.pathname.split('/').slice(-2)[0]);
    if (isNaN(requestId)) {
      return NextResponse.json(
        formatResponse.error('Invalid request ID', 400),
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { 
      title, 
      dateTime,
      appointmentDate, 
      appointmentTime, 
      duration = 60, 
      location, 
      description, 
      status = 'planned', 
      customerId,
      note 
    } = body;
    
    // Validate required fields
    if (!title) {
      return NextResponse.json(
        formatResponse.error('Title is required', 400),
        { status: 400 }
      );
    }
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Determine appointment date from inputs
    let finalAppointmentDate;
    
    // First check if dateTime was provided (combined format)
    if (dateTime) {
      try {
        finalAppointmentDate = new Date(dateTime);
        // Validate that the date is valid
        if (isNaN(finalAppointmentDate.getTime())) {
          throw new Error('Invalid dateTime format');
        }
      } catch (error) {
        return NextResponse.json(
          formatResponse.error('Invalid dateTime format, expected ISO format (YYYY-MM-DDTHH:MM:SS)', 400),
          { status: 400 }
        );
      }
    }
    // If not, try to combine appointmentDate and appointmentTime
    else if (appointmentDate) {
      try {
        if (appointmentTime) {
          // Combine date and time
          const [year, month, day] = appointmentDate.split('-').map(Number);
          const [hours, minutes] = appointmentTime.split(':').map(Number);
          finalAppointmentDate = new Date(year, month - 1, day, hours, minutes);
        } else {
          // Only date with default time (10:00)
          const [year, month, day] = appointmentDate.split('-').map(Number);
          finalAppointmentDate = new Date(year, month - 1, day, 10, 0);
        }
        
        // Validate that the date is valid
        if (isNaN(finalAppointmentDate.getTime())) {
          throw new Error('Invalid date/time combination');
        }
      } catch (error) {
        return NextResponse.json(
          formatResponse.error('Invalid date/time format. Expected YYYY-MM-DD for date and HH:MM for time', 400),
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        formatResponse.error('Either dateTime or appointmentDate is required', 400),
        { status: 400 }
      );
    }
    
    // Create appointment data
    const appointmentData = {
      title,
      appointmentDate: finalAppointmentDate,
      duration,
      location,
      description,
      status,
      // Add customer ID if provided (important for proper relationship)
      customerId: customerId || undefined
    };
    
    // Context for audit logging
    const context = {
      userId: req.auth?.userId,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // Log the appointment creation in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Creating appointment for request', { 
        requestId, 
        appointmentData,
        customerId
      });
    }
    
    // Create appointment for request
    const result = await requestService.createAppointmentForRequest(
      requestId,
      appointmentData,
      note,
      { context }
    );
    
    return NextResponse.json(
      formatResponse.success(result, 'Appointment created successfully'),
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating appointment for request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      formatResponse.error(
        error instanceof Error ? error.message : 'Failed to create appointment',
        500
      ),
      { status: 500 }
    );
  }
}, { requiresAuth: true });
