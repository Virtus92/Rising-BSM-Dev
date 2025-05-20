import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateMonthlyStats } from '@/shared/utils/statistics-utils';
import { AppointmentResponseDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/appointments/stats/monthly
 * Returns monthly appointment statistics for the past 12 months
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const lookbackMonths = parseInt(url.searchParams.get('months') || '12', 10);
    
    const serviceFactory = getServiceFactory();
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Get all appointments - simplify data retrieval
    const appointmentsResponse = await appointmentService.findAll({
      limit: 1000, // High limit to get all appointments
      context: {
        userId: request.auth?.userId
      }
    });
    
    // Safely extract appointment data from response
    let appointments: AppointmentResponseDto[] = [];
    
    if (appointmentsResponse && appointmentsResponse.data) {
      appointments = appointmentsResponse.data;
    }
    
    logger.info(`Generating monthly stats for ${appointments.length} appointments`);
    
    // Generate monthly stats using our utility function
    const monthlyStats = generateMonthlyStats(
      appointments,
      (appointment: AppointmentResponseDto) => appointment.appointmentDate,
      lookbackMonths
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = monthlyStats.map(stat => {
      // Filter appointments for this period
      const periodAppointments = appointments.filter(apt => {
        const appointmentDate = new Date(apt.appointmentDate);
        return appointmentDate >= new Date(stat.startDate) && 
               appointmentDate <= new Date(stat.endDate);
      });
      
      // Count by status
      const completed = periodAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
      const cancelled = periodAppointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;
      const planned = periodAppointments.filter(a => a.status === AppointmentStatus.PLANNED).length;
      const confirmed = periodAppointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
      const rescheduled = periodAppointments.filter(a => a.status === AppointmentStatus.RESCHEDULED).length;
      
      // Make sure we extract the month name correctly
      const monthParts = stat.period.split(' ');
      const month = monthParts[0];
      const year = monthParts[1] || new Date().getFullYear().toString();
      
      return {
        ...stat,
        month, // Extract month name
        year,  // Include year explicitly
        period: stat.period, // Keep the original period
        count: stat.count,  // Keep the original count
        appointments: stat.count, // Alias count as appointments for compatibility
        completed,
        cancelled,
        planned,
        confirmed,
        rescheduled
      };
    });
    
    // Log what we're returning for debugging
    logger.info('Monthly stats generated', { 
      count: enrichedStats.length,
      sample: enrichedStats.length > 0 ? JSON.stringify(enrichedStats[0]).substring(0, 200) : 'No data' 
    });
    
    return formatSuccess(
      enrichedStats, 
      'Monthly appointment statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating monthly appointment stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return a more detailed error for debugging purposes using details instead of endpoint
    return formatError(error as Error);
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});