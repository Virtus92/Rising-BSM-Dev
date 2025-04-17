import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { generateMonthlyStats } from '@/shared/utils/statistics-utils';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/requests/stats/monthly
 * 
 * Returns monthly request statistics for the past 12 months
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const lookbackMonths = parseInt(url.searchParams.get('months') || '12', 10);
    
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
    
    // Generate monthly stats using our utility function
    const monthlyStats = generateMonthlyStats(
      requests,
      (req: RequestResponseDto) => req.createdAt,
      lookbackMonths
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = monthlyStats.map(stat => {
      // Filter requests for this period
      const periodRequests = requests.filter(req => {
        const creationDate = new Date(req.createdAt);
        return creationDate >= new Date(stat.startDate) && 
               creationDate <= new Date(stat.endDate);
      });
      
      // Count by status
      const newRequests = periodRequests.filter(r => r.status === RequestStatus.NEW).length;
      const inProgress = periodRequests.filter(r => r.status === RequestStatus.IN_PROGRESS).length;
      const completed = periodRequests.filter(r => r.status === RequestStatus.COMPLETED).length;
      const cancelled = periodRequests.filter(r => r.status === RequestStatus.CANCELLED).length;
      const converted = periodRequests.filter(r => r.customerId !== null && r.customerId !== undefined).length;
      
      return {
        ...stat,
        month: stat.period.split(' ')[0], // Extract month name
        requests: stat.count,
        newRequests,
        inProgress,
        completed,
        cancelled,
        converted
      };
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
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve monthly request statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
