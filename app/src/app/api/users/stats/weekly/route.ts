import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateWeeklyStats } from '@/shared/utils/statistics-utils';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { CommonStatus } from '@/domain/enums/CommonEnums';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

/**
 * GET /api/users/stats/weekly
 * 
 * Returns weekly user statistics
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Extract query parameters for customization
    const url = new URL(request.url);
    const weeksParam = url.searchParams.get('weeks');
    const targetWeeks = weeksParam ? parseInt(weeksParam, 10) : 12; // Default to 12 weeks
    
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
    
    // Generate weekly stats using our utility function
    const weeklyStats = generateWeeklyStats(
      users,
      (user: UserResponseDto) => user.createdAt,
      targetWeeks
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = weeklyStats.map(stat => {
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
      
      // Extract week number from period string (e.g., "Week 15")
      const week = parseInt(stat.period.replace('Week ', ''), 10);
      
      return {
        ...stat,
        weekKey: `${stat.year}-W${week.toString().padStart(2, '0')}`,
        week,
        label: stat.period,
        users: stat.count,
        admins,
        managers,
        staff,
        active,
        inactive
      };
    });
    
    return formatSuccess(enrichedStats, 'Weekly user statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching weekly user statistics:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving user statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});