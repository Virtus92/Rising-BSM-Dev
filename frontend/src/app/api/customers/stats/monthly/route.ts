import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';

const prisma = new PrismaClient();

/**
 * GET /api/customers/stats/monthly
 * 
 * Returns monthly customer statistics for the current year
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  try {
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Prepare response data structure
    const data = [];
    
    // Get customer counts per month for the current year
    for (let i = 0; i < 12; i++) {
      // Create date ranges for this month
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0, 23, 59, 59, 999);
      
      // Skip future months
      if (monthStart > currentDate) {
        continue;
      }
      
      // Count customers created in this month
      const customerCount = await prisma.customer.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });
      
      // Get month name
      const monthName = monthStart.toLocaleString('en-US', { month: 'short' });
      
      // Add to data array
      data.push({
        period: monthName,
        customers: customerCount
      });
    }
    
    return formatSuccess(data);
  } catch (error) {
    console.error('Error fetching monthly customer statistics:', error);
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving customer statistics',
      500
    );
  }
});
