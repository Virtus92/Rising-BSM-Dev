import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError, formatNotFound, formatValidationError } from '@/infrastructure/api/response-formatter';
import { getAppointmentService, getCustomerService } from '@/infrastructure/common/factories';
import { UpdateAppointmentDto, StatusUpdateDto, UpdateAppointmentStatusDto } from '@/domain/dtos/AppointmentDtos';
import { getLogger } from '@/infrastructure/common/logging';
import { apiPermissions } from '@/app/api/helpers/apiPermissions';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { validateId } from '@/shared/utils/validation-utils';

/**
 * GET /api/appointments/[id]
 * 
 * Retrieves a single appointment by its ID
 * Requires APPOINTMENTS_VIEW permission
 */
export const GET = apiRouteHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  // Get ID directly from the params object
  const id = params.id;
  const logger = getLogger();
  
  try {
    // Check permission
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_VIEW
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_VIEW}`);
      return formatError(
        `You don't have permission to perform this action (requires ${SystemPermission.APPOINTMENTS_VIEW})`, 
        403
      );
    }
    
    // Add extensive logging for debugging
    logger.debug('API appointment by ID - Raw params:', params);
    
    if (!id) {
      logger.error('Missing appointment ID:', { params });
      return formatError('Appointment ID is required', 400);
    }
    
    // Use validateId utility for consistent ID validation
    const appointmentId = validateId(id);
    if (appointmentId === null) {
      logger.error(`Invalid appointment ID: ${id}`);
      return formatError(`Invalid appointment ID: ${id} - must be a positive number`, 400);
    }
    
    logger.debug(`Processing appointment with ID: ${appointmentId}`);
    
    // Get relations from request URL
    const url = new URL(req.url);
    const relationsParam = url.searchParams.get('relations');
    let relations: string[] = [];
    
    // Handle the relations parameter
    if (relationsParam) {
      // Always clean relation format by removing any ":1" or other suffixes
      relations = relationsParam.split(',').map(r => {
        // Split at colon and take the first part
        return r.split(':')[0].trim();
      }).filter(r => r); // Remove any empty entries
      
      // Log the cleaned relations for debugging
      logger.debug(`Parsed relations: ${JSON.stringify(relations)}`);
    }
    
    // Fetch appointment service
    const appointmentService = getAppointmentService();
    
    // Get appointment with specified ID and relations
    const appointment = await appointmentService.getAppointmentDetails(appointmentId, {
      context: {
        userId: req.auth?.userId
      },
      relations: relations.length > 0 ? relations : undefined
    });
    
    if (!appointment) {
      return formatNotFound('Appointment not found');
    }
    
    // If a customer is associated, we load additional data
    if (appointment.customerId) {
      try {
        const customerService = getCustomerService();
        const customer = await customerService.getById(appointment.customerId);
        
        if (customer) {
          appointment.customerName = customer.name;
          appointment.customerData = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone
          };
        }
      } catch (customerError) {
        logger.warn(`Failed to load customer data for appointment ${appointmentId}:`, {
          error: customerError instanceof Error ? customerError.message : String(customerError),
          customerId: appointment.customerId
        });
      }
    }
    
    // Success response
    return formatSuccess(appointment, 'Appointment successfully retrieved');
    
  } catch (error) {
    logger.error('Error fetching appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error retrieving appointment',
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
export const PUT = apiRouteHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  // Declare id outside the try block so it's accessible in the catch block
  const id = params.id;
  const logger = getLogger();
  
  try {
    // Check permission
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_EDIT
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_EDIT}`);
      return formatError(
        `You don't have permission to perform this action (requires ${SystemPermission.APPOINTMENTS_EDIT})`, 
        403
      );
    }
    
    if (!id) {
      return formatError('Appointment ID is required', 400);
    }
    
    // Use validateId utility for consistent ID validation
    const numericId = validateId(id);
    if (numericId === null) {
      return formatError(`Invalid appointment ID: ${id} - must be a positive number`, 400);
    }
    
    logger.debug(`Updating appointment with ID: ${numericId}`);
    
    // Parse request body as JSON
    const data = await req.json() as UpdateAppointmentDto;
    
    // Ensure duration is numeric
    if (typeof data.duration === 'string') {
      data.duration = parseInt(data.duration, 10);
      if (isNaN(data.duration)) {
        data.duration = 60; // Default duration
      }
    }
    
    // Get appointment service
    const appointmentService = getAppointmentService();
    
    // Check if the appointment exists - use numeric ID
    const existingAppointment = await appointmentService.getById(numericId);
    
    if (!existingAppointment) {
      return formatNotFound('Appointment not found');
    }
    
    // Update appointment
    const updatedAppointment = await appointmentService.update(numericId, data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || req.ip
      }
    });
    
    // If a customer is associated, we load additional data
    if (updatedAppointment.customerId) {
      try {
        const customerService = getCustomerService();
        const customer = await customerService.getById(updatedAppointment.customerId);
        
        if (customer) {
          updatedAppointment.customerName = customer.name;
          updatedAppointment.customerData = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone
          };
        }
      } catch (customerError) {
        // Ignore customer loading errors
      }
    }
    
    // Success response
    return formatSuccess(updatedAppointment, 'Appointment successfully updated');
    
  } catch (error) {
    logger.error('Error updating appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: id
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return formatValidationError(
        (error as any).validationErrors,
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
export const DELETE = apiRouteHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  // Declare id outside the try block so it's accessible in the catch block
  const id = params.id;
  const logger = getLogger();
  
  try {
    // Check permission
    if (!await apiPermissions.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_DELETE
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_DELETE}`);
      return formatError(
        `You don't have permission to perform this action (requires ${SystemPermission.APPOINTMENTS_DELETE})`, 
        403
      );
    }
    
    if (!id) {
      return formatError('Appointment ID is required', 400);
    }
    
    // Use validateId utility for consistent ID validation
    const appointmentId = validateId(id);
    if (appointmentId === null) {
      return formatError(`Invalid appointment ID: ${id} - must be a positive number`, 400);
    }
    
    logger.debug(`Deleting appointment with ID: ${appointmentId}`);
    
    // Fetch appointment service
    const appointmentService = getAppointmentService();
    
    // Check if appointment exists
    const existingAppointment = await appointmentService.getById(appointmentId);
    
    if (!existingAppointment) {
      return formatNotFound('Appointment not found');
    }
    
    // Add an additional check for appointment ownership
    if (existingAppointment.createdBy && existingAppointment.createdBy !== req.auth?.userId) {
      // Users can still only delete their own appointments unless they're admin or have delete permission
      logger.info(`User ${req.auth?.userId} deleting appointment ${appointmentId} owned by user ${existingAppointment.createdBy}`);
    }
    
    // Log detailed debugging information
    logger.debug('Attempting to delete appointment', {
      appointmentId,
      userRole: req.auth?.role,
      userId: req.auth?.userId,
      appointmentInfo: {
        createdBy: existingAppointment.createdBy,
        status: existingAppointment.status,
        hasNotes: (existingAppointment as any).notes?.length > 0
      }
    });

    try {
      // Check if the appointment has notes - these should be deleted first
      // Try to get notes first to check for dependencies
      const notes = await appointmentService.getRepository().findNotes(appointmentId);
      if (notes?.length > 0) {
        logger.debug(`Appointment has ${notes.length} notes that need to be removed first`);
        // Delete all notes first to avoid foreign key constraints
        for (const note of notes) {
          try {
            // Delete notes directly from database to avoid constraints
            await appointmentService.getRepository().prisma.appointmentNote.delete({
              where: { id: note.id }
            });
          } catch (noteError) {
            logger.error(`Failed to delete appointment note (ID: ${note.id})`, {
              error: noteError instanceof Error ? noteError.message : String(noteError),
              stack: noteError instanceof Error ? noteError.stack : undefined
            });
            // Continue with other notes - try to delete as many as possible
          }
        }
      }

      // Now delete the appointment
      const deleted = await appointmentService.delete(appointmentId, {
        context: {
          userId: req.auth?.userId,
          ipAddress: req.headers.get('x-forwarded-for') || req.ip
        }
      });
      
      // Success response
      return formatSuccess({ deleted }, 'Appointment successfully deleted');
    } catch (deleteError) {
      logger.error('Error during appointment deletion process', {
        error: deleteError instanceof Error ? deleteError.message : String(deleteError),
        stack: deleteError instanceof Error ? deleteError.stack : undefined,
        appointmentId
      });
      
      // Try a fallback direct deletion if the service method fails
      try {
        await appointmentService.getRepository().prisma.appointment.delete({
          where: { id: appointmentId }
        });
        
        return formatSuccess({ deleted: true }, 'Appointment successfully deleted (Fallback)');
      } catch (fallbackError) {
        logger.error('Fallback deletion also failed', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          appointmentId
        });
        
        return formatError(
          'Error deleting the appointment. Dependencies may still exist.',
          500
        );
      }
    }
    
  } catch (error) {
    logger.error('Error deleting appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: id
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error deleting appointment',
      500
    );
  }
}, {
  requiresAuth: true
});