import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { generateMonthlyStats } from '@/shared/utils/statistics-utils';

/**
 * GET /api/users/stats/monthly
 * Returns monthly user statistics for the current year
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
      limit: 1000, // Set a high limit to get all users
      // Use type assertion to add custom properties not in the DTO
      ...({
        includePermissions: false, // Exclude permissions for optimization
        includeRole: false // Exclude role details for optimization
      } as any)
    }, {
      context: {
        userId: request.auth?.userId
      }
    });
    
    let users: UserResponseDto[] = [];
    
    // Safely extract user data from response
    if (usersResponse) {
      // Use type assertion to avoid 'never' type issues
      const typedResponse = usersResponse as Record<string, any>;
      
      if (typedResponse.success) {
        if (typedResponse.data && Array.isArray(typedResponse.data)) {
          users = typedResponse.data;
        } else if (typedResponse.data && typeof typedResponse.data === 'object') {
          const typedData = typedResponse.data as Record<string, any>;
          if (typedData.data && Array.isArray(typedData.data)) {
            users = typedData.data;
          }
        }
      }
    }
    
    // Log number of users processed for debugging
    console.log(`Generating monthly stats for ${users.length} users`);
    
    // Generate monthly stats using our utility function
    const monthlyStats = generateMonthlyStats(
      users,
      (user) => {
        // Use type assertion to avoid 'never' type issues
        const typedUser = user as Record<string, any>;
        return typedUser.createdAt;
      },
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