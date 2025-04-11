import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';

const prisma = new PrismaClient();

/**
 * GET /api/users/dashboard/user
 * 
 * Retrieves user dashboard data including user statistics for charts
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  try {
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
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
      const userCount = await prisma.user.count({
        where: {
          createdAt: {
            lte: monthEnd
          }
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
    
    return formatSuccess(data);
  } catch (error) {
    console.error('Error fetching user dashboard data:', error);
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving user dashboard data',
      500
    );
  }
});
