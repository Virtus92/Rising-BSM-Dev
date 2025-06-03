/**
 * Appointments API-Route
 * 
 * Handles appointment management requests
 */
import { NextRequest, NextResponse } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError, formatValidationError } from '@/core/errors/index';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { getLogger } from '@/core/logging';
import { CreateAppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getAppointmentsHandler } from '@/features/appointments/api';

/**
 * GET /api/appointments
 * 
 * Retrieves a list of appointments, optionally filtered and paginated
 * Requires APPOINTMENTS_VIEW permission
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Check permission using the correct pattern with role
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_VIEW,
      req.auth?.role
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_VIEW}`);
      return NextResponse.json(
        formatError('You don\'t have permission to view appointments', 403),
        { status: 403 }
      );
    }
    
    // Use the appointment handler function
    return getAppointmentsHandler(req);
    
  } catch (error) {
    logger.error('Error fetching appointments:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.auth?.userId
    });
    
    return NextResponse.json(
      formatError(
        error instanceof Error ? error.message : 'Error retrieving appointments',
        500
      ),
      { status: 500 }
    );
  }
}, { requiresAuth: true });

/**
 * POST /api/appointments
 * 
 * Creates a new appointment
 * Requires APPOINTMENTS_CREATE permission
 */
export const POST = routeHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Check permission using the correct pattern with role
    if (!await permissionMiddleware.hasPermission(
      req.auth?.userId as number, 
      SystemPermission.APPOINTMENTS_CREATE,
      req.auth?.role
    )) {
      logger.warn(`Permission denied: User ${req.auth?.userId} does not have permission ${SystemPermission.APPOINTMENTS_CREATE}`);
      return NextResponse.json(
        formatError('You don\'t have permission to create appointments', 403),
        { status: 403 }
      );
    }
    
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
    return NextResponse.json(
      formatSuccess(result, 'Appointment created successfully'),
      { status: 201 }
    );
    
  } catch (error) {
    logger.error('Error creating appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.auth?.userId
    });
    
    // Handle validation errors
    if (error instanceof Error && 'validationErrors' in error) {
      return NextResponse.json(
        formatValidationError(
          (error as any).validationErrors,
          'Appointment validation failed'
        ),
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      formatError(
        error instanceof Error ? error.message : 'Error creating appointment',
        500
      ),
      { status: 500 }
    );
  }
}, { requiresAuth: true });
