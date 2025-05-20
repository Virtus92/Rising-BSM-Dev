import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateMonthlyStats } from '@/shared/utils/statistics-utils';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { CommonStatus } from '@/domain/enums/CommonEnums';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

/**
 * GET /api/users/stats/monthly
 * Returns monthly user statistics for the past 12 months
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const lookbackMonths = parseInt(url.searchParams.get('months') || '12', 10);
    
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get all users - simplify data retrieval
    const usersResponse = await userService.findAll({
      limit: 1000, // High limit to get all users
      context: {
        userId: request.auth?.userId
      }
    });
    
    // Safely extract user data from response
    let users: UserResponseDto[] = [];
    
    if (usersResponse && usersResponse.data) {
      users = usersResponse.data;
    }
    
    logger.info(`Generating monthly stats for ${users.length} users`);
    
    // Generate monthly stats using our utility function
    const monthlyStats = generateMonthlyStats(
      users,
      (user: UserResponseDto) => user.createdAt,
      lookbackMonths
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = monthlyStats.map(stat => {
      // Filter users for this period
      const periodUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= new Date(stat.startDate) && 
               userDate <= new Date(stat.endDate);
      });
      
      // Count by role
      const admins = periodUsers.filter(u => u.role === UserRole.ADMIN).length;
      const managers = periodUsers.filter(u => u.role === UserRole.MANAGER).length;
      const staff = periodUsers.filter(u => u.role === UserRole.EMPLOYEE).length;
      
      // Count by status
      const active = periodUsers.filter(u => u.status === UserStatus.ACTIVE).length;
      const inactive = periodUsers.filter(u => u.status === UserStatus.INACTIVE).length;
      
      // Make sure we extract the month name correctly
      const monthParts = stat.period.split(' ');
      const month = monthParts[0];
      const year = monthParts[1] || new Date().getFullYear().toString();
      
      return {
        ...stat,
        month, // Extract month name
        year,  // Include year explicitly
        period: stat.period, // Keep the original period
        count: stat.count,  // Keep the original count
        users: stat.count, // Set the entity-specific count field
        admins,
        managers,
        staff,
        active,
        inactive
      };
    });
    
    // Log what we're returning for debugging
    logger.info('Monthly user stats generated', { 
      count: enrichedStats.length,
      sample: enrichedStats.length > 0 ? JSON.stringify(enrichedStats[0]).substring(0, 200) : 'No data' 
    });
    
    return formatSuccess(
      enrichedStats, 
      'Monthly user statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating monthly user stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return a more detailed error for debugging purposes
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving user statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
