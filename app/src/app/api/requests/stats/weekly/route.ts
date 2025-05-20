import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateWeeklyStats } from '@/shared/utils/statistics-utils';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/requests/stats/weekly
 * 
 * Returns weekly request statistics
 */
export const GET = routeHandler(async (request: NextRequest) => {
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
      (request: RequestResponseDto) => request.createdAt,
      targetWeeks
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = weeklyStats.map(stat => {
      // Filter requests for this period
      const periodRequests = requests.filter(req => {
        const requestDate = new Date(req.createdAt);
        return requestDate >= new Date(stat.startDate) && 
               requestDate <= new Date(stat.endDate);
      });
      
      // Count by status
      const completed = periodRequests.filter(r => r.status === RequestStatus.COMPLETED).length;
      const inProgress = periodRequests.filter(r => r.status === RequestStatus.IN_PROGRESS).length;
      const newRequests = periodRequests.filter(r => r.status === RequestStatus.NEW).length;
      const cancelled = periodRequests.filter(r => r.status === RequestStatus.CANCELLED).length;
      
      // Extract week number from period string (e.g., "Week 15")
      const week = parseInt(stat.period.replace('Week ', ''), 10);
      
      return {
        ...stat,
        weekKey: `${stat.year}-W${week.toString().padStart(2, '0')}`,
        week,
        label: stat.period,
        requests: stat.count,
        completed,
        inProgress,
        new: newRequests,
        cancelled
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