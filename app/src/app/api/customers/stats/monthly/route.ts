import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { generateMonthlyStats } from '@/shared/utils/statistics-utils';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';

/**
 * GET /api/customers/stats/monthly
 * 
 * Returns monthly customer statistics for the past 12 months
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const lookbackMonths = parseInt(url.searchParams.get('months') || '12', 10);
    
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
    
    // Generate monthly stats using our utility function
    const monthlyStats = generateMonthlyStats(
      customers,
      (customer: CustomerResponseDto) => customer.createdAt,
      lookbackMonths
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = monthlyStats.map(stat => {
      // Filter customers for this period
      const periodCustomers = customers.filter(cust => {
        const creationDate = new Date(cust.createdAt);
        return creationDate >= new Date(stat.startDate) && 
               creationDate <= new Date(stat.endDate);
      });
      
      // Count by status
      const active = periodCustomers.filter(c => c.status === CommonStatus.ACTIVE).length;
      const inactive = periodCustomers.filter(c => c.status === CommonStatus.INACTIVE).length;
      
      // Count by type
      const privateCustomers = periodCustomers.filter(c => c.type === CustomerType.PRIVATE).length;
      const businessCustomers = periodCustomers.filter(c => c.type === CustomerType.BUSINESS).length;
      
      return {
        ...stat,
        month: stat.period.split(' ')[0], // Extract month name
        customers: stat.count,
        active,
        inactive,
        privateCustomers,
        businessCustomers
      };
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
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve monthly customer statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
