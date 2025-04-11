/**
 * GET /api/appointments/count
 * Returns the total count of appointments in the system
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get the appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Get appointment count directly from repository
    const count = await appointmentService.getRepository().count();
    
    return formatSuccess({ count }, 'Appointment count retrieved successfully');
  } catch (error) {
    logger.error('Error counting appointments:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve appointment count',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
