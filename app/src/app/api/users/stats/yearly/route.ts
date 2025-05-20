import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateYearlyStats } from '@/shared/utils/statistics-utils';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { CommonStatus } from '@/domain/enums/CommonEnums';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

/**
 * GET /api/users/stats/yearly
 * 
 * Returns yearly user statistics
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const years = parseInt(url.searchParams.get('years') || '5', 10);
    
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    
    // Get all users
    const usersResponse = await userService.findAll({
      limit: 1000, // High limit to get all users
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
      (user: UserResponseDto) => user.createdAt,
      years
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = yearlyStats.map(stat => {
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
      
      return {
        ...stat,
        users: stat.count,
        admins,
        managers,
        staff,
        active,
        inactive
      };
    });
    
    return formatSuccess(
      enrichedStats, 
      'Yearly user statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating yearly user stats:', {
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