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
    const stats = await getDashboardStats();
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
      const newRequestsCount = parseInt(newRequestsQuery.rows[0].count || 0);
      const currentWeekCount = parseInt(currentWeekRequestsQuery.rows[0].count || 0);
      const prevWeekCount = parseInt(prevWeekRequestsQuery.rows[0].count || 0);
      const newRequestsTrend = prevWeekCount > 0 ? 
        Math.round(((currentWeekCount - prevWeekCount) / prevWeekCount) * 100) : 0;
      
      const activeProjectsCount = parseInt(activeProjectsQuery.rows[0].count || 0);
      const currentMonthCount = parseInt(currentMonthProjectsQuery.rows[0].count || 0);
      const prevMonthCount = parseInt(prevMonthProjectsQuery.rows[0].count || 0);
      const activeProjectsTrend = prevMonthCount > 0 ?
        Math.round(((currentMonthCount - prevMonthCount) / prevMonthCount) * 100) : 0;
      
      const totalCustomersCount = parseInt(totalCustomersQuery.rows[0].count || 0);
      const customersLastYear = parseInt(customersLastYearQuery.rows[0].count || 0);
      const totalCustomersTrend = customersLastYear > 0 ?
        Math.round(((totalCustomersCount - customersLastYear) / customersLastYear) * 100) : 0;
      
      const monthlyRevenue = parseFloat(monthlyRevenueQuery.rows[0].summe || 0);
      const prevMonthRevenue = parseFloat(prevMonthRevenueQuery.rows[0].summe || 0);
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
        ORDER BY 
          t.termin_datum ASC
        LIMIT 5
      `);
      
      // Format appointments
      return appointmentsQuery.rows.map(appointment => {
        const datumObj = new Date(appointment.termin_datum);
        const dateInfo = formatDateWithLabel(datumObj);
        
        return {
          id: appointment.id,
          title: appointment.titel,
          customer: appointment.kunde_name || 'Kein Kunde zugewiesen',
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
exports.globalSearch = async (query) => {
  if (!query || query.trim().length < 2) {
    return {
      customers: [],
      projects: [],
      appointments: [],
      requests: [],
      services: []
    };
  }
  
  try {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    // Execute all search queries in parallel
    const [
      customerResults,
      projectResults,
      appointmentResults,
      requestResults,
      serviceResults
    ] = await Promise.all([
      // Search customers
      pool.query(`
        SELECT id, name, email, firma, telefon, status
        FROM kunden 
        WHERE 
          LOWER(name) LIKE $1 OR 
          LOWER(email) LIKE $1 OR
          LOWER(firma) LIKE $1
        LIMIT 5
      `, [searchTerm]),
      
      // Search projects
      pool.query(`
        SELECT p.id, p.titel, p.status, p.start_datum, k.name as kunde_name
        FROM projekte p
        LEFT JOIN kunden k ON p.kunde_id = k.id
        WHERE LOWER(p.titel) LIKE $1
        LIMIT 5
      `, [searchTerm]),
      
      // Search appointments
      pool.query(`
        SELECT t.id, t.titel, t.status, t.termin_datum, k.name as kunde_name
        FROM termine t
        LEFT JOIN kunden k ON t.kunde_id = k.id
        WHERE LOWER(t.titel) LIKE $1
        LIMIT 5
      `, [searchTerm]),
      
      // Search requests
      pool.query(`
        SELECT id, name, email, service, status, created_at
        FROM kontaktanfragen
        WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1
        LIMIT 5
      `, [searchTerm]),
      
      // Search services
      pool.query(`
        SELECT id, name, beschreibung, preis_basis, einheit, aktiv
        FROM dienstleistungen
        WHERE LOWER(name) LIKE $1 OR LOWER(beschreibung) LIKE $1
        LIMIT 5
      `, [searchTerm])
    ]);
    
    // Format and return results
    return {
      customers: customerResults.rows.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        firma: customer.firma,
        telefon: customer.telefon,
        status: customer.status,
        type: 'Kunde',
        url: `/dashboard/kunden/${customer.id}`
      })),
      
      projects: projectResults.rows.map(project => ({
        id: project.id,
        title: project.titel,
        status: project.status,
        date: formatDateSafely(project.start_datum, 'dd.MM.yyyy'),
        kunde: project.kunde_name,
        type: 'Projekt',
        url: `/dashboard/projekte/${project.id}`
      })),
      
      appointments: appointmentResults.rows.map(appointment => ({
        id: appointment.id,
        title: appointment.titel,
        status: appointment.status,
        date: formatDateSafely(appointment.termin_datum, 'dd.MM.yyyy, HH:mm'),
        kunde: appointment.kunde_name,
        type: 'Termin',
        url: `/dashboard/termine/${appointment.id}`
      })),
      
      requests: requestResults.rows.map(request => ({
        id: request.id,
        name: request.name,
        email: request.email,
        status: request.status,
        date: formatDateSafely(request.created_at, 'dd.MM.yyyy'),
        type: 'Anfrage',
        url: `/dashboard/anfragen/${request.id}`
      })),
      
      services: serviceResults.rows.map(service => ({
        id: service.id,
        name: service.name,
        preis: service.preis_basis,
        einheit: service.einheit,
        aktiv: service.aktiv,
        type: 'Dienstleistung',
        url: `/dashboard/dienste/${service.id}`
      }))
    };
  } catch (error) {
    console.error('Error performing global search:', error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 */
exports.getNotifications = async (userId) => {
  try {
    // Get notifications from database
    const notificationsQuery = await pool.query(`
      SELECT
        id,
        typ,
        titel,
        nachricht,
        erstellt_am,
        gelesen,
        referenz_id
      FROM
        benachrichtigungen
      WHERE
        benutzer_id = $1
      ORDER BY
        erstellt_am DESC
    `, [userId]);
    
    // Format notifications
    const notifications = notificationsQuery.rows.map(notification => {
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
      
      // Determine link based on type
      let link;
      switch (notification.typ) {
        case 'anfrage':
          link = `/dashboard/anfragen/${notification.referenz_id}`;
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
    
    return { notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
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