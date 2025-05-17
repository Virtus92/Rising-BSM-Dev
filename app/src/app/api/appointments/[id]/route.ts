/**
 * Appointment by ID API Route
 * 
 * Handles retrieving, updating, and deleting appointments by ID
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/core/errors/index';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getAppointmentHandler } from '@/features/appointments/api';
import { validateId } from '@/shared/utils/validation-utils';

/**
 * GET /api/appointments/[id]
 * 
 * Retrieves a single appointment by its ID
 * Requires APPOINTMENTS_VIEW permission
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Get ID from params (provided by Next.js route handler)
  const id = req.nextUrl.pathname.split('/').pop() || '';
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_VIEW
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_VIEW}`);
      return formatError(
        `You don't have permission to view appointment details`, 
        403
      );
    }
    
    if (!id) {
      logger.error('No appointment ID provided');
      return formatError('No appointment ID provided', 400);
    }
    
    // Use consistent ID validation
    const appointmentId = validateId(id);
    if (appointmentId === null) {
      logger.error(`Invalid appointment ID: ${id}`);
      return formatError(`Invalid appointment ID: ${id} - must be a positive number`, 400);
    }
    
    // Use the appointment handler function
    return getAppointmentHandler(req, id);
    
  } catch (error) {
    logger.error('Error fetching appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: id,
      userId: req.auth?.userId
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error retrieving the appointment',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * PUT /api/appointments/[id]
 * 
 * Updates an appointment by its ID
 * Requires APPOINTMENTS_EDIT permission
 */
export const PUT = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Get ID from params (provided by Next.js route handler)
  const id = req.nextUrl.pathname.split('/').pop() || '';
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_EDIT
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_EDIT}`);
      return formatError(
        `You don't have permission to edit appointment information`, 
        403
      );
    }
    
    if (!id) {
      logger.error('No appointment ID provided');
      return formatError('No appointment ID provided', 400);
    }
    
    // Use consistent ID validation
    const appointmentId = validateId(id);
    if (appointmentId === null) {
      logger.error(`Invalid appointment ID: ${id}`);
      return formatError(`Invalid appointment ID: ${id} - must be a positive number`, 400);
    }
    
    // Parse request body as JSON
    const data = await req.json();
    
    // Ensure duration is numeric
    if (typeof data.duration === 'string') {
      data.duration = parseInt(data.duration, 10);
      if (isNaN(data.duration)) {
        data.duration = 60; // Default duration
      }
    }
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Check if the appointment exists
    const existingAppointment = await appointmentService.getById(appointmentId);
    
    if (!existingAppointment) {
      logger.warn(`Appointment not found during update: ${appointmentId}`);
      return formatNotFound('Appointment not found');
    }
    
    // Update appointment
    const updatedAppointment = await appointmentService.update(appointmentId, data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // Success response
    return formatSuccess(updatedAppointment, 'Appointment updated successfully');
    
  } catch (error) {
    logger.error('Error updating appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: id,
      userId: req.auth?.userId
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error).validationErrors,
        'Appointment validation failed'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Error updating appointment',
      500
    );
  }
}, {
  requiresAuth: true
});

/**
 * DELETE /api/appointments/[id]
 * 
 * Deletes an appointment by its ID
 * Requires APPOINTMENTS_DELETE permission
 */
export const DELETE = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  // Get ID from params (provided by Next.js route handler)
  const id = req.nextUrl.pathname.split('/').pop() || '';
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using consistent pattern
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_DELETE
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_DELETE}`);
      return formatError(
        `You don't have permission to delete appointments`, 
        403
      );
    }
    
    if (!id) {
      logger.error('No appointment ID provided');
      return formatError('No appointment ID provided', 400);
    }
    
    // Use consistent ID validation
    const appointmentId = validateId(id);
    if (appointmentId === null) {
      logger.error(`Invalid appointment ID: ${id}`);
      return formatError(`Invalid appointment ID: ${id} - must be a positive number`, 400);
    }
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Check if appointment exists
    const existingAppointment = await appointmentService.getById(appointmentId);
    
    if (!existingAppointment) {
      logger.warn(`Appointment not found during delete: ${appointmentId}`);
      return formatNotFound('Appointment not found');
    }
    
    // Delete appointment
    const deleted = await appointmentService.delete(appointmentId, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // Success response
    return formatSuccess({ deleted }, 'Appointment deleted successfully');
    
  } catch (error) {
    logger.error('Error deleting appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: id,
      userId: req.auth?.userId
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error deleting appointment',
      500
    );
  }
}, {
  requiresAuth: true
});