/**
 * Dashboard Controller
 * Handles business logic for the main dashboard
 */
const pool = require('../services/db.service');
const cacheService = require('../services/cache.service');
const { getNotifications } = require('../utils/helpers');
const { formatDateSafely, formatRelativeTime, formatDateWithLabel } = require('../utils/formatters');
const { format } = require('date-fns');

/**
 * Get dashboard data including statistics, charts, and recent activities
 */
exports.getDashboardData = async (req) => {
  try {
    // Get notifications
    const notifications = await getNotifications(req);
    
    // Calculate date range filters
    const revenueFilter = req.query.revenueFilter || 'Letzten 6 Monate';
    const servicesFilter = req.query.servicesFilter || 'Diesen Monat';

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

    // Get dashboard data from cache or database
    const stats = await exports.getDashboardStats();
    const recentRequests = await getRecentRequests();
    const upcomingAppointments = await getUpcomingAppointments();
    const charts = await getChartData(revenueFilter, servicesFilter);
    
    // System status information
    const systemStatus = {
      database: 'online',
      lastUpdate: format(new Date(), 'dd.MM.yyyy, HH:mm:ss'),
      processing: 'active',
      statistics: 'active'
    };
    
    return {
      stats,
      chartFilters,
      charts,
      notifications,
      recentRequests,
      upcomingAppointments,
      systemStatus
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
};

/**
 * Get dashboard statistics (used by both API and main dashboard)
 */
exports.getDashboardStats = async () => {
  try {
    return await cacheService.getOrExecute('dashboard_stats', async () => {
      // New requests stats
      const newRequestsQuery = await pool.query(`
        SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'
      `);
      
      const currentWeekRequestsQuery = await pool.query(`
        SELECT COUNT(*) FROM kontaktanfragen
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `);
      
      const prevWeekRequestsQuery = await pool.query(`
        SELECT COUNT(*) FROM kontaktanfragen
        WHERE created_at >= NOW() - INTERVAL '14 days' 
        AND created_at < NOW() - INTERVAL '7 days'
      `);
      
      // Active projects stats
      const activeProjectsQuery = await pool.query(`
        SELECT COUNT(*) FROM projekte 
        WHERE status IN ('neu', 'in_bearbeitung')
      `);
      
      const currentMonthProjectsQuery = await pool.query(`
        SELECT COUNT(*) FROM projekte
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `);
      
      const prevMonthProjectsQuery = await pool.query(`
        SELECT COUNT(*) FROM projekte
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
      `);
      
      // Total customers stats
      const totalCustomersQuery = await pool.query(`
        SELECT COUNT(*) FROM kunden WHERE status = 'aktiv'
      `);
      
      const customersLastYearQuery = await pool.query(`
        SELECT COUNT(*) FROM kunden 
        WHERE created_at < NOW() - INTERVAL '1 year' AND status = 'aktiv'
      `);
      
      // Monthly revenue stats
      const monthlyRevenueQuery = await pool.query(`
        SELECT COALESCE(SUM(betrag), 0) as summe FROM rechnungen
        WHERE rechnungsdatum >= DATE_TRUNC('month', CURRENT_DATE)
      `);
      
      const prevMonthRevenueQuery = await pool.query(`
        SELECT COALESCE(SUM(betrag), 0) as summe FROM rechnungen
        WHERE rechnungsdatum >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND rechnungsdatum < DATE_TRUNC('month', CURRENT_DATE)
      `);
      
      // Calculate trends
      const newRequestsCount = parseInt(newRequestsQuery.rows[0]?.count || 0);
      const currentWeekCount = parseInt(currentWeekRequestsQuery.rows[0]?.count || 0);
      const prevWeekCount = parseInt(prevWeekRequestsQuery.rows[0]?.count || 0);
      const newRequestsTrend = prevWeekCount > 0 ? 
        Math.round(((currentWeekCount - prevWeekCount) / prevWeekCount) * 100) : 0;
      
      const activeProjectsCount = parseInt(activeProjectsQuery.rows[0]?.count || 0);
      const currentMonthCount = parseInt(currentMonthProjectsQuery.rows[0]?.count || 0);
      const prevMonthCount = parseInt(prevMonthProjectsQuery.rows[0]?.count || 0);
      const activeProjectsTrend = prevMonthCount > 0 ?
        Math.round(((currentMonthCount - prevMonthCount) / prevMonthCount) * 100) : 0;
      
      const totalCustomersCount = parseInt(totalCustomersQuery.rows[0]?.count || 0);
      const customersLastYear = parseInt(customersLastYearQuery.rows[0]?.count || 0);
      const totalCustomersTrend = customersLastYear > 0 ?
        Math.round(((totalCustomersCount - customersLastYear) / customersLastYear) * 100) : 0;
      
      const monthlyRevenue = parseFloat(monthlyRevenueQuery.rows[0]?.summe || 0);
      const prevMonthRevenue = parseFloat(prevMonthRevenueQuery.rows[0]?.summe || 0);
      const monthlyRevenueTrend = prevMonthRevenue > 0 ?
        Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0;
      
      return {
        newRequests: { count: newRequestsCount, trend: newRequestsTrend },
        activeProjects: { count: activeProjectsCount, trend: activeProjectsTrend },
        totalCustomers: { count: totalCustomersCount, trend: totalCustomersTrend },
        monthlyRevenue: { amount: monthlyRevenue, trend: monthlyRevenueTrend }
      };
    }, 300); // Cache for 5 minutes
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

/**
 * Get data for dashboard charts
 */
async function getChartData(revenueFilter, servicesFilter) {
  try {
    // Revenue chart data
    const cacheKey = `revenue_chart_${revenueFilter}`;
    const revenueData = await cacheService.getOrExecute(cacheKey, async () => {
      // Calculate date range based on filter
      const { startDate, groupBy, dateFormat } = calculateDateRange(revenueFilter);
      
      // Query for revenue chart
      const revenueQuery = await pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC($1, rechnungsdatum), $2) as label,
          SUM(betrag) as summe
        FROM 
          rechnungen 
        WHERE 
          rechnungsdatum >= $3 AND rechnungsdatum <= CURRENT_DATE
        GROUP BY 
          DATE_TRUNC($1, rechnungsdatum)
        ORDER BY 
          DATE_TRUNC($1, rechnungsdatum)
      `, [groupBy, dateFormat, startDate]);
      
      // Format data for chart
      return {
        labels: revenueQuery.rows.map(row => row.label),
        data: revenueQuery.rows.map(row => parseFloat(row.summe))
      };
    }, 600); // Cache for 10 minutes
    
    // Services chart data
    const servicesKey = `services_chart_${servicesFilter}`;
    const servicesData = await cacheService.getOrExecute(servicesKey, async () => {
      // Determine date range for services filter
      let dateFilter;
      switch(servicesFilter) {
        case 'Diese Woche':
          dateFilter = "AND rechnungsdatum >= DATE_TRUNC('week', CURRENT_DATE)";
          break;
        case 'Dieses Quartal':
          dateFilter = "AND rechnungsdatum >= DATE_TRUNC('quarter', CURRENT_DATE)";
          break;
        case 'Dieses Jahr':
          dateFilter = "AND rechnungsdatum >= DATE_TRUNC('year', CURRENT_DATE)";
          break;
        case 'Diesen Monat':
        default:
          dateFilter = "AND rechnungsdatum >= DATE_TRUNC('month', CURRENT_DATE)";
      }
      
      // Query for services chart
      const servicesQuery = await pool.query(`
        SELECT 
          d.name as service_name,
          SUM(p.anzahl * p.einzelpreis) as summe
        FROM 
          rechnungspositionen p
          JOIN dienstleistungen d ON p.dienstleistung_id = d.id
          JOIN rechnungen r ON p.rechnung_id = r.id
        WHERE 
          d.name IS NOT NULL ${dateFilter}
        GROUP BY 
          d.name
        ORDER BY 
          summe DESC
        LIMIT 4
      `);
      
      // Format data for chart
      return {
        labels: servicesQuery.rows.map(row => row.service_name),
        data: servicesQuery.rows.map(row => parseFloat(row.summe))
      };
    }, 600); // Cache for 10 minutes
    
    return {
      revenue: revenueData,
      services: servicesData
    };
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
}

/**
 * Helper function to calculate date range for charts
 */
function calculateDateRange(filter) {
  const now = new Date();
  let startDate, groupBy, dateFormat;
  
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
async function getRecentRequests() {
  try {
    return await cacheService.getOrExecute('recent_requests', async () => {
      const requestsQuery = await pool.query(`
        SELECT 
          id, name, email, service, status, created_at
        FROM 
          kontaktanfragen
        ORDER BY 
          created_at DESC
        LIMIT 5
      `);
      
      // Format requests
      return requestsQuery.rows.map(request => {
        let statusClass, statusLabel;
        
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
        let serviceLabel;
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
          formattedDate: formatDateSafely(request.created_at, 'dd.MM.yyyy'),
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
async function getUpcomingAppointments() {
  try {
    return await cacheService.getOrExecute('upcoming_appointments', async () => {
      const appointmentsQuery = await pool.query(`
        SELECT 
          t.id, 
          t.titel, 
          t.termin_datum,
          t.status,
          k.name AS kunde_name
        FROM 
          termine t
          LEFT JOIN kunden k ON t.kunde_id = k.id
        WHERE 
          t.termin_datum >= CURRENT_DATE
          AND t.termin_datum IS NOT NULL
        ORDER BY 
          t.termin_datum ASC
        LIMIT 5
      `);
      
      // Format appointments
      return appointmentsQuery.rows.map(appointment => {
        try {
          const datumObj = new Date(appointment.termin_datum);
          if (isNaN(datumObj.getTime())) {
            console.error(`Invalid date format for appointment ${appointment.id}: ${appointment.termin_datum}`);
            return null;
          }
          const dateInfo = formatDateWithLabel(datumObj);
          
          return {
            id: appointment.id,
            title: appointment.titel,
            customer: appointment.kunde_name || 'Kein Kunde zugewiesen',
            dateLabel: dateInfo.label,
            dateClass: dateInfo.class,
            time: format(datumObj, 'HH:mm')
          };
        } catch (error) {
          console.error(`Error formatting appointment ${appointment.id}:`, error);
          return null;
        }
      }).filter(appointment => appointment !== null);
    }, 120); // Cache for 2 minutes
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return [];
  }
}

/**
 * Global search across all entities
 * @param {string} query - Search query
 */
exports.globalSearch = async (query) => {
  try {
    // Return empty results for invalid queries
    if (!query || query.length < 2) {
      return {
        customers: [],
        projects: [],
        appointments: [],
        requests: [],
        services: []
      };
    }

    const searchTerm = `%${query}%`;
    const results = {
      customers: [],
      projects: [],
      appointments: [],
      requests: [],
      services: []
    };

    try {
      const customersResult = await pool.query(`
        SELECT id, firma, vorname, nachname, email 
        FROM kunden 
        WHERE LOWER(firma) LIKE LOWER($1) OR 
              LOWER(vorname) LIKE LOWER($1) OR 
              LOWER(nachname) LIKE LOWER($1)
        LIMIT 5
      `, [searchTerm]);
      results.customers = customersResult.rows;
    } catch (error) {
      console.error('Error searching customers:', error);
    }

    try {
      const projectsResult = await pool.query(`
        SELECT id, titel, status 
        FROM projekte 
        WHERE LOWER(titel) LIKE LOWER($1)
        LIMIT 5
      `, [searchTerm]);
      results.projects = projectsResult.rows;
    } catch (error) {
      console.error('Error searching projects:', error);
    }

    try {
      const appointmentsResult = await pool.query(`
        SELECT id, titel, datum 
        FROM termine 
        WHERE LOWER(titel) LIKE LOWER($1)
        LIMIT 5
      `, [searchTerm]);
      results.appointments = appointmentsResult.rows;
    } catch (error) {
      console.error('Error searching appointments:', error);
    }

    try {
      const requestsResult = await pool.query(`
        SELECT id, name, email, status 
        FROM kontaktanfragen 
        WHERE LOWER(name) LIKE LOWER($1) OR 
              LOWER(email) LIKE LOWER($1)
        LIMIT 5
      `, [searchTerm]);
      results.requests = requestsResult.rows;
    } catch (error) {
      console.error('Error searching requests:', error);
    }

    try {
      const servicesResult = await pool.query(`
        SELECT id, name 
        FROM services 
        WHERE LOWER(name) LIKE LOWER($1)
        LIMIT 5
      `, [searchTerm]);
      results.services = servicesResult.rows;
    } catch (error) {
      console.error('Error searching services:', error);
    }

    return results;
  } catch (error) {
    console.error('Global search error:', error);
    return {
      customers: [],
      projects: [],
      appointments: [],
      requests: [],
      services: []
    };
  }
};

/**
 * Get notifications for a user
 * @param {number} userId - User ID
 */
exports.getNotifications = async (userId) => {
  try {
    if (!userId) {
      return {
        notifications: [],
        unreadCount: 0,
        totalCount: 0
      };
    }

    // Get notifications with counts in a single query
    const result = await pool.query(`
      WITH notification_data AS (
        SELECT
          id,
          typ,
          titel,
          nachricht,
          erstellt_am,
          gelesen,
          referenz_id
        FROM benachrichtigungen
        WHERE benutzer_id = $1
        ORDER BY erstellt_am DESC
      ),
      notification_counts AS (
        SELECT
          COUNT(*) FILTER (WHERE gelesen = false) as unread_count,
          COUNT(*) as total_count
        FROM benachrichtigungen
        WHERE benutzer_id = $1
      )
      SELECT
        json_agg(notification_data.*) as notifications,
        (SELECT unread_count FROM notification_counts) as unread_count,
        (SELECT total_count FROM notification_counts) as total_count
      FROM notification_data
    `, [userId]);

    // If no notifications found, return empty result
    if (!result.rows[0].notifications) {
      return {
        notifications: [],
        unreadCount: 0,
        totalCount: 0
      };
    }

    // Format notifications
    const notifications = result.rows[0].notifications.map(notification => {
      // Determine type and icon
      let type, icon;
      switch (notification.typ) {
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

      // Generate link based on type
      let link;
      switch (notification.typ) {
        case 'anfrage':
          link = `/dashboard/requests/${notification.referenz_id}`;
          break;
        case 'termin':
          link = `/dashboard/termine/${notification.referenz_id}`;
          break;
        case 'projekt':
          link = `/dashboard/projekte/${notification.referenz_id}`;
          break;
        default:
          link = '/dashboard/notifications';
      }

      return {
        id: notification.id,
        title: notification.titel,
        message: notification.nachricht,
        type,
        icon,
        read: notification.gelesen,
        time: formatRelativeTime(notification.erstellt_am),
        timestamp: notification.erstellt_am,
        link
      };
    });

    return {
      notifications,
      unreadCount: parseInt(result.rows[0].unread_count || 0),
      totalCount: parseInt(result.rows[0].total_count || 0)
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      notifications: [],
      unreadCount: 0,
      totalCount: 0
    };
  }
};

/**
 * Mark notifications as read
 */
exports.markNotificationsRead = async (userId, notificationId, markAll) => {
  try {
    let result;
    
    if (markAll) {
      // Mark all notifications as read
      result = await pool.query(`
        UPDATE benachrichtigungen
        SET gelesen = true, updated_at = CURRENT_TIMESTAMP
        WHERE benutzer_id = $1 AND gelesen = false
        RETURNING id
      `, [userId]);
    } else if (notificationId) {
      // Mark specific notification as read
      result = await pool.query(`
        UPDATE benachrichtigungen
        SET gelesen = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND benutzer_id = $2
        RETURNING id
      `, [notificationId, userId]);
    } else {
      throw new Error('Either notification ID or mark all flag is required');
    }
    
    // Clear cache
    cacheService.delete(`notifications_${userId}`);
    
    return {
      success: true,
      count: result.rowCount,
      message: markAll ? 'All notifications marked as read' : 'Notification marked as read'
    };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};