import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateWeeklyStats } from '@/shared/utils/statistics-utils';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { CommonStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/customers/stats/weekly
 * 
 * Returns weekly customer statistics
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Extract query parameters for customization
    const url = new URL(request.url);
    const weeksParam = url.searchParams.get('weeks');
    const targetWeeks = weeksParam ? parseInt(weeksParam, 10) : 12; // Default to 12 weeks
    
    const serviceFactory = getServiceFactory();
    const customerService = serviceFactory.createCustomerService();
    
    // Get all customers
    const customersResponse = await customerService.findAll({
      limit: 1000, // High limit to get all customers
      context: {
        userId: request.auth?.userId
      }
    });
    
    let customers: CustomerResponseDto[] = [];
    if (customersResponse && customersResponse.data) {
      customers = customersResponse.data;
    }
    
    // Generate weekly stats using our utility function
    const weeklyStats = generateWeeklyStats(
      customers,
      (customer: CustomerResponseDto) => customer.createdAt,
      targetWeeks
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = weeklyStats.map(stat => {
      // Filter customers for this period
      const periodCustomers = customers.filter(customer => {
        const customerDate = new Date(customer.createdAt);
        return customerDate >= new Date(stat.startDate) && 
               customerDate <= new Date(stat.endDate);
      });
      
      // Count by status
      const active = periodCustomers.filter(c => c.status === CommonStatus.ACTIVE).length;
      const inactive = periodCustomers.filter(c => c.status === CommonStatus.INACTIVE).length;
      
      // Extract week number from period string (e.g., "Week 15")
      const week = parseInt(stat.period.replace('Week ', ''), 10);
      
      return {
        ...stat,
        weekKey: `${stat.year}-W${week.toString().padStart(2, '0')}`,
        week,
        label: stat.period,
        customers: stat.count,
        active,
        inactive
      };
    });
    
    return formatSuccess(enrichedStats, 'Weekly customer statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching weekly customer statistics:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving customer statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});