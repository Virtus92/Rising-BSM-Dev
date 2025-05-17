import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';

import { getServiceFactory } from '@/core/factories/serviceFactory.server';
import { calculateMetricTrend } from '@/shared/utils/trend-utils';
import { AppointmentResponseDto } from '@/domain/dtos/AppointmentDtos';
import { CustomerResponseDto } from '@/domain/dtos/CustomerDtos';
import { RequestResponseDto } from '@/domain/dtos/RequestDtos';
import { UserResponseDto } from '@/domain/dtos/UserDtos';
import { AppointmentStatus, CommonStatus, RequestStatus } from '@/domain/enums/CommonEnums';
import { UserRole } from '@/domain/enums/UserEnums';
import { filterDataByUserRole } from '@/app/api/helpers/permissionUtils';

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
    
    const context = {
      userId: request.auth?.userId
    };
    
    // Get URL parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month';
    
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
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Get data from services
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
    
    // Extract data from responses
    const extractData = <T>(response: any): T[] => {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return [];
    };
    
    let users = extractData<UserResponseDto>(usersResponse);
    let customers = extractData<CustomerResponseDto>(customersResponse);
    let requests = extractData<RequestResponseDto>(requestsResponse);
    let appointments = extractData<AppointmentResponseDto>(appointmentsResponse);
    
    // Apply role-based filtering based on current user
    if (request.auth?.userId) {
      // Get current user to determine role
      const currentUser = await userService.getById(request.auth.userId);
      
      // Skip filtering for admins - they can see all data
      if (currentUser && currentUser.role !== UserRole.ADMIN) {
        // Users can only see their own created data
        users = await filterDataByUserRole(
          request.auth.userId,
          users,
          user => user.createdBy
        );
        
        customers = await filterDataByUserRole(
          request.auth.userId,
          customers,
          customer => customer.createdBy
        );
        
        requests = await filterDataByUserRole(
          request.auth.userId,
          requests,
          request => request.createdBy || request.assignedToId
        );
        
        appointments = await filterDataByUserRole(
          request.auth.userId,
          appointments,
          appointment => appointment.createdBy
        );
      }
    }
    
    // Filter by date range
    const filterByDateRange = <T extends { createdAt?: string, appointmentDate?: string }>(
      items: T[], 
      dateField: 'createdAt' | 'appointmentDate'
    ): T[] => {
      return items.filter(item => {
        const date = new Date(item[dateField] as string);
        return date >= startDate && date <= now;
      });
    };
    
    const recentUsers = filterByDateRange(users, 'createdAt');
    const recentCustomers = filterByDateRange(customers, 'createdAt');
    const recentRequests = filterByDateRange(requests, 'createdAt');
    const recentAppointments = filterByDateRange(appointments, 'appointmentDate');
    
    // Calculate request conversion rate
    const convertedRequests = recentRequests.filter(r => r.customerId !== null && r.customerId !== undefined).length;
    const requestConversionRate = recentRequests.length > 0 
      ? convertedRequests / recentRequests.length 
      : 0;
    
    // Calculate appointment completion rate
    const completedAppointments = recentAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    const appointmentCompletionRate = recentAppointments.length > 0 
      ? completedAppointments / recentAppointments.length 
      : 0;
    
    // Calculate trends for key metrics
    const userTrend = calculateMetricTrend(
      users,
      user => user.createdAt!,
      items => items.length,
      startDate
    );
    
    const customerTrend = calculateMetricTrend(
      customers,
      customer => customer.createdAt!,
      items => items.length,
      startDate
    );
    
    const requestTrend = calculateMetricTrend(
      requests,
      request => request.createdAt!,
      items => items.length,
      startDate
    );
    
    const appointmentTrend = calculateMetricTrend(
      appointments,
      appointment => appointment.appointmentDate!,
      items => items.length,
      startDate
    );
    
    // Calculate conversion rate trend
    const conversionRateTrend = calculateMetricTrend(
      requests,
      request => request.createdAt!,
      items => {
        const converted = items.filter(r => r.customerId !== null && r.customerId !== undefined).length;
        return items.length > 0 ? converted / items.length : 0;
      },
      startDate,
      now,
      { neutralThreshold: 0.02 }
    );
    
    // Calculate completion rate trend
    const completionRateTrend = calculateMetricTrend(
      appointments,
      appointment => appointment.appointmentDate!,
      items => {
        const completed = items.filter(a => a.status === AppointmentStatus.COMPLETED).length;
        return items.length > 0 ? completed / items.length : 0;
      },
      startDate,
      now,
      { neutralThreshold: 0.02 }
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
        active: customers.filter(c => c.status === CommonStatus.ACTIVE).length,
        inactive: customers.filter(c => c.status === CommonStatus.INACTIVE).length,
        trend: {
          percentChange: formatPercentage(customerTrend.percentChange),
          direction: customerTrend.direction,
          isPositive: customerTrend.isPositive
        }
      },
      requests: {
        total: requests.length,
        new: recentRequests.length,
        pending: recentRequests.filter(r => r.status === RequestStatus.NEW).length,
        inProgress: recentRequests.filter(r => r.status === RequestStatus.IN_PROGRESS).length,
        completed: recentRequests.filter(r => r.status === RequestStatus.COMPLETED).length,
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
        planned: recentAppointments.filter(a => a.status === AppointmentStatus.PLANNED).length,
        confirmed: recentAppointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length,
        completed: completedAppointments,
        cancelled: recentAppointments.filter(a => a.status === AppointmentStatus.CANCELLED).length,
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
  requiresAuth: true
});

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

function formatPercentage(value: number): number {
  return Math.round(value * 1000) / 10;
}