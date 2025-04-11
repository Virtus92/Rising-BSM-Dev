import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/appointments/stats/monthly
 * Returns monthly appointment statistics for the past 12 months
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const months = parseInt(url.searchParams.get('months') || '12', 10);
    
    // Get appointment service
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Create context with user ID
    const context = { userId: request.auth?.userId };
    
    // Get monthly stats from repository directly to avoid method errors
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - months);
    
    // Get appointments in the date range
    const appointments = await appointmentService.getRepository().findByDateRange(startDate, today);
    
    // Process data to calculate monthly stats
    const monthlyMap = new Map();
    
    // Initialize months
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(today);
      monthDate.setMonth(today.getMonth() - i);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, {
        month: monthKey,
        label: monthDate.toLocaleString('default', { month: 'long' }),
        year: monthDate.getFullYear(),
        count: 0,
        completed: 0,
        cancelled: 0
      });
    }
    
    // Count appointments by month
    for (const appointment of appointments) {
      const date = new Date(appointment.appointmentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyMap.has(monthKey)) {
        const stats = monthlyMap.get(monthKey);
        stats.count++;
        
        if (appointment.status === 'COMPLETED') {
          stats.completed++;
        } else if (appointment.status === 'CANCELLED') {
          stats.cancelled++;
        }
      }
    }
    
    // Convert to array and sort by month
    const monthlyStats = Array.from(monthlyMap.values());
    monthlyStats.sort((a, b) => a.month.localeCompare(b.month));
    
    return formatSuccess(
      monthlyStats, 
      'Monthly appointment statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating monthly appointment stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve monthly appointment statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
