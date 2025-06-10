/**
 * Appointment Notes API Route
 * 
 * Handles appointment notes operations
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/core/errors/index';
import { getAppointmentService } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { validateId } from '@/shared/utils/validation-utils';

/**
 * GET /api/appointments/[id]/notes
 * 
 * Retrieves notes for an appointment
 * Requires APPOINTMENTS_VIEW permission
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Extract ID from URL path
  const params = { id: req.nextUrl.pathname.split('/').slice(-2)[0] };
  
  try {
    // Check permission - moved inside handler for better authentication flow with role
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_VIEW,
      req.auth?.role
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_VIEW}`);
      return formatError(
        `You don't have permission to perform this action (requires ${SystemPermission.APPOINTMENTS_VIEW})`, 
        403
      );
    }
    
    const id = params.id;
    
    if (!id) {
      logger.error('Missing appointment ID');
      return formatError('Appointment ID is required', 400);
    }
    
    // Validate and sanitize ID
    const validId = validateId(id);
    if (!validId) {
      logger.error(`Invalid appointment ID: ${id}`);
      return formatError('Invalid appointment ID format', 400);
    }
    
    // Get appointment service
    const appointmentService = getAppointmentService();
    
    // Get the appointment with notes
    const appointment = await appointmentService.getAppointmentDetails(validId, {
      context: {
        userId: req.auth?.userId
      },
      relations: ['notes']
    });
    
    if (!appointment) {
      return formatNotFound('Appointment not found');
    }
    
    // Return just the notes
    return formatSuccess({
      notes: appointment.notes || []
    }, 'Appointment notes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching appointment notes:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error retrieving appointment notes',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * POST /api/appointments/[id]/notes
 * 
 * Adds a note to an appointment
 * Requires APPOINTMENTS_EDIT permission
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Extract ID from URL path
  const params = { id: req.nextUrl.pathname.split('/').slice(-2)[0] };
  
  try {
    // Check permission - moved inside handler for better authentication flow with role
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_EDIT,
      req.auth?.role
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_EDIT}`);
      return formatError(
        `You don't have permission to perform this action (requires ${SystemPermission.APPOINTMENTS_EDIT})`, 
        403
      );
    }
    
    const id = params.id;
    
    if (!id) {
      logger.error('Missing appointment ID');
      return formatError('Appointment ID is required', 400);
    }
    
    // Validate and sanitize ID
    const validId = validateId(id);
    if (!validId) {
      logger.error(`Invalid appointment ID: ${id}`);
      return formatError('Invalid appointment ID format', 400);
    }
    
    // Parse request body
    const data = await req.json();
    
    if (!data.note) {
      return formatValidationError({
        note: ['Note text is required']
      }, 'Invalid note data');
    }
    
    // Get appointment service
    const appointmentService = getAppointmentService();
    
    // Check if appointment exists
    const existingAppointment = await appointmentService.getById(validId);
    
    if (!existingAppointment) {
      return formatNotFound('Appointment not found');
    }
    
    // Add the note
    const success = await appointmentService.addNote(validId, data.note, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
      }
    });
    
    if (!success) {
      return formatError('Failed to add note to appointment', 500);
    }
    
    // Fetch the updated appointment with notes
    const updatedAppointment = await appointmentService.getAppointmentDetails(validId, {
      context: {
        userId: req.auth?.userId
      },
      relations: ['notes']
    });
    
    return formatSuccess(updatedAppointment, 'Note added successfully');
  } catch (error) {
    logger.error('Error adding appointment note:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error).validationErrors,
        'Note validation failed'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Error adding note to appointment',
      500
    );
  }
}, {
  requiresAuth: true
});
