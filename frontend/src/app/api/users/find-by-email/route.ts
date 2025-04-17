/**
 * API route for finding a user by email
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler, formatResponse } from '@/infrastructure/api/route-handler';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/users/find-by-email?email=example@email.com
 * Find a user by email
 */
export const GET = apiRouteHandler(async (req: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();

  try {
    // Get email from query params
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return formatResponse.error('Email parameter is required', 400);
    }

    // Create user service
    const userService = serviceFactory.createUserService();
    
    // Find user by email
    const user = await userService.findByEmail(email, {
      context: { userId: req.auth?.userId }
    });
    
    // Return the user, whether found or not
    return formatResponse.success(user, user ? 'User found' : 'User not found');
  } catch (error) {
    logger.error('Error finding user by email:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatResponse.error(
      error instanceof Error ? error.message : 'Error finding user by email',
      500
    );
  }
}, {
  requiresAuth: true
});
