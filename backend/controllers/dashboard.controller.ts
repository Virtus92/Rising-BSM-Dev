// controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/prisma.utils';
import { format } from 'date-fns';
import cache from '../services/cache.service';
import { getNotifications } from '../utils/helpers';
import { formatDateSafely, formatRelativeTime, formatDateWithLabel } from '../utils/formatters';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';

interface ChartFilterOptions {
  selected: string;
  options: string[];
}

interface SystemStatus {
  database: string;
  lastUpdate: string;
  processing: string;
  statistics: string;
}

interface ChartData {
  revenue: {
    labels: string[];
    data: number[];
  };
  services: {
    labels: string[];
    data: number[];
  };
}

interface DashboardData {
  stats: any;
  chartFilters: {
    revenue: ChartFilterOptions;
    services: ChartFilterOptions;
  };
  charts: ChartData;
  notifications: any[];
  recentRequests: any[];
  upcomingAppointments: any[];
  systemStatus: SystemStatus;
}

interface DateRangeResult {
  startDate: Date;
  groupBy: string;
  dateFormat: string;
}

/**
 * Get dashboard data including statistics, charts, and recent activities
 */
export const getDashboardData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Get notifications
  const notifications = await getNotifications(req);
  
  // Calculate date range filters
  const revenueFilter = req.query.revenueFilter as string || 'Letzten 6 Monate';
  const servicesFilter = req.query.servicesFilter as string || 'Diesen Monat';

  // Chart filter options
  const chartFilters = {
    revenue: {
      selected: revenueFilter,
      options: ['Letzten 30 Tage', 'Letzten 3 Monate', 'Letzten 6 Monate', 'Dieses Jahr']
    },
    services: {
      selected: servicesFilter,
      options: ['Diese Woche', 'Diesen Monat', 'Dieses Quartal', 'Dieses Jahr']
    }
  };

  // Get dashboard data
  const stats = await getDashboardStats();
  const recentRequests = await getRecentRequests();
  const upcomingAppointments = await getUpcomingAppointments();
  const charts = await getChartData(revenueFilter, servicesFilter);
  
  // System status information
  const systemStatus: SystemStatus = {
    database: 'online',
    lastUpdate: format(new Date(), 'dd.MM.yyyy, HH:mm:ss'),
    processing: 'active',
    statistics: 'active'
  };
  
  // Create data object
  const data: DashboardData = {
    stats,
    chartFilters,
    charts,
    notifications,
    recentRequests,
    upcomingAppointments,
    systemStatus
  };
  
  res.status(200).json(data);
});

/**
 * Get dashboard statistics (used by both API and main dashboard)
 */
export const getDashboardStats = asyncHandler(async (): Promise<any> => {
  return await cache.getOrExecute('dashboard_stats', async () => {
    // New requests stats
    const newRequestsCount = await prisma.contactRequest.count({
      where: { status: 'neu' }
    });
    
    const currentWeekRequests = await prisma.contactRequest.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      }
    });
    
    const prevWeekRequests = await prisma.contactRequest.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      }
    });
    
    // Active projects stats
    const activeProjects = await prisma.project.count({
      where: {
        status: {
          in: ['neu', 'in_bearbeitung']
        }
      }
    });
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    
    const currentMonthProjects = await prisma.project.count({
      where: {
        createdAt: {
          gte: currentMonth
        }
      }
    });
    
    const prevMonthProjects = await prisma.project.count({
      where: {
        createdAt: {
          gte: prevMonth,
          lt: currentMonth
        }
      }
    });
    
    // Total customers stats
    const totalCustomers = await prisma.customer.count({
      where: { status: 'aktiv' }
    });
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const customersLastYear = await prisma.customer.count({
      where: {
        createdAt: {
          lt: oneYearAgo
        },
        status: 'aktiv'
      }
    });
    
    // Monthly revenue stats
    const currentMonthRevenue = await prisma.invoice.aggregate({
      _sum: {
        amount: true
      },
      where: {
        invoiceDate: {
          gte: currentMonth
        }
      }
    });
    
    const prevMonthRevenue = await prisma.invoice.aggregate({
      _sum: {
        amount: true
      },
      where: {
        invoiceDate: {
          gte: prevMonth,
          lt: currentMonth
        }
      }
    });
    
    // Calculate trends
    const newRequestsTrend = prevWeekRequests > 0 ? 
      Math.round(((currentWeekRequests - prevWeekRequests) / prevWeekRequests) * 100) : 0;
    
    const activeProjectsTrend = prevMonthProjects > 0 ?
      Math.round(((currentMonthProjects - prevMonthProjects) / prevMonthProjects) * 100) : 0;
    
    const totalCustomersTrend = customersLastYear > 0 ?
      Math.round(((totalCustomers - customersLastYear) / customersLastYear) * 100) : 0;
    
    const monthlyRevenue = currentMonthRevenue._sum.amount || 0;
    const prevMonthRevenueAmount = prevMonthRevenue._sum.amount || 0;
    const monthlyRevenueTrend = prevMonthRevenueAmount > 0 ?
      Math.round(((Number(monthlyRevenue) - Number(prevMonthRevenueAmount)) / Number(prevMonthRevenueAmount)) * 100) : 0;
    
    return {
      newRequests: { count: newRequestsCount, trend: newRequestsTrend },
      activeProjects: { count: activeProjects, trend: activeProjectsTrend },
      totalCustomers: { count: totalCustomers, trend: totalCustomersTrend },
      monthlyRevenue: { amount: monthlyRevenue, trend: monthlyRevenueTrend }
    };
  }, 300); // Cache for 5 minutes
});

/**
 * Get data for dashboard charts
 */
async function getChartData(revenueFilter: string, servicesFilter: string): Promise<ChartData> {
  // Revenue chart data
  const cacheKey = `revenue_chart_${revenueFilter}`;
  const revenueData = await cache.getOrExecute(cacheKey, async () => {
    // Calculate date range based on filter
    const { startDate, groupBy, dateFormat } = calculateDateRange(revenueFilter);
    
    // Query for revenue chart using Prisma
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: startDate,
          lte: new Date()
        }
      },
      select: {
        invoiceDate: true,
        amount: true
      }
    });
    
    // Group by time period and format for chart
    const groupedData = new Map<string, number>();
    
    invoices.forEach(invoice => {
      let groupKey: string;
      const date = new Date(invoice.invoiceDate);
      
      // Group by requested period
      switch (groupBy) {
        case 'day':
          groupKey = format(date, 'dd.MM');
          break;
        case 'week':
          // Get week start date (Monday)
          const weekStart = new Date(date);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          groupKey = format(weekStart, 'dd.MM');
          break;
        case 'month':
        default:
          groupKey = format(date, 'MMM yy');
      }
      
      // Sum amounts for the same period
      if (groupedData.has(groupKey)) {
        groupedData.set(groupKey, groupedData.get(groupKey)! + Number(invoice.amount));
      } else {
        groupedData.set(groupKey, Number(invoice.amount));
      }
    });
    
    // Convert Map to sorted arrays
    const sortedEntries = Array.from(groupedData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));
    
    return {
      labels: sortedEntries.map(([label]) => label),
      data: sortedEntries.map(([_, amount]) => amount)
    };
  }, 600); // Cache for 10 minutes
  
  // Services chart data
  const servicesKey = `services_chart_${servicesFilter}`;
  const servicesData = await cache.getOrExecute(servicesKey, async () => {
    // Determine date range for services filter
    let startDate = new Date();
    
    switch(servicesFilter) {
      case 'Diese Woche':
        // Start of current week
        startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'Dieses Quartal':
        // Start of current quarter
        startDate.setMonth(Math.floor(startDate.getMonth() / 3) * 3, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'Dieses Jahr':
        // Start of current year
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'Diesen Monat':
      default:
        // Start of current month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Use raw SQL with Prisma for complex aggregation
    type ServiceRevenue = {
      service_name: string;
      summe: string;
    };
    
    const servicesRevenue = await prisma.$queryRaw<ServiceRevenue[]>`
      SELECT 
        s.name as service_name,
        SUM(ip.quantity * ip.unitPrice) as summe
      FROM 
        "InvoicePosition" ip
        JOIN "Service" s ON ip."serviceId" = s.id
        JOIN "Invoice" i ON ip."invoiceId" = i.id
      WHERE 
        s.name IS NOT NULL 
        AND i."invoiceDate" >= ${startDate}
      GROUP BY 
        s.name
      ORDER BY 
        summe DESC
      LIMIT 4
    `;
    
    return {
      labels: servicesRevenue.map(item => item.service_name),
      data: servicesRevenue.map(item => parseFloat(item.summe))
    };
  }, 600); // Cache for 10 minutes
  
  return {
    revenue: revenueData,
    services: servicesData
  };
}

/**
 * Helper function to calculate date range for charts
 */
function calculateDateRange(filter: string): DateRangeResult {
  const now = new Date();
  let startDate: Date;
  let groupBy: string;
  let dateFormat: string;
  
  switch(filter) {
    case 'Letzten 30 Tage':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      groupBy = 'day';
      dateFormat = 'DD.MM';
      break;
    case 'Letzten 3 Monate':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      groupBy = 'week';
      dateFormat = 'DD.MM';
      break;
    case 'Dieses Jahr':
      startDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
      groupBy = 'month';
      dateFormat = 'Mon YY';
      break;
    case 'Letzten 6 Monate':
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      groupBy = 'month';
      dateFormat = 'Mon YY';
  }
  
  return { startDate, groupBy, dateFormat };
}

/**
 * Get recent requests for dashboard
 */
async function getRecentRequests(): Promise<any[]> {
  try {
    return await cache.getOrExecute('recent_requests', async () => {
      const requests = await prisma.contactRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      // Format requests
      return requests.map(request => {
        let statusClass: string;
        let statusLabel: string;
        
        switch (request.status) {
          case 'neu':
            statusLabel = 'Neu';
            statusClass = 'warning';
            break;
          case 'in_bearbeitung':
            statusLabel = 'In Bearbeitung';
            statusClass = 'info';
            break;
          case 'beantwortet':
            statusLabel = 'Beantwortet';
            statusClass = 'success';
            break;
          default:
            statusLabel = 'Geschlossen';
            statusClass = 'secondary';
        }
        
        // Map service type to label
        let serviceLabel: string;
        switch (request.service) {
          case 'facility':
            serviceLabel = 'Facility Management';
            break;
          case 'moving':
            serviceLabel = 'Umzüge & Transporte';
            break;
          case 'winter':
            serviceLabel = 'Winterdienst';
            break;
          default:
            serviceLabel = 'Sonstiges';
        }
        
        return {
          id: request.id,
          name: request.name,
          email: request.email,
          serviceLabel,
          formattedDate: formatDateSafely(request.createdAt, 'dd.MM.yyyy'),
          status: statusLabel,
          statusClass
        };
      });
    }, 120); // Cache for 2 minutes
  } catch (error) {
    console.error('Error fetching recent requests:', error);
    return [];
  }
}

/**
 * Get upcoming appointments for dashboard
 */
async function getUpcomingAppointments(): Promise<any[]> {
  try {
    return await cache.getOrExecute('upcoming_appointments', async () => {
      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: new Date()
          }
        },
        include: {
          Customer: true
        },
        orderBy: {
          appointmentDate: 'asc'
        },
        take: 5
      });
      
      // Format appointments
      return appointments.map(appointment => {
        const datumObj = new Date(appointment.appointmentDate);
        const dateInfo = formatDateWithLabel(datumObj);
        
        return {
          id: appointment.id,
          title: appointment.title,
          customer: appointment.Customer?.name || 'Kein Kunde zugewiesen',
          dateLabel: dateInfo.label,
          dateClass: dateInfo.class,
          time: format(datumObj, 'HH:mm')
        };
      });
    }, 120); // Cache for 2 minutes
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return [];
  }
}

/**
 * Global search across all entities
 */
export const globalSearch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = req.query.q as string;
  
  if (!query || query.trim().length < 2) {
    res.status(200).json({
      customers: [],
      projects: [],
      appointments: [],
      requests: [],
      services: []
    });
    return;
  }
  
  try {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    // Execute searches in parallel using Prisma
    const [customers, projects, appointments, requests, services] = await Promise.all([
      // Search customers
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      
      // Search projects
      prisma.project.findMany({
        where: {
          title: { contains: query, mode: 'insensitive' }
        },
        include: {
          Customer: true
        },
        take: 5
      }),
      
      // Search appointments
      prisma.appointment.findMany({
        where: {
          title: { contains: query, mode: 'insensitive' }
        },
        include: {
          Customer: true
        },
        take: 5
      }),
      
      // Search requests
      prisma.contactRequest.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      
      // Search services
      prisma.service.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    ]);
    
    // Format and return results
    res.status(200).json({
      customers: customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        firma: customer.company || '',
        telefon: customer.phone || '',
        status: customer.status,
        type: 'Kunde',
        url: `/dashboard/kunden/${customer.id}`
      })),
      
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        status: project.status,
        date: formatDateSafely(project.startDate, 'dd.MM.yyyy'),
        kunde: project.Customer?.name || 'Kein Kunde',
        type: 'Projekt',
        url: `/dashboard/projekte/${project.id}`
      })),
      
      appointments: appointments.map(appointment => ({
        id: appointment.id,
        title: appointment.title,
        status: appointment.status,
        date: formatDateSafely(appointment.appointmentDate, 'dd.MM.yyyy, HH:mm'),
        kunde: appointment.Customer?.name || 'Kein Kunde',
        type: 'Termin',
        url: `/dashboard/termine/${appointment.id}`
      })),
      
      requests: requests.map(request => ({
        id: request.id,
        name: request.name,
        email: request.email,
        status: request.status,
        date: formatDateSafely(request.createdAt, 'dd.MM.yyyy'),
        type: 'Anfrage',
        url: `/dashboard/requests/${request.id}`
      })),
      
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        preis: service.priceBase,
        einheit: service.unit || '',
        aktiv: service.active,
        type: 'Dienstleistung',
        url: `/dashboard/dienste/${service.id}`
      }))
    });
  } catch (error) {
    console.error('Error performing global search:', error);
    throw error;
  }
});

/**
 * Get all notifications for a user
 */
export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }
  
  const userId = req.user.id;
  
  // Get notifications from database
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  
  // Format notifications
  const formattedNotifications = notifications.map(notification => {
    // Determine type and icon
    let type: string;
    let icon: string;
    
    switch (notification.type) {
      case 'anfrage':
        type = 'success';
        icon = 'envelope';
        break;
      case 'termin':
        type = 'primary';
        icon = 'calendar-check';
        break;
      case 'warnung':
        type = 'warning';
        icon = 'exclamation-triangle';
        break;
      default:
        type = 'info';
        icon = 'bell';
    }
    
    // Determine link based on type
    let link: string;
    switch (notification.type) {
      case 'anfrage':
        link = `/dashboard/requests/${notification.referenceId}`;
        break;
      case 'termin':
        link = `/dashboard/termine/${notification.referenceId}`;
        break;
      case 'projekt':
        link = `/dashboard/projekte/${notification.referenceId}`;
        break;
      default:
        link = '/dashboard/notifications';
    }
    
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type,
      icon,
      read: notification.read,
      time: formatRelativeTime(notification.createdAt),
      timestamp: notification.createdAt,
      link
    };
  });
  
  res.status(200).json({ notifications: formattedNotifications });
});

/**
 * Mark notifications as read
 */
export const markNotificationsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }
  
  const userId = req.user.id;
  const { notificationId, markAll } = req.body;
  let updatedCount = 0;
  
  if (markAll) {
    // Mark all notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        updatedAt: new Date()
      }
    });
    
    updatedCount = result.count;
  } else if (notificationId) {
    // Mark specific notification as read
    const result = await prisma.notification.updateMany({
      where: {
        id: Number(notificationId),
        userId
      },
      data: {
        read: true,
        updatedAt: new Date()
      }
    });
    
    updatedCount = result.count;
  } else {
    throw new Error('Either notification ID or mark all flag is required');
  }
  
  // Clear cache
  cache.delete(`notifications_${userId}`);
  
  res.status(200).json({
    success: true,
    count: updatedCount,
    message: markAll ? 'All notifications marked as read' : 'Notification marked as read'
  });
});