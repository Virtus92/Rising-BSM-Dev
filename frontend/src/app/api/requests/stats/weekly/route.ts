import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { generateWeeklyStats } from '@/shared/utils/statistics-utils';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/requests/stats/weekly
 * 
 * Returns weekly contact request statistics for the current year
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Extract query parameters for customization
    const url = new URL(request.url);
    const weeksParam = url.searchParams.get('weeks');
    const targetWeeks = weeksParam ? parseInt(weeksParam, 10) : 12; // Default to 12 weeks
    
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();
    
    // Get all requests
    const requestsResponse = await requestService.findAll({
      limit: 1000, // High limit to get all requests
      context: {
        userId: request.auth?.userId
      }
    });
    
    let requests: RequestResponseDto[] = [];
    if (requestsResponse && requestsResponse.data) {
      requests = requestsResponse.data;
    }
    
    // Generate weekly stats using our utility function
    const weeklyStats = generateWeeklyStats(
      requests,
      (req: RequestResponseDto) => req.createdAt,
      targetWeeks
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = weeklyStats.map(stat => {
      // Filter requests for this period
      const periodRequests = requests.filter(req => {
        const createdDate = new Date(req.createdAt);
        return createdDate >= new Date(stat.startDate) && 
               createdDate <= new Date(stat.endDate);
      });
      
      // Count by status
      const newRequests = periodRequests.filter(r => r.status === RequestStatus.NEW).length;
      const inProgress = periodRequests.filter(r => r.status === RequestStatus.IN_PROGRESS).length;
      const completed = periodRequests.filter(r => r.status === RequestStatus.COMPLETED).length;
      const cancelled = periodRequests.filter(r => r.status === RequestStatus.CANCELLED).length;
      const convertedToCustomer = periodRequests.filter(r => r.customerId !== null && r.customerId !== undefined).length;
      
      // Extract week number from period string (e.g., "Week 15")
      const week = parseInt(stat.period.replace('Week ', ''), 10);
      
      return {
        ...stat,
        weekKey: `${stat.year}-W${week.toString().padStart(2, '0')}`,
        week,
        label: stat.period,
        total: stat.count,
        new: newRequests,
        inProgress,
        completed,
        cancelled,
        convertedToCustomer,
        conversionRate: stat.count > 0 ? (convertedToCustomer / stat.count) : 0
      };
    });
    
    return formatSuccess(enrichedStats, 'Weekly request statistics retrieved successfully');
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
