import { NextResponse } from 'next/server';
import { auth } from '../../../auth/middleware/authMiddleware';
import { getPrismaClient } from '@/infrastructure/common/database/prisma';
import { getLogger } from '@/infrastructure/common/logging';

/**
 * GET /api/appointments/stats/monthly
 * Returns monthly appointment statistics for the past 12 months
 */
export async function GET(request: Request) {
  const logger = getLogger();
  
  try {
    // Verify authentication
    const authResult = await auth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status }
      );
    }

    // Get prisma client
    const prisma = getPrismaClient();

    // Get URL parameters
    const url = new URL(request.url);
    const months = parseInt(url.searchParams.get('months') || '12', 10);
    
    // Calculate start date (X months ago)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    // Format dates to beginning/end of month
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    // Generate monthly ranges
    const monthRanges = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      monthRanges.push({
        start: new Date(monthStart),
        end: new Date(monthEnd),
        month: monthStart.toLocaleString('default', { month: 'short' }),
        year: year
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Query appointments for each month using the correct field appointmentDate
    const monthlyStats = await Promise.all(
      monthRanges.map(async (range) => {
        const count = await prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: range.start,
              lte: range.end
            }
          }
        });
        
        return {
          month: `${range.month} ${range.year}`,
          count: count,
          period: {
            start: range.start.toISOString(),
            end: range.end.toISOString()
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: monthlyStats,
      message: 'Monthly appointment statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('[API] Error generating monthly appointment stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve monthly appointment statistics', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
