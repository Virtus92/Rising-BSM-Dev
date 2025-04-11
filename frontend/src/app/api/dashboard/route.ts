import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import {
  getCustomerService,
  getAppointmentService,
  getRequestService,
  getActivityLogService
} from '@/infrastructure/common/factories';

/**
 * GET /api/dashboard
 * 
 * Retrieves dashboard data including statistics on customers, appointments, requests, etc.
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  
  try {
    // Authentication is handled by the apiRouteHandler
    const userId = request.auth?.userId;
    
    if (!userId) {
      return formatError('Authentication required', 401);
    }
    
    // Get service instances
    const customerService = getCustomerService();
    const appointmentService = getAppointmentService();
    const requestService = getRequestService();
    const activityLogService = getActivityLogService();
    
    // Context for service calls
    const context = { userId };
    
    // Collect statistics
    const stats = {
      // Customer statistics
      customers: {
        total: await customerService.count({ context, filters: { status: 'active' } }),
        new: await customerService.count({
          context,
          filters: {
            status: 'active',
            createdAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        })
      },

      // Appointment statistics
      appointments: {
        total: await appointmentService.count({ context }),
        upcoming: await appointmentService.count({
          context,
          filters: {
            dateAfter: new Date(),
            status: ['planned', 'confirmed']
          }
        }),
        today: await appointmentService.count({
          context, 
          filters: {
            dateFrom: new Date(new Date().setHours(0, 0, 0, 0)),
            dateTo: new Date(new Date().setHours(23, 59, 59, 999))
          }
        })
      },

      // Request statistics
      requests: {
        total: await requestService.count({ context }),
        new: await requestService.count({ context, filters: { status: 'new' } }),
        inProgress: await requestService.count({ context, filters: { status: 'in_progress' } }),
        completed: await requestService.count({ context, filters: { status: 'completed' } })
      }
    };

    // Get upcoming appointments (next 7 days)
    const upcomingAppointments = await appointmentService.getUpcoming(5, { context });

    // Get recent requests
    const recentRequests = await requestService.findAll({
      context,
      filters: { status: ['new', 'in_progress'] },
      pagination: { page: 1, limit: 5 },
      sort: { field: 'createdAt', order: 'desc' }
    });

    // Get recent activity logs
    const recentCustomerActivities = await activityLogService.findAll({
      context,
      filters: { entityType: 'customer' },
      pagination: { page: 1, limit: 10 },
      sort: { field: 'createdAt', order: 'desc' }
    });

    return formatSuccess({
      stats,
      upcomingAppointments,
      recentRequests: recentRequests.data,
      recentCustomerActivities: recentCustomerActivities.data
    }, 'Dashboard data retrieved successfully');
  } catch (error) {
    logger.error('Error fetching dashboard data:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving dashboard data',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});
