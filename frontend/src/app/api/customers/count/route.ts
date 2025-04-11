import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/customers/count
 * Returns the total count of customers in the system
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get customer service
    const customerService = serviceFactory.createCustomerService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Get count directly from repository
    const count = await customerService.getRepository().count();
    
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
