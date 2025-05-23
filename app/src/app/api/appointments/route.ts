/**
 * Appointments API-Route
 * 
 * Handles appointment management requests
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError, formatValidationError } from '@/core/errors/index';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { CreateAppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getAppointmentsHandler } from '@/features/appointments/api';

/**
 * GET /api/appointments
 * 
 * Retrieves a list of appointments, optionally filtered and paginated
 * Requires APPOINTMENTS_VIEW permission
 */
export const GET = routeHandler(
  await permissionMiddleware.withPermission(

    async (req: NextRequest) => {
      const logger = getLogger();
    try {
    // Use the appointment handler function
    return getAppointmentsHandler(req);
    
  } catch (error) {
    logger.error('Error fetching appointments:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.auth?.userId
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Error retrieving appointments',
      500
    );
  }
    },
    SystemPermission.APPOINTMENTS_VIEW
  ),
  { requiresAuth: true }
);

/**
 * POST /api/appointments
 * 
 * Creates a new appointment
 * Requires APPOINTMENTS_CREATE permission
 */
export const POST = routeHandler(
  await permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      const logger = getLogger();
      const serviceFactory = getServiceFactory();
    try {
    // Parse request body
    const data = await req.json() as CreateAppointmentDto;
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Create appointment with all needed context
    const result = await appointmentService.create(data, {
      context: {
        userId: req.auth?.userId,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      },
      // Always include customer relation for complete data
      relations: ['customer']
    });
    
    // Success response
    return formatSuccess(result, 'Appointment created successfully', 201);
    
  } catch (error) {
    logger.error('Error creating appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
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
      error instanceof Error ? error.message : 'Error creating appointment',
      500
    );
  }
    },
    SystemPermission.APPOINTMENTS_CREATE
  ),
  { requiresAuth: true }
);