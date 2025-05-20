import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateMonthlyStats } from '@/shared/utils/statistics-utils';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/requests/stats/monthly
 * Returns monthly request statistics for the past 12 months
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const lookbackMonths = parseInt(url.searchParams.get('months') || '12', 10);
    
    const serviceFactory = getServiceFactory();
    const requestService = serviceFactory.createRequestService();
    
    // Get all requests - simplify data retrieval
    const requestsResponse = await requestService.findAll({
      limit: 1000, // High limit to get all requests
      context: {
        userId: request.auth?.userId
      }
    });
    
    // Safely extract request data from response
    let requests: RequestResponseDto[] = [];
    
    if (requestsResponse && requestsResponse.data) {
      requests = requestsResponse.data;
    }
    
    logger.info(`Generating monthly stats for ${requests.length} requests`);
    
    // Generate monthly stats using our utility function
    const monthlyStats = generateMonthlyStats(
      requests,
      (request: RequestResponseDto) => request.createdAt,
      lookbackMonths
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = monthlyStats.map(stat => {
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
        requests: stat.count, // Set the entity-specific count field
        completed,
        inProgress,
        new: newRequests,
        cancelled
      };
    });
    
    // Log what we're returning for debugging
    logger.info('Monthly request stats generated', { 
      count: enrichedStats.length,
      sample: enrichedStats.length > 0 ? JSON.stringify(enrichedStats[0]).substring(0, 200) : 'No data' 
    });
    
    return formatSuccess(
      enrichedStats, 
      'Monthly request statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating monthly request stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return a more detailed error for debugging purposes
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving Requests statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
