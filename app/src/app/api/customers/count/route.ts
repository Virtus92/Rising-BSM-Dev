import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';

/**
 * GET /api/customers/count
 * Returns the total count of customers in the system
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Get count directly from repository
    const result = await customerService.getRepository().count();
    
    // Ensure we have a proper count response
    let count = 0;
    
    if (typeof result === 'number') {
      count = result;
    } else if (result && typeof result === 'object') {
      if ('count' in result) {
        count = result.count as number;
      } else if ('total' in result) {
        count = result.total as number;
      }
    }
    
    return formatSuccess({ count }, 'Customer count retrieved successfully');
  } catch (error) {
    logger.error('Error counting customers:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve customer count',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
