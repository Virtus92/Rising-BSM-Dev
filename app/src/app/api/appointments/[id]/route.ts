/**
 * Appointment by ID API Route
 * 
 * Handles retrieving, updating, and deleting appointments by ID
 */
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { getAppointmentHandler } from '@/features/appointments/api';

/**
 * GET /api/appointments/[id]
 * 
 * Retrieves a single appointment by its ID
 * Requires APPOINTMENTS_VIEW permission
 */
export const GET = withAuth(
  permissionMiddleware.withPermission(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      return getAppointmentHandler(req, params.id);
    },
    SystemPermission.APPOINTMENTS_VIEW
  )
);

/**
 * PUT /api/appointments/[id]
 * 
 * Updates an appointment by its ID
 * Requires APPOINTMENTS_EDIT permission
 */
export const PUT = withAuth(
  permissionMiddleware.withPermission(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      const id = params.id;
      
      try {
        if (!id) {
          return formatResponse.error('Appointment ID is required', 400);
        }
        
        // Validate ID
        const appointmentId = parseInt(id, 10);
        if (isNaN(appointmentId) || appointmentId <= 0) {
          return formatResponse.error(`Invalid appointment ID: ${id} - must be a positive number`, 400);
        }
        
        logger.debug(`Updating appointment with ID: ${appointmentId}`);
        
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
          return formatResponse.error('Appointment not found', 404);
        }
        
        // Update appointment
        const updatedAppointment = await appointmentService.update(appointmentId, data, {
          context: {
            userId: req.auth?.userId,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
          }
        });
        
        // Success response
        return formatResponse.success(updatedAppointment, 'Appointment successfully updated');
        
      } catch (error) {
        logger.error('Error updating appointment:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          appointmentId: id
        });
        
        // Handle validation errors
        if (error instanceof Error && 'validationErrors' in error) {
          return formatResponse.validationError(
            (error as any).validationErrors,
            'Appointment validation failed'
          );
        }
        
        return formatResponse.error(
          error instanceof Error ? error.message : 'Error updating appointment',
          500
        );
      }
    },
    SystemPermission.APPOINTMENTS_EDIT
  )
);

/**
 * DELETE /api/appointments/[id]
 * 
 * Deletes an appointment by its ID
 * Requires APPOINTMENTS_DELETE permission
 */
export const DELETE = withAuth(
  permissionMiddleware.withPermission(
    async (req: NextRequest, { params }: { params: { id: string } }) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
      const id = params.id;
      
      try {
        if (!id) {
          return formatResponse.error('Appointment ID is required', 400);
        }
        
        // Validate ID
        const appointmentId = parseInt(id, 10);
        if (isNaN(appointmentId) || appointmentId <= 0) {
          return formatResponse.error(`Invalid appointment ID: ${id} - must be a positive number`, 400);
        }
        
        logger.debug(`Deleting appointment with ID: ${appointmentId}`);
        
        // Get appointment service
        const appointmentService = serviceFactory.createAppointmentService();
        
        // Check if appointment exists
        const existingAppointment = await appointmentService.getById(appointmentId);
        
        if (!existingAppointment) {
          return formatResponse.error('Appointment not found', 404);
        }
        
        // Delete appointment
        const deleted = await appointmentService.delete(appointmentId, {
          context: {
            userId: req.auth?.userId,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
          }
        });
        
        // Success response
        return formatResponse.success({ deleted }, 'Appointment successfully deleted');
        
      } catch (error) {
        logger.error('Error deleting appointment:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          appointmentId: id
        });
        
        return formatResponse.error(
          error instanceof Error ? error.message : 'Error deleting appointment',
          500
        );
      }
    },
    SystemPermission.APPOINTMENTS_DELETE
  )
);