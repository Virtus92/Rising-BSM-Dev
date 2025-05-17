import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';

type RequestParams = {
  params: {
    id: string;
  };
};

/**
 * POST /api/requests/[id]/appointment
 * 
 * Erstellt einen Termin für eine Kontaktanfrage.
 */
// Create the handler first with proper RequestParams type
const createAppointmentHandler = async (req: NextRequest, context: any) => {
  const params = context.params;
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  const requestId = parseInt(params.id);
  if (isNaN(requestId)) {
    return formatResponse.error('Invalid request ID', 400);
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
    return formatResponse.error('Title is required', 400);
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
      return formatResponse.error('Invalid dateTime format, expected ISO format (YYYY-MM-DDTHH:MM:SS)', 400);
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
      return formatResponse.error('Invalid date/time format. Expected YYYY-MM-DD for date and HH:MM for time', 400);
    }
  } else {
    return formatResponse.error('Either dateTime or appointmentDate is required', 400);
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
  
  return formatResponse.success(result, 'Appointment created successfully');
};

// Apply permission middleware using the routeHandler pattern
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    createAppointmentHandler,
    SystemPermission.REQUESTS_EDIT
  ),
  { requiresAuth: true }
);
