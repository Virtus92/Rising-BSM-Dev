import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/common/types.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { NotificationService, notificationService } from '../services/notification.service.js';
import { CustomerService, customerService } from '../services/customer.service.js';
import { ProjectService, projectService } from '../services/project.service.js';
import { AppointmentService, appointmentService } from '../services/appointment.service.js';
import { RequestService, requestService } from '../services/request.service.js';
import { ServiceService, serviceService } from '../services/service.service.js';
import { DashboardFilterDTO, GlobalSearchDTO } from '../types/dtos/dashboard.dto.js';
import { MarkNotificationReadDTO } from '../types/dtos/notification.dto.js';
import { cache } from '../services/cache.service.js';

/**
 * Get dashboard data including statistics, charts, and recent activities
 */
export const getDashboardData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user?.id;
  
  // Create cache key that includes user ID for personalization
  const cacheKey = `dashboard_data_${userId || 'guest'}_${new Date().toISOString().slice(0, 10)}`;
  
  // Get dashboard data with improved caching
  const dashboardData = await cache.getOrExecute(cacheKey, async () => {
    // Extract filter parameters
    const filters: DashboardFilterDTO = {
      revenueFilter: req.query.revenueFilter as string || 'Letzten 6 Monate',
      servicesFilter: req.query.servicesFilter as string || 'Diesen Monat'
    };
    
    // Get all dashboard data in parallel for performance
    const [
      stats, 
      notifications, 
      recentRequests, 
      upcomingAppointments, 
      charts
    ] = await Promise.all([
      getDashboardStats(req, res),
      userId ? notificationService.getNotifications(userId) : { items: [], unreadCount: 0, totalCount: 0 },
      requestService.getRecentRequests(),
      appointmentService.getUpcomingAppointments(),
      getChartData(filters)
    ]);
    
    // Return aggregated data
    return {
      stats,
      chartFilters: {
        revenue: {
          selected: filters.revenueFilter,
          options: ['Letzten 30 Tage', 'Letzten 3 Monate', 'Letzten 6 Monate', 'Dieses Jahr']
        },
        services: {
          selected: filters.servicesFilter,
          options: ['Diese Woche', 'Diesen Monat', 'Dieses Quartal', 'Dieses Jahr']
        }
      },
      charts,
      notifications: notifications.items,
      recentRequests,
      upcomingAppointments,
      systemStatus: {
        database: 'online',
        lastUpdate: new Date().toISOString(),
        processing: 'active',
        statistics: 'active'
      }
    };
  }, 300); // Cache for 5 minutes
  
  // Use ResponseFactory for response
  ResponseFactory.success(res, dashboardData, 'Dashboard data retrieved successfully');
});

/**
 * Get dashboard statistics (used by both API and main dashboard)
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const stats = await cache.getOrExecute('dashboard_stats', async () => {
    // Get statistics from various services
    const [newRequestsStats, activeProjectsStats, totalCustomersStats, revenueStats] = await Promise.all([
      requestService.getRequestStats(),
      projectService.getProjectStats(),
      customerService.getStatistics(),
      serviceService.getRevenueStats()
    ]);
    
    return {
      newRequests: newRequestsStats,
      activeProjects: activeProjectsStats,
      totalCustomers: totalCustomersStats,
      monthlyRevenue: revenueStats
    };
  }, 300); // Cache for 5 minutes

  if (req.originalUrl.endsWith('/stats')) {
    // If direct API call, return response
    ResponseFactory.success(res, stats);
  }
  
  return stats;
});

/**
 * Get chart data for dashboard
 */
async function getChartData(filters: DashboardFilterDTO): Promise<any> {
  // Get revenue chart data
  const revenueData = await serviceService.getRevenueChartData(filters.revenueFilter);
  
  // Get services chart data
  const servicesData = await serviceService.getServiceUsageData(filters.servicesFilter);
  
  return {
    revenue: revenueData,
    services: servicesData
  };
}

/**
 * Global search across all entities
 */
export const globalSearch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const searchData: GlobalSearchDTO = { q: req.query.q as string };
  
  if (!searchData.q || searchData.q.trim().length < 2) {
    ResponseFactory.success(res, {
      customers: [],
      projects: [],
      appointments: [],
      requests: [],
      services: []
    });
    return;
  }
  
  // Execute searches in parallel using services
  const [customers, projects, appointments, requests, services] = await Promise.all([
    customerService.search(searchData.q),
    projectService.search(searchData.q),
    appointmentService.search(searchData.q),
    requestService.search(searchData.q),
    serviceService.search(searchData.q)
  ]);
  
  // Send success response
  ResponseFactory.success(res, {
    customers,
    projects,
    appointments,
    requests,
    services
  });
});

/**
 * Get all notifications for a user
 */
export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('Unauthorized');
  }
  
  // Get notifications through service
  const result = await notificationService.getNotifications(req.user.id);
  
  // Send success response
  ResponseFactory.success(res, { notifications: result.items });
});

/**
 * Mark notifications as read
 */
export const markNotificationsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('Unauthorized');
  }
  
  // Extract mark read data
  const markReadData: MarkNotificationReadDTO = req.body;
  
  // Mark notifications as read through service
  const result = await notificationService.markNotificationsRead(req.user.id, markReadData);
  
  // Send success response
  ResponseFactory.success(
    res, 
    { count: result.count }, 
    markReadData.markAll ? 'All notifications marked as read' : 'Notification marked as read'
  );
});