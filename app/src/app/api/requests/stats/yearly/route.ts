import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateYearlyStats } from '@/shared/utils/statistics-utils';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/requests/stats/yearly
 * 
 * Returns yearly request statistics
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const years = parseInt(url.searchParams.get('years') || '5', 10);
    
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
    
    // Generate yearly stats using our utility function
    const yearlyStats = generateYearlyStats(
      requests,
      (request: RequestResponseDto) => request.createdAt,
      years
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = yearlyStats.map(stat => {
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
      
      return {
        ...stat,
        requests: stat.count,
        completed,
        inProgress,
        new: newRequests,
        cancelled
      };
    });
    
    return formatSuccess(
      enrichedStats, 
      'Yearly request statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating yearly request stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve yearly request statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});