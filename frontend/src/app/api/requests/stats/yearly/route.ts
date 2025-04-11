import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/requests/stats/yearly
 * Returns yearly request statistics
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const years = parseInt(url.searchParams.get('years') || '3', 10); // Default to 3 years
    
    // Get request service
    const requestService = serviceFactory.createRequestService();
    
    // Create context with user ID
    const context = { userId: request.auth?.userId };
    
    // Get repository for direct data access
    const repository = requestService.getRepository();
    
    // Calculate date ranges for the years
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - years);
    
    // Initialize yearly stats
    const yearlyStats = [];
    
    // Get all requests in the date range
    const requests = await repository.findByCriteria({
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    });
    
    // Group requests by year
    const requestsByYear = new Map<number, any[]>();
    
    for (const request of requests) {
      const date = new Date(request.createdAt);
      const year = date.getFullYear();
      
      if (!requestsByYear.has(year)) {
        requestsByYear.set(year, []);
      }
      
      requestsByYear.get(year)?.push(request);
    }
    
    // Create stats for each year
    for (let y = today.getFullYear() - years + 1; y <= today.getFullYear(); y++) {
      const yearRequests = requestsByYear.get(y) || [];
      
      // Count by status
      const newRequests = yearRequests.filter(r => r.status === 'NEW').length;
      const inProgress = yearRequests.filter(r => r.status === 'IN_PROGRESS').length;
      const completed = yearRequests.filter(r => r.status === 'COMPLETED').length;
      const cancelled = yearRequests.filter(r => r.status === 'CANCELLED').length;
      const convertedToCustomer = yearRequests.filter(r => r.convertedToCustomer).length;
      
      // Add to yearly stats
      yearlyStats.push({
        year: y,
        total: yearRequests.length,
        new: newRequests,
        inProgress,
        completed,
        cancelled,
        convertedToCustomer,
        // Calculate conversion rate
        conversionRate: yearRequests.length > 0
          ? convertedToCustomer / yearRequests.length
          : 0
      });
    }
    
    return formatSuccess(
      yearlyStats, 
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
