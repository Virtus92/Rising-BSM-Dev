import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { generateYearlyStats } from '@/shared/utils/statistics-utils';

/**
 * GET /api/users/stats/yearly
 * Returns yearly user statistics for the past 5 years
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get the user service from service factory
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get all users with creation dates
    const usersResponse = await userService.findUsers({
      page: 1,
      limit: 1000 // Set a high limit to get all users
    }, {
      context: {
        userId: request.auth?.userId
      }
    });
    
    let users: UserResponseDto[] = [];
    
    if (usersResponse && usersResponse.data) {
      users = usersResponse.data;
    }
    
    // Generate yearly stats using our utility function
    const yearlyStats = generateYearlyStats(
      users,
      (user) => user.createdAt,
      5  // Past 5 years
    );
    
    // Enrich the data with additional fields expected by the UI
    const enrichedStats = yearlyStats.map(stat => ({
      ...stat,
      users: stat.count,
      startDate: stat.startDate.toString().split('T')[0],
      endDate: stat.endDate.toString().split('T')[0]
    }));
    
    return formatSuccess(enrichedStats, 'Yearly user statistics retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving yearly user statistics:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve yearly user statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});