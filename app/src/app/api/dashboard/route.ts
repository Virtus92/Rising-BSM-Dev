/**
 * Dashboard API Route
 * Provides dashboard data and statistics
 */
import { NextRequest } from 'next/server';
import { routeHandler } from '@/core/api/server/route-handler';
import { formatSuccess, formatError } from '@/core/errors/index';
import { getLogger } from '@/core/logging';
import { getServiceFactory } from '@/core/factories/serviceFactory.server';

/**
 * GET /api/dashboard
 * 
 * Retrieves dashboard data including:
 * - Statistics on users, customers, appointments, and requests
 * - Recent activities
 * - Upcoming appointments
 * - Recent requests
 * 
 * This endpoint aggregates data from multiple services for the dashboard UI.
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Get service instances
    const customerService = serviceFactory.createCustomerService();
    const appointmentService = serviceFactory.createAppointmentService();
    const requestService = serviceFactory.createRequestService();
    const userService = serviceFactory.createUserService();
    const activityLogService = serviceFactory.createActivityLogService();
    
    // Context for service calls
    const context = { userId: request.auth?.userId };
    
    // Run all queries in parallel for better performance
    const [
      totalCustomers,
      newCustomers,
      totalAppointments,
      upcomingAppointments,
      todayAppointments,
      totalRequests,
      newRequests,
      inProgressRequests,
      completedRequests,
      totalUsers,
      activeUsers,
      recentAppointmentsList,
      recentRequestsList,
      recentActivities
    ] = await Promise.all([
      // Customer statistics
      customerService.count({ 
        context, 
        filters: { status: 'active' } 
      }).catch((err: Error) => {
        logger.warn('Error fetching total customers count', { error: err.message });
        return 0;
      }),
      
      customerService.count({
        context,
        filters: {
          status: 'active',
          createdAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }).catch((err: Error) => {
        logger.warn('Error fetching new customers count', { error: err.message });
        return 0;
      }),
      
      // Appointment statistics
      appointmentService.count({ context }).catch((err: Error) => {
        logger.warn('Error fetching total appointments count', { error: err.message });
        return 0;
      }),
      
      appointmentService.count({
        context,
        filters: {
          dateAfter: new Date(),
          status: ['planned', 'confirmed']
        }
      }).catch((err: Error) => {
        logger.warn('Error fetching upcoming appointments count', { error: err.message });
        return 0;
      }),
      
      appointmentService.count({
        context, 
        filters: {
          dateFrom: new Date(new Date().setHours(0, 0, 0, 0)),
          dateTo: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }).catch((err: Error) => {
        logger.warn('Error fetching today appointments count', { error: err.message });
        return 0;
      }),
      
      // Request statistics
      requestService.count({ context }).catch((err: Error) => {
        logger.warn('Error fetching total requests count', { error: err.message });
        return 0;
      }),
      
      requestService.count({ 
        context, 
        filters: { status: 'new' } 
      }).catch((err: Error) => {
        logger.warn('Error fetching new requests count', { error: err.message });
        return 0;
      }),
      
      requestService.count({ 
        context, 
        filters: { status: 'in_progress' } 
      }).catch((err: Error) => {
        logger.warn('Error fetching in-progress requests count', { error: err.message });
        return 0;
      }),
      
      requestService.count({ 
        context, 
        filters: { status: 'completed' } 
      }).catch((err: Error) => {
        logger.warn('Error fetching completed requests count', { error: err.message });
        return 0;
      }),
      
      // User statistics
      userService.count({ context }).catch((err: Error) => {
        logger.warn('Error fetching total users count', { error: err.message });
        return 0;
      }),
      
      userService.count({ 
        context, 
        filters: { status: 'active' } 
      }).catch((err: Error) => {
        logger.warn('Error fetching active users count', { error: err.message });
        return 0;
      }),
      
      // Upcoming appointments list (next 7 days, limited to 5)
      appointmentService.getUpcoming(5, { context }).catch((err: Error) => {
        logger.warn('Error fetching upcoming appointments list', { error: err.message });
        return [];
      }),
      
      // Recent requests (newest 5)
      requestService.findAll({
        context,
        filters: { status: ['new', 'in_progress'] },
        page: 1,
        limit: 5,
        sort: { field: 'createdAt', direction: 'desc' }
      }).catch((err: Error) => {
        logger.warn('Error fetching recent requests', { error: err.message });
        return { data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } };
      }),
      
      // Recent activity logs
      activityLogService.findAll({
        context,
        page: 1,
        limit: 10,
        sort: { field: 'createdAt', direction: 'desc' }
      }).catch((err: Error) => {
        logger.warn('Error fetching recent activities', { error: err.message });
        return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      })
    ]);

    // Organize all data for the response
    const dashboardData = {
      stats: {
        // Customer statistics
        customers: {
          total: totalCustomers,
          new: newCustomers
        },

        // Appointment statistics
        appointments: {
          total: totalAppointments,
          upcoming: upcomingAppointments,
          today: todayAppointments
        },

        // Request statistics
        requests: {
          total: totalRequests,
          new: newRequests,
          inProgress: inProgressRequests,
          completed: completedRequests
        },
        
        // User statistics
        users: {
          total: totalUsers,
          active: activeUsers
        }
      },

      // Lists for dashboard widgets
      upcomingAppointments: recentAppointmentsList,
      recentRequests: recentRequestsList.data || [],
      recentActivities: recentActivities.data || []
    };

    // Return formatted success response
    return formatSuccess(dashboardData, 'Dashboard data retrieved successfully');
  } catch (error) {
    // Log error details
    logger.error('Error fetching dashboard data:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return formatted error response
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving dashboard data',
      500
    );
  }
}, {
  // Secure this endpoint - only authenticated users can access it
  requiresAuth: true
});