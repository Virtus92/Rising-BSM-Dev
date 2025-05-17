import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateWeeklyStats } from '@/shared/utils/statistics-utils';
import { AppointmentResponseDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/appointments/stats/weekly
 * 
 * Returns weekly appointment statistics
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Extract query parameters for customization
    const url = new URL(request.url);
    const weeksParam = url.searchParams.get('weeks');
    const targetWeeks = weeksParam ? parseInt(weeksParam, 10) : 12; // Default to 12 weeks
    
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
    
    // Generate weekly stats using our utility function
    const weeklyStats = generateWeeklyStats(
      appointments,
      (appointment: AppointmentResponseDto) => appointment.appointmentDate,
      targetWeeks
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = weeklyStats.map(stat => {
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
      
      // Extract week number from period string (e.g., "Week 15")
      const week = parseInt(stat.period.replace('Week ', ''), 10);
      
      return {
        ...stat,
        weekKey: `${stat.year}-W${week.toString().padStart(2, '0')}`,
        week,
        label: stat.period,
        count: stat.count,
        completed,
        cancelled,
        planned,
        confirmed,
        rescheduled
      };
    });
    
    return formatSuccess(enrichedStats, 'Weekly appointment statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching weekly appointment statistics:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving appointment statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
