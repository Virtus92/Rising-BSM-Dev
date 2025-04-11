import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/appointments/upcoming
 * Returns upcoming appointments within the next 7 days
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Get upcoming appointments directly from repository
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);
    
    // Find appointments between today and end date
    const appointments = await appointmentService.getRepository().findByDateRange(today, endDate);
    
    // Sort by date and limit
    const sortedAppointments = appointments
      .sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);
    
    // Map to DTOs
    const result = sortedAppointments.map(appointment => {
      const dateObj = new Date(appointment.appointmentDate);
      return {
        id: appointment.id,
        title: appointment.title,
        appointmentDate: appointment.appointmentDate instanceof Date ? 
          appointment.appointmentDate.toISOString() : appointment.appointmentDate,
        dateFormatted: dateObj.toLocaleDateString(),
        timeFormatted: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: appointment.status,
        customerId: appointment.customerId,
        duration: appointment.duration || 60
      };
    });
    
    return formatSuccess(result, `Retrieved upcoming appointments successfully`);
  } catch (error) {
    logger.error('Error fetching upcoming appointments:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve upcoming appointments',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
