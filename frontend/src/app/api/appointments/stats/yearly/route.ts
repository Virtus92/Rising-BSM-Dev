import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/appointments/stats/yearly
 * Returns yearly appointment statistics
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const years = parseInt(url.searchParams.get('years') || '3', 10); // Default to 3 years
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Create context with user ID
    const context = { userId: request.auth?.userId };
    
    // Get repository for direct data access
    const repository = appointmentService.getRepository();
    
    // Calculate date ranges for the years
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - years);
    
    // Initialize yearly stats
    const yearlyStats = [];
    
    // Get all appointments in the date range
    const appointments = await repository.findByDateRange(startDate, endDate);
    
    // Group appointments by year
    const appointmentsByYear = new Map<number, any[]>();
    
    for (const appointment of appointments) {
      const date = new Date(appointment.appointmentDate);
      const year = date.getFullYear();
      
      if (!appointmentsByYear.has(year)) {
        appointmentsByYear.set(year, []);
      }
      
      appointmentsByYear.get(year)?.push(appointment);
    }
    
    // Create stats for each year
    for (let y = today.getFullYear() - years + 1; y <= today.getFullYear(); y++) {
      const yearAppointments = appointmentsByYear.get(y) || [];
      
      // Count by status
      const completed = yearAppointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = yearAppointments.filter(a => a.status === 'CANCELLED').length;
      
      // Add to yearly stats
      yearlyStats.push({
        year: y,
        count: yearAppointments.length,
        completed,
        cancelled,
        // Calculate completion rate
        completionRate: yearAppointments.length > 0 
          ? completed / yearAppointments.length 
          : 0
      });
    }
    
    return formatSuccess(
      yearlyStats, 
      'Yearly appointment statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating yearly appointment stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve yearly appointment statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
