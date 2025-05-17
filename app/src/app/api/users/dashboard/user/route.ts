import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';

/**
 * GET /api/users/dashboard/user
 * 
 * Retrieves user dashboard data including user statistics for charts
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Get user service
    const userService = serviceFactory.createUserService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Prepare response data structure
    const data = [];
    
    // Get user counts per month for the current year
    for (let i = 0; i < 12; i++) {
      // Create date ranges for this month
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0, 23, 59, 59, 999);
      
      // Skip future months
      if (monthStart > currentDate) {
        continue;
      }
      
      // Get user count up to this month (cumulative)
      const userCount = await userService.count({
        context,
        filters: {
          createdBefore: monthEnd
        }
      });
      
      // Get month name
      const monthName = monthStart.toLocaleString('en-US', { month: 'short' });
      
      // Add to data array
      data.push({
        period: monthName,
        users: userCount
      });
    }
    
    logger.info('User dashboard data retrieved successfully');
    return formatSuccess(data, 'User dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user dashboard data:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving user dashboard data',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
