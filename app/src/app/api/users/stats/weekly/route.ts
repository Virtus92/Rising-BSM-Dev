import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { generateWeeklyStats } from '@/shared/utils/statistics-utils';

/**
 * GET /api/users/stats/weekly
 * Returns weekly user statistics for the past 12 weeks
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
    
    // Generate weekly stats using our utility function
    const weeklyStats = generateWeeklyStats(
      users,
      (user) => user.createdAt,
      12  // Past 12 weeks
    );
    
    // Enrich the data with additional fields expected by the UI
    const enrichedStats = weeklyStats.map(stat => ({
      ...stat,
      users: stat.count,
      week: stat.period,
      weekNumber: parseInt(stat.period.replace('Week ', '')),
      startDate: stat.startDate.toString().split('T')[0],
      endDate: stat.endDate.toString().split('T')[0]
    }));
    
    return formatSuccess(enrichedStats, 'Weekly user statistics retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving weekly user statistics:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve weekly user statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});