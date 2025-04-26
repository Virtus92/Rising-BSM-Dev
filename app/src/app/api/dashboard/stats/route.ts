import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories';
import { calculateMetricTrend, TrendDirection } from '@/shared/utils/trend-utils';
import { AppointmentResponseDto } from '@/domain/dtos/AppointmentDtos';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { AppointmentStatus, CommonStatus, RequestStatus } from '@/domain/enums/CommonEnums';

/**
 * GET /api/dashboard/stats
 * Returns aggregate statistics for the dashboard summary
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    const serviceFactory = getServiceFactory();
    const userService = serviceFactory.createUserService();
    const customerService = serviceFactory.createCustomerService();
    const requestService = serviceFactory.createRequestService();
    const appointmentService = serviceFactory.createAppointmentService();
    
    // Context for service calls
    const context = {
      userId: request.auth?.userId
    };
    
    // Get URL parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month'; // 'day', 'week', 'month', 'year'
    
    // Calculate date ranges based on period
    const now = new Date();
    const startDate = new Date(now);
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to month
    }
    
    // Get counts from services
    const [
      usersResponse,
      customersResponse,
      requestsResponse,
      appointmentsResponse
    ] = await Promise.all([
      userService.findAll({
        context,
        limit: 1000
      }),
      customerService.findAll({
        context,
        limit: 1000
      }),
      requestService.findAll({
        context,
        limit: 1000
      }),
      appointmentService.findAll({
        context,
        limit: 1000
      })
    ]);
    
    // Ensure we have valid data arrays from all responses
    const extractData = <T>(response: any, fallback: T[] = []): T[] => {
      if (!response || !response.data) {
        return fallback;
      }
      
      // Handle array responses directly
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Handle paginated responses
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return fallback;
    };
    
    // Extract data from responses with proper error handling
    const users = extractData(usersResponse, []);
    const customers = extractData(customersResponse, []);
    const requests = extractData(requestsResponse, []);
    const appointments = extractData(appointmentsResponse, []);
    
    // Filter by date range
    const filterByDateRange = <T>(items: T[], dateField: keyof T): T[] => {
      return items.filter(item => {
        // Use type assertion to avoid 'never' type issues
        const typedItem = item as Record<string, any>;
        const itemDate = new Date(typedItem[dateField as string] as string);
        return itemDate >= startDate && itemDate <= now;
      });
    };
    
    const recentUsers = filterByDateRange(users, 'createdAt');
    const recentCustomers = filterByDateRange(customers, 'createdAt');
    const recentRequests = filterByDateRange(requests, 'createdAt');
    const recentAppointments = filterByDateRange(appointments, 'appointmentDate');
    
    // Calculate request conversion rate
    const convertedRequests = recentRequests.filter(r => {
      // Use type assertion to avoid 'never' type issues
      const typedRequest = r as Record<string, any>;
      return typedRequest.customerId !== null && typedRequest.customerId !== undefined;
    }).length;
    const requestConversionRate = recentRequests.length > 0 
      ? convertedRequests / recentRequests.length 
      : 0;
    
    // Calculate appointment completion rate
    const completedAppointments = recentAppointments.filter(a => {
      // Use type assertion to avoid 'never' type issues
      const typedAppointment = a as Record<string, any>;
      return typedAppointment.status === AppointmentStatus.COMPLETED;
    }).length;
    const appointmentCompletionRate = recentAppointments.length > 0 
      ? completedAppointments / recentAppointments.length 
      : 0;
    
    // Calculate trends for key metrics
    const userTrend = calculateMetricTrend(
      users,
      (user) => {
        // Use type assertion to avoid 'never' type issues
        const typedUser = user as Record<string, any>;
        return typedUser.createdAt;
      },
      items => items.length,
      startDate
    );
    
    const customerTrend = calculateMetricTrend(
      customers,
      (customer) => {
        // Use type assertion to avoid 'never' type issues
        const typedCustomer = customer as Record<string, any>;
        return typedCustomer.createdAt;
      },
      items => items.length,
      startDate
    );
    
    const requestTrend = calculateMetricTrend(
      requests,
      (request) => {
        // Use type assertion to avoid 'never' type issues
        const typedRequest = request as Record<string, any>;
        return typedRequest.createdAt;
      },
      items => items.length,
      startDate
    );
    
    const appointmentTrend = calculateMetricTrend(
      appointments,
      (appointment) => {
        // Use type assertion to avoid 'never' type issues
        const typedAppointment = appointment as Record<string, any>;
        return typedAppointment.appointmentDate;
      },
      items => items.length,
      startDate
    );
    
    // Calculate conversion rate trend (lower threshold since this is an important metric)
    const conversionRateTrend = calculateMetricTrend(
      requests,
      (request) => {
        // Use type assertion to avoid 'never' type issues
        const typedRequest = request as Record<string, any>;
        return typedRequest.createdAt;
      },
      items => {
        // Use type assertion for items as well
        const typedItems = items.map(item => item as Record<string, any>);
        const converted = typedItems.filter(r => r.customerId !== null && r.customerId !== undefined).length;
        return typedItems.length > 0 ? converted / typedItems.length : 0;
      },
      startDate,
      now,
      { neutralThreshold: 0.02 } // 2% change is significant for conversion rates
    );
    
    // Calculate completion rate trend
    const completionRateTrend = calculateMetricTrend(
      appointments,
      (appointment) => {
        // Use type assertion to avoid 'never' type issues
        const typedAppointment = appointment as Record<string, any>;
        return typedAppointment.appointmentDate;
      },
      items => {
        // Use type assertion for items as well
        const typedItems = items.map(item => item as Record<string, any>);
        const completed = typedItems.filter(a => a.status === AppointmentStatus.COMPLETED).length;
        return typedItems.length > 0 ? completed / typedItems.length : 0;
      },
      startDate,
      now,
      { neutralThreshold: 0.02 } // 2% change is significant for completion rates
    );
    
    // Construct response
    const stats = {
      summary: {
        period,
        periodLabel: getPeriodLabel(period),
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      users: {
        total: users.length,
        new: recentUsers.length,
        trend: {
          percentChange: formatPercentage(userTrend.percentChange),
          direction: userTrend.direction,
          isPositive: userTrend.isPositive
        }
      },
      customers: {
        total: customers.length,
        new: recentCustomers.length,
        active: customers.filter(c => {
          // Use type assertion to avoid 'never' type issues
          const typedCustomer = c as Record<string, any>;
          return typedCustomer.status === CommonStatus.ACTIVE;
        }).length,
        inactive: customers.filter(c => {
          // Use type assertion to avoid 'never' type issues
          const typedCustomer = c as Record<string, any>;
          return typedCustomer.status === CommonStatus.INACTIVE;
        }).length,
        trend: {
          percentChange: formatPercentage(customerTrend.percentChange),
          direction: customerTrend.direction,
          isPositive: customerTrend.isPositive
        }
      },
      requests: {
        total: requests.length,
        new: recentRequests.length,
        pending: recentRequests.filter(r => {
          // Use type assertion to avoid 'never' type issues
          const typedRequest = r as Record<string, any>;
          return typedRequest.status === RequestStatus.NEW;
        }).length,
        inProgress: recentRequests.filter(r => {
          // Use type assertion to avoid 'never' type issues
          const typedRequest = r as Record<string, any>;
          return typedRequest.status === RequestStatus.IN_PROGRESS;
        }).length,
        completed: recentRequests.filter(r => {
          // Use type assertion to avoid 'never' type issues
          const typedRequest = r as Record<string, any>;
          return typedRequest.status === RequestStatus.COMPLETED;
        }).length,
        converted: convertedRequests,
        conversionRate: requestConversionRate,
        trend: {
          percentChange: formatPercentage(requestTrend.percentChange),
          direction: requestTrend.direction,
          isPositive: requestTrend.isPositive
        },
        conversionRateTrend: {
          percentChange: formatPercentage(conversionRateTrend.percentChange),
          direction: conversionRateTrend.direction,
          isPositive: conversionRateTrend.isPositive
        }
      },
      appointments: {
        total: appointments.length,
        scheduled: recentAppointments.length,
        planned: recentAppointments.filter(a => {
          // Use type assertion to avoid 'never' type issues
          const typedAppointment = a as Record<string, any>;
          return typedAppointment.status === AppointmentStatus.PLANNED;
        }).length,
        confirmed: recentAppointments.filter(a => {
          // Use type assertion to avoid 'never' type issues
          const typedAppointment = a as Record<string, any>;
          return typedAppointment.status === AppointmentStatus.CONFIRMED;
        }).length,
        completed: completedAppointments,
        cancelled: recentAppointments.filter(a => {
          // Use type assertion to avoid 'never' type issues
          const typedAppointment = a as Record<string, any>;
          return typedAppointment.status === AppointmentStatus.CANCELLED;
        }).length,
        completionRate: appointmentCompletionRate,
        trend: {
          percentChange: formatPercentage(appointmentTrend.percentChange),
          direction: appointmentTrend.direction,
          isPositive: appointmentTrend.isPositive
        },
        completionRateTrend: {
          percentChange: formatPercentage(completionRateTrend.percentChange),
          direction: completionRateTrend.direction,
          isPositive: completionRateTrend.isPositive
        }
      }
    };
    
    return formatSuccess(
      stats, 
      'Dashboard statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error generating dashboard statistics:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Failed to retrieve dashboard statistics',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});

/**
 * Get a human-readable label for the selected period
 */
function getPeriodLabel(period: string): string {
  switch (period) {
    case 'day':
      return 'Last 24 hours';
    case 'week':
      return 'Last 7 days';
    case 'month':
      return 'Last 30 days';
    case 'year':
      return 'Last 12 months';
    default:
      return 'Last 30 days';
  }
}

/**
 * Format a percentage value for display
 * Converts 0.12345 to 12.3 (percentage with one decimal place)
 */
function formatPercentage(value: number): number {
  return Math.round(value * 1000) / 10;
}