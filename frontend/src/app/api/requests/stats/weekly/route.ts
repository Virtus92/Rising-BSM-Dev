import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/requests/stats/weekly
 * 
 * Returns weekly contact request statistics for the current year
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Extract query parameters for customization
    const url = new URL(request.url);
    const weeksParam = url.searchParams.get('weeks');
    const targetWeeks = weeksParam ? parseInt(weeksParam, 10) : 12; // Default to 12 weeks if not specified
    
    // Get the request service
    const requestService = serviceFactory.createRequestService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Get repository for direct data access
    const repository = requestService.getRepository();
    
    // Calculate date ranges
    const today = new Date();
    const endDate = new Date(today);
    
    // Calculate start date (targetWeeks weeks ago)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (targetWeeks * 7));
    
    // Get requests in the date range
    const requests = await repository.findByCriteria({
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    });
    
    // Prepare the week map for organizing requests
    const weekMap = new Map<string, any[]>();
    
    // Helper function to get the week number and year
    const getWeekNumber = (date: Date): { week: number, year: number } => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return { week: weekNo, year: d.getUTCFullYear() };
    };
    
    // Initialize week data for the target weeks
    for (let i = 0; i < targetWeeks; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() - (i * 7));
      const { week, year } = getWeekNumber(weekDate);
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
    }
    
    // Group requests by week
    for (const request of requests) {
      const date = new Date(request.createdAt);
      const { week, year } = getWeekNumber(date);
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      
      weekMap.get(weekKey)?.push(request);
    }
    
    // Create weekly stats array sorted by date (newest first)
    const weeklyStats = Array.from(weekMap.entries()).map(([weekKey, requests]) => {
      // Count requests by status
      const newRequests = requests.filter(r => r.status === 'NEW').length;
      const inProgress = requests.filter(r => r.status === 'IN_PROGRESS').length;
      const completed = requests.filter(r => r.status === 'COMPLETED').length;
      const cancelled = requests.filter(r => r.status === 'CANCELLED').length;
      const convertedToCustomer = requests.filter(r => r.convertedToCustomer).length;
      
      // Parse weekKey (e.g., "2024-W15")
      const [yearStr, weekStr] = weekKey.split('-W');
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekStr, 10);
      
      return {
        weekKey,
        year,
        week,
        total: requests.length,
        new: newRequests,
        inProgress,
        completed,
        cancelled,
        convertedToCustomer,
        // Generate a label like "Week 15"
        label: `Week ${week}`,
        // Calculate conversion rate
        conversionRate: requests.length > 0
          ? convertedToCustomer / requests.length
          : 0
      };
    }).sort((a, b) => {
      // Sort by year and week (newest first)
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.week - a.week;
    });
    
    return formatSuccess(weeklyStats, 'Weekly request statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching weekly request statistics:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving request statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
