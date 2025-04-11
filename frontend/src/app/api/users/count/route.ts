import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/users/count
 * Get user count
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get the user service from service factory
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get user count from the repository
    const count = await userService.getRepository().count();
    
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
