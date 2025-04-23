import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { generateMonthlyStats } from '@/shared/utils/statistics-utils';

/**
 * GET /api/users/stats/monthly
 * Returns monthly user statistics for the current year
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get the user service from service factory
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get all users with creation dates
    const usersResponse = await userService.findUsers({
      page: 1,
      limit: 1000, // Set a high limit to get all users
      includePermissions: false, // Exclude permissions for optimization
      includeRole: false // Exclude role details for optimization
    }, {
      context: {
        userId: request.auth?.userId
      }
    });
    
    let users: UserResponseDto[] = [];
    
    // Safely extract user data from response
    if (usersResponse && usersResponse.success) {
      if (usersResponse.data && Array.isArray(usersResponse.data)) {
        users = usersResponse.data;
      } else if (usersResponse.data && usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
        users = usersResponse.data.data;
      }
    }
    
    // Log number of users processed for debugging
    console.log(`Generating monthly stats for ${users.length} users`);
    
    // Generate monthly stats using our utility function
    const monthlyStats = generateMonthlyStats(
      users,
      (user) => user.createdAt,
      12  // Past 12 months
    );
    
    // Enrich the data with additional fields expected by the UI
    const enrichedStats = monthlyStats.map(stat => ({
      ...stat,
      users: stat.count,
      month: stat.period.split(' ')[0], // Extract month name
      startDate: stat.startDate.toString().split('T')[0],
      endDate: stat.endDate.toString().split('T')[0]
    }));
    
    return formatSuccess(enrichedStats, 'Monthly user statistics retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving monthly user statistics:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve monthly user statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});