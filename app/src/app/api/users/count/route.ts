import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';

/**
 * GET /api/users/count
 * Get user count
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get the user service from service factory
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get user count from the repository
    const result = await userService.getRepository().count();
    
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
    
    return formatSuccess({ count }, 'User count retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving user count:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve user count',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
