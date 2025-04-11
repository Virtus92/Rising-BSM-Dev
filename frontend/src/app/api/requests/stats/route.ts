import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/requests/stats
 * 
 * Returns statistics about contact requests.
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Create context with user ID
    const context = { userId: request.auth?.userId };
    
    // Get request stats
    const stats = await requestService.getRequestStats(period, { context });
    
    return formatSuccess(stats, 'Request statistics retrieved successfully');
    
  } catch (error) {
    logger.error('Error fetching request stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve request statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
