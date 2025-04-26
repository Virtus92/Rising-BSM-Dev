/**
 * Get Appointment API Route Handler
 * Handles retrieving a single appointment by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { permissionMiddleware } from '@/features/permissions/api/middleware/permissionMiddleware';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * Handles GET /api/appointments/[id] - Get appointment by ID
 */
export async function getAppointmentHandler(
  request: NextRequest,
  appointmentId: string | number
): Promise<NextResponse> {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  const id = typeof appointmentId === 'string' ? parseInt(appointmentId, 10) : appointmentId;

  try {
    // Validate ID
    if (isNaN(id)) {
      return formatResponse.error('Invalid appointment ID', 400);
    }

    // Validate authentication
    if (!request.auth?.userId) {
      logger.warn('Appointment detail access attempted without authentication');
      return formatResponse.error('Authentication required', 401);
    }
    
    // Check permission
    if (!await permissionMiddleware.hasPermission(
      request.auth.userId, 
      SystemPermission.APPOINTMENTS_VIEW
    )) {
      logger.warn(`Permission denied: User ${request.auth.userId} does not have permission to view appointment ${id}`);
      return formatResponse.error(
        `You don't have permission to view this appointment`, 
        403
      );
    }
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Get appointment by ID
    const appointment = await appointmentService.getById(id);
    
    if (!appointment) {
      return formatResponse.error('Appointment not found', 404);
    }
    
    return formatResponse.success(appointment, 'Appointment retrieved successfully');
  } catch (error) {
    logger.error('Error fetching appointment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      appointmentId: id
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Failed to fetch appointment',
      500
    );
  }
}