import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { generateMonthlyStats } from '@/shared/utils/statistics-utils';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { CommonStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/customers/stats/monthly
 * Returns monthly customer statistics for the past 12 months
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const lookbackMonths = parseInt(url.searchParams.get('months') || '12', 10);
    
    const serviceFactory = getServiceFactory();
    const customerService = serviceFactory.createCustomerService();
    
    // Get all customers - simplify data retrieval
    const customersResponse = await customerService.findAll({
      limit: 1000, // High limit to get all customers
      context: {
        userId: request.auth?.userId
      }
    });
    
    // Safely extract customer data from response
    let customers: CustomerResponseDto[] = [];
    
    if (customersResponse && customersResponse.data) {
      customers = customersResponse.data;
    }
    
    logger.info(`Generating monthly stats for ${customers.length} customers`);
    
    // Generate monthly stats using our utility function
    const monthlyStats = generateMonthlyStats(
      customers,
      (customer: CustomerResponseDto) => customer.createdAt,
      lookbackMonths
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = monthlyStats.map(stat => {
      // Filter customers for this period
      const periodCustomers = customers.filter(customer => {
        const customerDate = new Date(customer.createdAt);
        return customerDate >= new Date(stat.startDate) && 
               customerDate <= new Date(stat.endDate);
      });
      
      // Count by status
      const active = periodCustomers.filter(c => c.status === CommonStatus.ACTIVE).length;
      const inactive = periodCustomers.filter(c => c.status === CommonStatus.INACTIVE).length;
      
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
        customers: stat.count, // Set the entity-specific count field
        active,
        inactive
      };
    });
    
    // Log what we're returning for debugging
    logger.info('Monthly customer stats generated', { 
      count: enrichedStats.length,
      sample: enrichedStats.length > 0 ? JSON.stringify(enrichedStats[0]).substring(0, 200) : 'No data' 
    });
    
    return formatSuccess(
      enrichedStats, 
      'Monthly customer statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating monthly customer stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return a more detailed error for debugging purposes
    return formatError(
      error instanceof Error ? error : 'Failed to retrieve monthly customer statistics',
      500,
      'STATS_ERROR',
      {
        details: error instanceof Error ? error.stack : 'Unknown error',
        endpoint: '/api/customers/stats/monthly'
      }
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
