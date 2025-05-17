/**
 * Appointment Status API Route
 * 
 * Handles appointment status updates
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/core/errors/index';
import { getAppointmentService } from '@/core/factories/serviceFactory.server';
import { UpdateAppointmentStatusDto } from '@/domain/dtos/AppointmentDtos';
import { getLogger } from '@/core/logging';
import { withPermission } from '@/features/permissions/api/middleware/permissionMiddleware';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { validateId } from '@/shared/utils/validation-utils';

/**
 * Handler function for both PUT and PATCH methods
 */
async function handleStatusUpdate(req: NextRequest, params: { id: string }) {
  const logger = getLogger();
  
  try {
    // Check permission - moved inside handler for better authentication flow
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_EDIT
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
    if (validId === null) {
      logger.error(`Invalid appointment ID: ${id}`);
      return formatError(`Invalid appointment ID: ${id} - must be a positive number`, 400);
    }
    
    // Parse request body
    const data = await req.json() as UpdateAppointmentStatusDto;
    
    // Validate status data
    if (!data.status) {
      return formatValidationError({
        status: ['Status is required']
      }, 'Invalid status data');
    }
    
    // Get appointment service
    const appointmentService = getAppointmentService();
    
    // Check if appointment exists
    const existingAppointment = await appointmentService.getById(validId);
    
    if (!existingAppointment) {
      return formatNotFound('Appointment not found');
    }
    
    // Update the status
    const updatedAppointment = await appointmentService.updateStatus(validId, data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      }
    });
    
    return formatSuccess(updatedAppointment, 'Appointment status updated successfully');
  } catch (error) {
    logger.error('Error updating appointment status:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error).validationErrors,
        'Status validation failed'
      );
    }
    
    return formatError(
      error instanceof Error ? error.message : 'Error updating appointment status',
      500
    );
  }
}

/**
 * PUT /api/appointments/[id]/status
 * 
 * Updates the status of an appointment
 * Requires APPOINTMENTS_EDIT permission
 */
export const PUT = routeHandler(async (req: NextRequest, { params }) => {
  // Get the ID directly from the params
  const id = params?.id;
  
  // Reuse the handler function for both PUT and PATCH
  return handleStatusUpdate(req, { id });
}, {
  requiresAuth: true
});

/**
 * PATCH /api/appointments/[id]/status
 * 
 * Updates the status of an appointment (partial update)
 * Requires APPOINTMENTS_EDIT permission
 */
export const PATCH = routeHandler(async (req: NextRequest, { params }) => {
  // Get the ID directly from the params
  const id = params?.id;
  
  // Reuse the handler function for both PUT and PATCH
  return handleStatusUpdate(req, { id });
}, {
  requiresAuth: true
});
