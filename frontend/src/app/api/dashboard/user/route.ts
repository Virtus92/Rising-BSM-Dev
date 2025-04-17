/**
 * User Dashboard API Route
 * Provides personalized dashboard data for the current user
 */
import { NextRequest } from 'next/server';
import { apiRouteHandler } from '@/infrastructure/api/route-handler';
import { formatSuccess, formatError } from '@/infrastructure/api/response-formatter';
import { getLogger } from '@/infrastructure/common/logging';
import { getServiceFactory } from '@/infrastructure/common/factories';

/**
 * GET /api/dashboard/user
 * 
 * Retrieves personalized dashboard data for the current user including:
 * - User's appointments
 * - User's assigned requests
 * - User's recent activities
 * - User's performance metrics
 */
export const GET = apiRouteHandler(async (request: NextRequest) => {
  const logger = getLogger();
  const serviceFactory = getServiceFactory();
  
  try {
    // Extract user ID from auth context
    const userId = request.auth?.userId;
    
    if (!userId) {
      return formatError('User not authenticated', 401);
    }
    
    // Get service instances
    const userService = serviceFactory.createUserService();
    const appointmentService = serviceFactory.createAppointmentService();
    const requestService = serviceFactory.createRequestService();
    const activityLogService = serviceFactory.createActivityLogService();
    
    // Context for service calls
    const context = { userId };
    
    // Get user details
    const user = await userService.getRepository().findById(userId);
    
    if (!user) {
      return formatError('User not found', 404);
    }
    
    // Run all queries in parallel for better performance
    const [
      userAppointments,
      userRequests,
      userActivities,
      assignedRequestsCount,
      completedRequestsCount,
      upcomingAppointmentsCount
    ] = await Promise.all([
      // User's upcoming appointments
      appointmentService.findAll({
        context,
        filters: {
          userId,
          dateAfter: new Date(),
          status: ['planned', 'confirmed']
        },
        page: 1,
        limit: 5,
        sort: { field: 'appointmentDate', direction: 'asc' }
      }).catch(err => {
        logger.warn('Error fetching user appointments', { userId, error: err.message });
        return { data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } };
      }),
      
      // User's assigned requests
      requestService.findAll({
        context,
        filters: {
          processorId: userId,
          status: ['new', 'in_progress']
        },
        page: 1,
        limit: 5,
        sort: { field: 'createdAt', direction: 'desc' }
      }).catch(err => {
        logger.warn('Error fetching user requests', { userId, error: err.message });
        return { data: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } };
      }),
      
      // User's recent activities
      activityLogService.findAll({
        context,
        filters: { userId },
        page: 1,
        limit: 10,
        sort: { field: 'createdAt', direction: 'desc' }
      }).catch(err => {
        logger.warn('Error fetching user activities', { userId, error: err.message });
        return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      }),
      
      // Count of assigned requests
      requestService.count({
        context,
        filters: { processorId: userId }
      }).catch(err => {
        logger.warn('Error fetching assigned requests count', { userId, error: err.message });
        return 0;
      }),
      
      // Count of completed requests
      requestService.count({
        context,
        filters: { 
          processorId: userId,
          status: 'completed'
        }
      }).catch(err => {
        logger.warn('Error fetching completed requests count', { userId, error: err.message });
        return 0;
      }),
      
      // Count of upcoming appointments
      appointmentService.count({
        context,
        filters: {
          userId,
          dateAfter: new Date()
        }
      }).catch(err => {
        logger.warn('Error fetching upcoming appointments count', { userId, error: err.message });
        return 0;
      })
    ]);

    // Calculate completion rate (avoid division by zero)
    const completionRate = assignedRequestsCount > 0 
      ? (completedRequestsCount / assignedRequestsCount) * 100 
      : 0;

    // Organize user dashboard data
    const userDashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        profilePicture: user.profilePicture,
        lastLoginAt: user.lastLoginAt,
      },
      
      stats: {
        assignedRequests: assignedRequestsCount,
        completedRequests: completedRequestsCount,
        completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal place
        upcomingAppointments: upcomingAppointmentsCount
      },
      
      appointments: userAppointments.data || [],
      requests: userRequests.data || [],
      activities: userActivities.data || []
    };

    // Return success response
    return formatSuccess(userDashboardData, 'User dashboard data retrieved successfully');
  } catch (error) {
    // Log error details
    logger.error('Error fetching user dashboard data:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: request.auth?.userId
    });
    
    // Return error response
    return formatError(
      error instanceof Error ? error.message : 'Server error while retrieving user dashboard data',
      500
    );
  }
}, {
  // Secure this endpoint
  requiresAuth: true
});