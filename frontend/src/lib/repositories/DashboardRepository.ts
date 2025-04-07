import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '../../types/interfaces/ILoggingService.js';
import { IErrorHandler } from '../../types/interfaces/IErrorHandler.js';
import { IDashboardRepository } from '../../types/interfaces/IDashboardRepository.js';
import { BaseRepository } from '../core/BaseRepository.js';

/**
 * Repository for dashboard functionality
 * 
 * Implements IDashboardRepository and provides methods for retrieving dashboard data
 */
export class DashboardRepository implements IDashboardRepository {
  private prisma: PrismaClient;

  /**
   * Creates a new DashboardRepository instance
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    model: PrismaClient,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.prisma = model;
    this.logger.debug('Initialized DashboardRepository');
  }

  /**
   * Get dashboard overview statistics
   * 
   * @returns Promise with statistics
   */
  async getStatistics(): Promise<any> {
    try {
      // Get new requests count and trend
      const newRequests = await this.getRequestsStats();

      // Get active projects count and trend
      const activeProjects = await this.getProjectsStats();

      // Get total customers count and trend
      const totalCustomers = await this.getCustomersStats();

      // Get monthly revenue and trend
      const monthlyRevenue = await this.getRevenueStats();

      return {
        newRequests,
        activeProjects,
        totalCustomers,
        monthlyRevenue
      };
    } catch (error) {
      this.logger.error('Error in getStatistics', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get revenue chart data
   * 
   * @param filter - Time filter
   * @returns Promise with chart data
   */
  async getRevenueChartData(filter: string): Promise<{ labels: string[]; data: number[] }> {
    let startDate: Date;
    let intervalType: 'day' | 'week' | 'month';
    const now = new Date();
    const labels: string[] = [];
    let data: number[] = [];

    // Determine date range and interval based on filter
    switch (filter) {
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        intervalType = 'day';
        break;
      case 'last3months':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        intervalType = 'week';
        break;
      case 'last6months':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        intervalType = 'month';
        break;
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1);
        intervalType = 'month';
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        intervalType = 'month';
    }

    try {
      // Query invoices within date range
      const invoices = await this.prisma.invoice.findMany({
        where: {
          invoiceDate: {
            gte: startDate
          }
        },
        select: {
          invoiceDate: true,
          totalAmount: true
        },
        orderBy: {
          invoiceDate: 'asc'
        }
      });

      // Process data based on interval type
      if (intervalType === 'day') {
        // Group by day
        const dailyRevenue = new Map<string, number>();
        
        // Generate all days in range
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          dailyRevenue.set(dateStr, 0);
          labels.push(new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }));
        }

        // Aggregate invoice amounts by day
        invoices.forEach(invoice => {
          const dateStr = invoice.invoiceDate.toISOString().split('T')[0];
          if (dailyRevenue.has(dateStr)) {
            dailyRevenue.set(dateStr, dailyRevenue.get(dateStr)! + Number(invoice.totalAmount));
          }
        });

        // Convert map to array in order of labels
        data = Array.from(dailyRevenue.values());
      } else if (intervalType === 'week') {
        // Group by week
        const weeklyRevenue = new Map<string, number>();
        const weeks: string[] = [];
        
        // Generate all weeks in range
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 7)) {
          const weekStart = new Date(d);
          const weekEnd = new Date(d);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          const weekKey = weekStart.toISOString().split('T')[0];
          const weekLabel = `${weekStart.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })}`;
          
          weeklyRevenue.set(weekKey, 0);
          weeks.push(weekKey);
          labels.push(weekLabel);
        }

        // Aggregate invoice amounts by week
        invoices.forEach(invoice => {
          // Find which week this invoice belongs to
          const invoiceDate = invoice.invoiceDate;
          
          // Find the closest week start that's before or equal to this invoice
          let matchingWeek: string | undefined;
          
          for (let i = weeks.length - 1; i >= 0; i--) {
            const weekStart = new Date(weeks[i]);
            if (invoiceDate >= weekStart) {
              matchingWeek = weeks[i];
              break;
            }
          }
          
          if (matchingWeek && weeklyRevenue.has(matchingWeek)) {
            weeklyRevenue.set(matchingWeek, weeklyRevenue.get(matchingWeek)! + Number(invoice.totalAmount));
          }
        });

        // Convert map to array in order of weeks
        data = weeks.map(week => weeklyRevenue.get(week) || 0);
      } else {
        // Group by month
        const monthlyRevenue = new Map<string, number>();
        
        // Generate all months in range
        for (let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1); 
             d <= new Date(now.getFullYear(), now.getMonth(), 1); 
             d.setMonth(d.getMonth() + 1)) {
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthlyRevenue.set(monthKey, 0);
          labels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        }

        // Aggregate invoice amounts by month
        invoices.forEach(invoice => {
          const date = invoice.invoiceDate;
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (monthlyRevenue.has(monthKey)) {
            monthlyRevenue.set(monthKey, monthlyRevenue.get(monthKey)! + Number(invoice.totalAmount));
          }
        });

        // Convert map to array in order of months
        data = Array.from(monthlyRevenue.values());
      }

      return { labels, data };
    } catch (error) {
      this.logger.error('Error in getRevenueChartData', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get services chart data
   * 
   * @param filter - Time filter
   * @returns Promise with chart data
   */
  async getServicesChartData(filter: string): Promise<{ labels: string[]; data: number[] }> {
    let startDate: Date;
    const now = new Date();

    // Determine date range based on filter
    switch (filter) {
      case 'thisweek':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
        break;
      case 'thismonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisquarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    try {
      // Get service usage from invoice items
      const serviceUsage = await this.prisma.invoiceItem.findMany({
        where: {
          invoice: {
            invoiceDate: {
              gte: startDate
            }
          }
        },
        select: {
          serviceId: true,
          quantity: true,
          service: {
            select: {
              name: true
            }
          }
        }
      });

      // Aggregate service usage
      const serviceMap = new Map<number, { name: string; count: number }>();

      serviceUsage.forEach(item => {
        if (!serviceMap.has(item.serviceId)) {
          serviceMap.set(item.serviceId, { 
            name: item.service.name, 
            count: 0 
          });
        }
        
        const serviceData = serviceMap.get(item.serviceId)!;
        serviceData.count += item.quantity;
        serviceMap.set(item.serviceId, serviceData);
      });

      // Sort services by usage count (descending) and take top 5
      const topServices = Array.from(serviceMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      // Extract labels and data
      const labels = topServices.map(([_, service]) => service.name);
      const data = topServices.map(([_, service]) => service.count);

      return { labels, data };
    } catch (error) {
      this.logger.error('Error in getServicesChartData', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get recent notifications
   * 
   * @param limit - Maximum number of notifications to return
   * @returns Promise with notifications
   */
  async getRecentNotifications(limit: number = 5): Promise<any[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          read: true,
          createdAt: true
        }
      });

      return notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message || undefined,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt.toISOString()
      }));
    } catch (error) {
      this.logger.error('Error in getRecentNotifications', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get recent requests
   * 
   * @param limit - Maximum number of requests to return
   * @returns Promise with requests
   */
  async getRecentRequests(limit: number = 5): Promise<any[]> {
    try {
      const requests = await this.prisma.contactRequest.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        select: {
          id: true,
          name: true,
          createdAt: true,
          status: true
        }
      });

      return requests.map(request => {
        // Get status class for UI styling
        let statusClass;
        switch (request.status) {
          case 'new':
            statusClass = 'bg-blue-100 text-blue-800';
            break;
          case 'in_progress':
            statusClass = 'bg-yellow-100 text-yellow-800';
            break;
          case 'completed':
            statusClass = 'bg-green-100 text-green-800';
            break;
          case 'cancelled':
            statusClass = 'bg-red-100 text-red-800';
            break;
          default:
            statusClass = 'bg-gray-100 text-gray-800';
        }

        return {
          id: request.id,
          name: request.name,
          dateLabel: request.createdAt.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          status: request.status,
          statusClass
        };
      });
    } catch (error) {
      this.logger.error('Error in getRecentRequests', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get upcoming appointments
   * 
   * @param limit - Maximum number of appointments to return
   * @returns Promise with appointments
   */
  async getUpcomingAppointments(limit: number = 5): Promise<any[]> {
    try {
      const now = new Date();
      const appointments = await this.prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: now
          },
          status: {
            in: ['planned', 'confirmed']
          }
        },
        orderBy: {
          appointmentDate: 'asc'
        },
        take: limit,
        select: {
          id: true,
          title: true,
          appointmentDate: true,
          customer: {
            select: {
              name: true
            }
          }
        }
      });

      return appointments.map(appointment => ({
        id: appointment.id,
        title: appointment.title,
        dateLabel: appointment.appointmentDate.toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        customer: appointment.customer?.name,
        time: appointment.appointmentDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
    } catch (error) {
      this.logger.error('Error in getUpcomingAppointments', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get system status
   * 
   * @returns Promise with system status
   */
  async getSystemStatus(): Promise<any> {
    try {
      // Check database connection
      let databaseStatus = 'healthy';
      let lastUpdate = new Date();

      try {
        // Attempt to query the database
        await this.prisma.$queryRaw`SELECT 1`;
      } catch {
        databaseStatus = 'error';
      }

      // Get last updated system setting if available
      try {
        const lastUpdateSetting = await this.prisma.systemSettings.findFirst({
          where: {
            key: 'last_system_update'
          }
        });

        if (lastUpdateSetting) {
          lastUpdate = new Date(lastUpdateSetting.value);
        }
      } catch {
        // Ignore errors and use current date
      }

      return {
        database: databaseStatus,
        lastUpdate: lastUpdate.toISOString(),
        processing: 'active',
        statistics: 'updated'
      };
    } catch (error) {
      this.logger.error('Error in getSystemStatus', error instanceof Error ? error : String(error));
      
      // Return degraded status in case of error
      return {
        database: 'degraded',
        lastUpdate: new Date().toISOString(),
        processing: 'active',
        statistics: 'outdated'
      };
    }
  }

  /**
   * Perform global search across all entities
   * 
   * @param query - Search query
   * @returns Promise with search results
   */
  async globalSearch(query: string): Promise<any> {
    try {
      // Sanitize search query for database
      const searchTerm = `%${query.trim().replace(/[%_]/g, '\\$&')}%`;

      // Search customers
      const customers = await this.searchCustomers(searchTerm);

      // Search projects
      const projects = await this.searchProjects(searchTerm);

      // Search appointments
      const appointments = await this.searchAppointments(searchTerm);

      // Search requests
      const requests = await this.searchRequests(searchTerm);

      // Search services
      const services = await this.searchServices(searchTerm);

      return {
        customers,
        projects,
        appointments,
        requests,
        services
      };
    } catch (error) {
      this.logger.error('Error in globalSearch', error instanceof Error ? error : String(error), { query });
      throw this.handleError(error);
    }
  }

  /**
   * Get requests statistics
   * 
   * @returns Promise with requests stats
   */
  private async getRequestsStats(): Promise<{ count: number; trend: number }> {
    try {
      // Get current month's new requests
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const currentCount = await this.prisma.contactRequest.count({
        where: {
          status: 'new',
          createdAt: {
            gte: startOfMonth
          }
        }
      });

      // Get previous month's requests for trend calculation
      const previousMonth = new Date(currentMonth);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const startOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
      const endOfPreviousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
      
      const previousCount = await this.prisma.contactRequest.count({
        where: {
          status: 'new',
          createdAt: {
            gte: startOfPreviousMonth,
            lte: endOfPreviousMonth
          }
        }
      });

      // Calculate trend percentage
      let trend = 0;
      if (previousCount > 0) {
        trend = Math.round(((currentCount - previousCount) / previousCount) * 100);
      } else if (currentCount > 0) {
        trend = 100; // If previous month was 0 and current is > 0, 100% increase
      }

      return { count: currentCount, trend };
    } catch (error) {
      this.logger.error('Error in getRequestsStats', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get projects statistics
   * 
   * @returns Promise with projects stats
   */
  private async getProjectsStats(): Promise<{ count: number; trend: number }> {
    try {
      // Count active projects (in_progress)
      const activeCount = await this.prisma.project.count({
        where: {
          status: 'in_progress'
        }
      });

      // Count projects that became active in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Projects that became active in the last 30 days
      const recentActiveCount = await this.prisma.project.count({
        where: {
          status: 'in_progress',
          updatedAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      // Projects that became active in the 30 days before that
      const previousPeriodCount = await this.prisma.project.count({
        where: {
          status: 'in_progress',
          updatedAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      });

      // Calculate trend percentage
      let trend = 0;
      if (previousPeriodCount > 0) {
        trend = Math.round(((recentActiveCount - previousPeriodCount) / previousPeriodCount) * 100);
      } else if (recentActiveCount > 0) {
        trend = 100; // If previous period was 0 and current is > 0, 100% increase
      }

      return { count: activeCount, trend };
    } catch (error) {
      this.logger.error('Error in getProjectsStats', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get customers statistics
   * 
   * @returns Promise with customers stats
   */
  private async getCustomersStats(): Promise<{ count: number; trend: number }> {
    try {
      // Count total active customers
      const totalCount = await this.prisma.customer.count({
        where: {
          status: 'active'
        }
      });

      // Count customers created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Customers created in the last 30 days
      const recentCount = await this.prisma.customer.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      // Customers created in the 30 days before that
      const previousPeriodCount = await this.prisma.customer.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      });

      // Calculate trend percentage
      let trend = 0;
      if (previousPeriodCount > 0) {
        trend = Math.round(((recentCount - previousPeriodCount) / previousPeriodCount) * 100);
      } else if (recentCount > 0) {
        trend = 100; // If previous period was 0 and current is > 0, 100% increase
      }

      return { count: totalCount, trend };
    } catch (error) {
      this.logger.error('Error in getCustomersStats', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get revenue statistics
   * 
   * @returns Promise with revenue stats
   */
  private async getRevenueStats(): Promise<{ amount: number; trend: number }> {
    try {
      // Calculate current month's revenue
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const currentMonthInvoices = await this.prisma.invoice.findMany({
        where: {
          invoiceDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        select: {
          totalAmount: true
        }
      });

      const currentAmount = currentMonthInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.totalAmount), 
        0
      );

      // Calculate previous month's revenue
      const previousMonth = new Date(currentMonth);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const startOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
      const endOfPreviousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
      
      const previousMonthInvoices = await this.prisma.invoice.findMany({
        where: {
          invoiceDate: {
            gte: startOfPreviousMonth,
            lte: endOfPreviousMonth
          }
        },
        select: {
          totalAmount: true
        }
      });

      const previousAmount = previousMonthInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.totalAmount), 
        0
      );

      // Calculate trend percentage
      let trend = 0;
      if (previousAmount > 0) {
        trend = Math.round(((currentAmount - previousAmount) / previousAmount) * 100);
      } else if (currentAmount > 0) {
        trend = 100; // If previous month was 0 and current is > 0, 100% increase
      }

      return { amount: currentAmount, trend };
    } catch (error) {
      this.logger.error('Error in getRevenueStats', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Search customers
   * 
   * @param searchTerm - Search term
   * @returns Promise with matching customers
   */
  private async searchCustomers(searchTerm: string): Promise<any[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { company: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          type: true
        }
      });

      return customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || undefined,
        type: customer.type
      }));
    } catch (error) {
      this.logger.error('Error in searchCustomers', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Search projects
   * 
   * @param searchTerm - Search term
   * @returns Promise with matching projects
   */
  private async searchProjects(searchTerm: string): Promise<any[]> {
    try {
      const projects = await this.prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          title: true,
          customer: {
            select: {
              name: true
            }
          },
          status: true
        }
      });

      return projects.map(project => ({
        id: project.id,
        title: project.title,
        customer: project.customer?.name,
        status: project.status
      }));
    } catch (error) {
      this.logger.error('Error in searchProjects', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Search appointments
   * 
   * @param searchTerm - Search term
   * @returns Promise with matching appointments
   */
  private async searchAppointments(searchTerm: string): Promise<any[]> {
    try {
      const appointments = await this.prisma.appointment.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { location: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          title: true,
          appointmentDate: true,
          status: true
        }
      });

      return appointments.map(appointment => ({
        id: appointment.id,
        title: appointment.title,
        date: appointment.appointmentDate.toLocaleDateString('en-US'),
        status: appointment.status
      }));
    } catch (error) {
      this.logger.error('Error in searchAppointments', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Search requests
   * 
   * @param searchTerm - Search term
   * @returns Promise with matching requests
   */
  private async searchRequests(searchTerm: string): Promise<any[]> {
    try {
      const requests = await this.prisma.contactRequest.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { message: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          name: true,
          service: true,
          status: true
        }
      });

      return requests.map(request => ({
        id: request.id,
        name: request.name,
        service: request.service,
        status: request.status
      }));
    } catch (error) {
      this.logger.error('Error in searchRequests', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Search services
   * 
   * @param searchTerm - Search term
   * @returns Promise with matching services
   */
  private async searchServices(searchTerm: string): Promise<any[]> {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          name: true,
          basePrice: true
        }
      });

      return services.map(service => ({
        id: service.id,
        name: service.name,
        price: Number(service.basePrice)
      }));
    } catch (error) {
      this.logger.error('Error in searchServices', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Handle errors in repository methods
   * 
   * @param error - Original error
   * @returns Transformed error
   */
  private handleError(error: unknown): Error {
    // If it's already an AppError, return it directly
    if (error instanceof Error && 'statusCode' in error) {
      return error;
    }

    // For other errors, create an internal server error
    if (error instanceof Error) {
      return this.errorHandler.createError(
        error.message,
        500,
        'internal_error',
        { originalError: error }
      );
    }

    // For unknown errors, convert to string
    return this.errorHandler.createError(
      String(error),
      500,
      'internal_error'
    );
  }
}

export default DashboardRepository;