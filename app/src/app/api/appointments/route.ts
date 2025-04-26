/**
 * Appointments API-Route
 * 
 * Handles appointment management requests
 */
import { NextRequest } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';
import { CreateAppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { withAuth } from '@/features/auth/api/middleware/authMiddleware';
import { getAppointmentsHandler } from '@/features/appointments/api';

/**
 * GET /api/appointments
 * 
 * Retrieves a list of appointments, optionally filtered and paginated
 * Requires APPOINTMENTS_VIEW permission
 */
export const GET = withAuth(
  permissionMiddleware.withPermission(
    async (req: NextRequest) => {
      return getAppointmentsHandler(req);
    },
    SystemPermission.APPOINTMENTS_VIEW
  )
);

/**
 * POST /api/appointments
 * 
 * Creates a new appointment
 * Requires APPOINTMENTS_CREATE permission
 */
export const POST = withAuth(
  permissionMiddleware.withPermission(
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
        
        return formatResponse.success(result, 'Appointment created successfully', 201);
      } catch (error) {
        logger.error('Error creating appointment:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Handle validation errors
        if (error instanceof Error && 'validationErrors' in error) {
          return formatResponse.validationError(
            (error as any).validationErrors
          );
        }
        
        return formatResponse.error(
          error instanceof Error ? error.message : 'Error creating appointment',
          500
        );
      }
    },
    SystemPermission.APPOINTMENTS_CREATE
  )
);