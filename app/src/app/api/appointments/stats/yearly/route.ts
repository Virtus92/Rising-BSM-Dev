import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateYearlyStats } from '@/shared/utils/statistics-utils';
import { AppointmentResponseDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/appointments/stats/yearly
 * 
 * Returns yearly appointment statistics
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const years = parseInt(url.searchParams.get('years') || '5', 10); // Default to 5 years for better visualization
    
    const serviceFactory = getServiceFactory();
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Get all appointments
    const appointmentsResponse = await appointmentService.findAll({
      limit: 1000, // High limit to get all appointments
      context: {
        userId: request.auth?.userId
      }
    });
    
    let appointments: AppointmentResponseDto[] = [];
    if (appointmentsResponse && appointmentsResponse.data) {
      appointments = appointmentsResponse.data;
    }
    
    logger.info(`Generating yearly stats for ${appointments.length} appointments`);
    
    // Generate yearly stats using our utility function
    const yearlyStats = generateYearlyStats(
      appointments,
      (appointment: AppointmentResponseDto) => appointment.appointmentDate,
      years
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = yearlyStats.map(stat => {
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
      
      return {
        ...stat,
        period: stat.period, // Ensure period is explicitly included
        count: stat.count,   // Keep original count
        appointments: stat.count, // Alias count as appointments for compatibility
        completed,
        cancelled,
        planned,
        confirmed,
        rescheduled,
        year: parseInt(stat.period, 10) // Ensure year is a number
      };
    });
    
    // Log what we're returning for debugging
    logger.info('Yearly stats generated', { 
      count: enrichedStats.length,
      sample: enrichedStats.length > 0 ? JSON.stringify(enrichedStats[0]).substring(0, 200) : 'No data' 
    });
    
    return formatSuccess(
      enrichedStats, 
      'Yearly appointment statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating yearly appointment stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return a more detailed error for debugging purposes
    return formatError(
      error instanceof Error ? error : 'Failed to retrieve yearly appointment statistics',
      500,
      'STATS_ERROR',
      {
        details: error instanceof Error ? error.stack : 'Unknown error',
        endpoint: '/api/appointments/stats/yearly'
      }
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
