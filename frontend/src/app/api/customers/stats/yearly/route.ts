import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';
import { generateYearlyStats } from '@/shared/utils/statistics-utils';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { CommonStatus, CustomerType } from '@/domain/enums/CommonEnums';

/**
 * GET /api/customers/stats/yearly
 * 
 * Returns yearly customer statistics
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const years = parseInt(url.searchParams.get('years') || '3', 10);
    
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
    
    // Generate yearly stats using our utility function
    const yearlyStats = generateYearlyStats(
      customers,
      (customer: CustomerResponseDto) => customer.createdAt,
      years
    );
    
    // Enrich with additional data needed for the UI
    const enrichedStats = yearlyStats.map(stat => {
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
        customers: stat.count,
        active,
        inactive,
        privateCustomers,
        businessCustomers
      };
    });
    
    return formatSuccess(
      enrichedStats, 
      'Yearly customer statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating yearly customer stats:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve yearly customer statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});

/**
 * Calculates the percentage growth between current and previous period
 */
function calculateGrowthPercentage(customers: CustomerResponseDto[], currentPeriod: string, previousPeriod: string): number {
  const currentCount = customers.filter(c => {
    const year = new Date(c.createdAt).getFullYear().toString();
    return year === currentPeriod;
  }).length;
  
  const previousCount = customers.filter(c => {
    const year = new Date(c.createdAt).getFullYear().toString();
    return year === previousPeriod;
  }).length;
  
  if (previousCount === 0) return 100; // Consider it 100% growth if previous was 0
  
  return Math.round(((currentCount - previousCount) / previousCount) * 100);
}