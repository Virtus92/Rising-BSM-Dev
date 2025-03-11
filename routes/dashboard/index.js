/**
 * Dashboard Index Route
 * Zuständig für die Hauptseite des Dashboards
 */

import express from 'express';
const router = express.Router();
import { format, isToday, isTomorrow } from 'date-fns';
import pool from '../../db.js';
import {
  getNotifications,
  getCachedOrFreshData,
  getCountFromDB,
  formatDateSafely,
  getAnfrageStatusInfo,
  getTerminStatusInfo
} from '../../utils/helpers.js';

// Dashboard Hauptseite
router.get('/', async (req, res) => {
  try {
    // Benutzerinformationen
    const user = req.session.user;
    
    // Aktueller Pfad für die Navigation
    const currentPath = req.path;

    // Filter für Charts
    const revenueFilter = req.query.revenueFilter || 'Letzten 6 Monate';
    const servicesFilter = req.query.servicesFilter || 'Diesen Monat';

    // Chart Filter Optionen
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

    // Zeitraum-Berechnungen für die Statistiken
    const calculateDateRangeForPeriod = (period) => {
      const now = new Date();
      let startDate;
      
      switch(period) {
        case 'Letzten 30 Tage':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
        case 'Letzten 3 Monate':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'Dieses Jahr':
          startDate = new Date(now.getFullYear(), 0, 1); // 1. Januar des aktuellen Jahres
          break;
        case 'Letzten 6 Monate':
        default:
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 6);
      }
      
      return { startDate, endDate: now };
    };
    
    // --- STATISTIKEN AUFBAUEN ---
    
    let stats = {
      newRequests: { count: 0, trend: 0 },
      activeProjects: { count: 0, trend: 0 },
      totalCustomers: { count: 0, trend: 0 },
      monthlyRevenue: { amount: 0, trend: 0 }
    };
    
    // Neue Anfragen zählen
    const newRequestsQuery = `SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'`;
    const newRequestsResult = await getCachedOrFreshData('newRequests', newRequestsQuery);
    stats.newRequests.count = parseInt(newRequestsResult[0].count || 0);

    // Trend: Anfragen Vergleich zur Vorwoche
    const currentWeekRequestsQuery = `
      SELECT COUNT(*) FROM kontaktanfragen
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;
    const prevWeekRequestsQuery = `
      SELECT COUNT(*) FROM kontaktanfragen
      WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'
    `;
    
    const [currentWeekResult, prevWeekResult] = await Promise.all([
      getCachedOrFreshData('currentWeekRequests', currentWeekRequestsQuery),
      getCachedOrFreshData('prevWeekRequests', prevWeekRequestsQuery)
    ]);
    
    const currentWeekCount = parseInt(currentWeekResult[0].count || 0);
    const prevWeekCount = parseInt(prevWeekResult[0].count || 0);
    
    if (prevWeekCount > 0) {
      stats.newRequests.trend = Math.round(((currentWeekCount - prevWeekCount) / prevWeekCount) * 100);
    }

    // Aktive Aufträge mit optimierter Abfrage
    const activeProjectsQuery = `
      SELECT COUNT(*) FROM projekte 
      WHERE status IN ('neu', 'in_bearbeitung')
    `;
    const activeProjectsResult = await getCachedOrFreshData('activeProjects', activeProjectsQuery);
    stats.activeProjects.count = parseInt(activeProjectsResult[0].count || 0);
    
    // Trend: Projekte im Vergleich zum Vormonat
    const currentMonthProjectsQuery = `
      SELECT COUNT(*) FROM projekte
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;
    const prevMonthProjectsQuery = `
      SELECT COUNT(*) FROM projekte
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    const [currentMonthResult, prevMonthResult] = await Promise.all([
      getCachedOrFreshData('currentMonthProjects', currentMonthProjectsQuery),
      getCachedOrFreshData('prevMonthProjects', prevMonthProjectsQuery)
    ]);
    
    const currentMonthCount = parseInt(currentMonthResult[0].count || 0);
    const prevMonthCount = parseInt(prevMonthResult[0].count || 0);
    
    if (prevMonthCount > 0) {
      stats.activeProjects.trend = Math.round(((currentMonthCount - prevMonthCount) / prevMonthCount) * 100);
    }

    // Gesamtkunden mit Trendanalyse
    const totalCustomersQuery = `SELECT COUNT(*) FROM kunden WHERE status = 'aktiv'`;
    const customersLastYearQuery = `
      SELECT COUNT(*) FROM kunden 
      WHERE created_at < NOW() - INTERVAL '1 year' AND status = 'aktiv'
    `;
    
    const [totalCustomersResult, customersLastYearResult] = await Promise.all([
      getCachedOrFreshData('totalCustomers', totalCustomersQuery),
      getCachedOrFreshData('customersLastYear', customersLastYearQuery)
    ]);
    
    stats.totalCustomers.count = parseInt(totalCustomersResult[0].count || 0);
    const customersLastYear = parseInt(customersLastYearResult[0].count || 0);
    
    if (customersLastYear > 0) {
      stats.totalCustomers.trend = Math.round(((stats.totalCustomers.count - customersLastYear) / customersLastYear) * 100);
    }

    // Monatlicher Umsatz mit verbesserten Abfragen
    const monthlyRevenueQuery = `
      SELECT COALESCE(SUM(betrag), 0) as summe FROM rechnungen
      WHERE rechnungsdatum >= DATE_TRUNC('month', CURRENT_DATE)
    `;
    const prevMonthRevenueQuery = `
      SELECT COALESCE(SUM(betrag), 0) as summe FROM rechnungen
      WHERE rechnungsdatum >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND rechnungsdatum < DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    const [monthlyRevenueResult, prevMonthRevenueResult] = await Promise.all([
      getCachedOrFreshData('monthlyRevenue', monthlyRevenueQuery),
      getCachedOrFreshData('prevMonthRevenue', prevMonthRevenueQuery)
    ]);
    
    stats.monthlyRevenue.amount = parseFloat(monthlyRevenueResult[0].summe || 0);
    const prevMonthRevenue = parseFloat(prevMonthRevenueResult[0].summe || 0);
    
    if (prevMonthRevenue > 0) {
      stats.monthlyRevenue.trend = Math.round(((stats.monthlyRevenue.amount - prevMonthRevenue) / prevMonthRevenue) * 100);
    }

    // --- CHART DATEN ---
    
    let charts = {
      revenue: { labels: [], data: [] },
      services: { labels: [], data: [] }
    };
    
    // Revenue Chart Daten basierend auf ausgewähltem Filter
    const { startDate, endDate } = calculateDateRangeForPeriod(revenueFilter);
    let revenueGrouping, dateFormat;
    
    // Anpassung des Gruppierungsintervalls und Datumsformats basierend auf dem gewählten Filter
    if (revenueFilter === 'Letzten 30 Tage') {
      revenueGrouping = 'day';
      dateFormat = 'DD.MM';
    } else if (revenueFilter === 'Letzten 3 Monate') {
      revenueGrouping = 'week';
      dateFormat = 'DD.MM';
    } else {
      revenueGrouping = 'month';
      dateFormat = 'MMM YY';
    }
    
    const revenueChartQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('${revenueGrouping}', rechnungsdatum), '${dateFormat}') as label,
        SUM(betrag) as summe
      FROM 
        rechnungen 
      WHERE 
        rechnungsdatum >= $1 AND rechnungsdatum <= $2
      GROUP BY 
        DATE_TRUNC('${revenueGrouping}', rechnungsdatum)
      ORDER BY 
        DATE_TRUNC('${revenueGrouping}', rechnungsdatum)
    `;
    
    const revenueChartResult = await getCachedOrFreshData(
      `revenueChart_${revenueFilter}`, 
      revenueChartQuery, 
      [startDate, endDate]
    );
    
    charts.revenue.labels = revenueChartResult.map(row => row.label);
    charts.revenue.data = revenueChartResult.map(row => parseFloat(row.summe));
    
    // Services-Chart-Daten für Darstellung der Dienstleistungsverteilung
    let servicesPeriod;
    switch(servicesFilter) {
      case 'Diese Woche':
        servicesPeriod = "AND rechnungsdatum >= DATE_TRUNC('week', CURRENT_DATE)";
        break;
      case 'Dieses Quartal':
        servicesPeriod = "AND rechnungsdatum >= DATE_TRUNC('quarter', CURRENT_DATE)";
        break;
      case 'Dieses Jahr':
        servicesPeriod = "AND rechnungsdatum >= DATE_TRUNC('year', CURRENT_DATE)";
        break;
      case 'Diesen Monat':
      default:
        servicesPeriod = "AND rechnungsdatum >= DATE_TRUNC('month', CURRENT_DATE)";
    }
    
    const servicesChartQuery = `
      SELECT 
        d.name as service_name,
        SUM(p.anzahl * p.einzelpreis) as summe
      FROM 
        rechnungspositionen p
        JOIN dienstleistungen d ON p.dienstleistung_id = d.id
        JOIN rechnungen r ON p.rechnung_id = r.id
      WHERE 
        d.name IS NOT NULL ${servicesPeriod}
      GROUP BY 
        d.name
      ORDER BY 
        summe DESC
      LIMIT 4
    `;
    
    const servicesChartResult = await getCachedOrFreshData(
      `servicesChart_${servicesFilter}`, 
      servicesChartQuery
    );
    
    charts.services.labels = servicesChartResult.map(row => row.service_name);
    charts.services.data = servicesChartResult.map(row => parseFloat(row.summe));
    
    // Fallback für leere Chart-Daten
    if (charts.services.labels.length === 0) {
      charts.services.labels = ['Keine Daten verfügbar'];
      charts.services.data = [0];
    }
    
    if (charts.revenue.labels.length === 0) {
      if (revenueFilter === 'Letzten 30 Tage') {
        // Generiere leere Tageseinträge für die letzten 30 Tage
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          charts.revenue.labels.push(format(date, 'dd.MM'));
          charts.revenue.data.push(0);
        }
      } else if (revenueFilter === 'Letzten 3 Monate') {
        // Generiere leere Wocheneinträge für die letzten 12 Wochen
        for (let i = 0; i < 12; i++) {
          charts.revenue.labels.push(`Woche ${i+1}`);
          charts.revenue.data.push(0);
        }
      } else {
        // Generiere leere Monatseinträge für die letzten 6 Monate
        const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        const currentMonth = new Date().getMonth();
        
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          const year = new Date().getFullYear() - (currentMonth < i ? 1 : 0);
          charts.revenue.labels.push(`${monthNames[monthIndex]} ${year.toString().substr(2)}`);
          charts.revenue.data.push(0);
        }
      }
    }

    // --- WEITERE DATEN FÜR DASHBOARD WIDGETS ---
    
    // Neue Anfragen für Badge
    const newRequestsCount = stats.newRequests.count;

    // Benachrichtigungen mit Caching
    const notifications = await getNotifications(req);

    // Aktuelle Anfragen mit verbesserten Informationen
    const recentRequestsQuery = `
      SELECT 
        id, 
        name, 
        email, 
        service, 
        status, 
        created_at
      FROM 
        kontaktanfragen
      ORDER BY 
        created_at DESC
      LIMIT 5
    `;
    
    const recentRequestsResult = await getCachedOrFreshData('recentRequests', recentRequestsQuery, [], 120);
    
    const recentRequests = recentRequestsResult.map(anfrage => {
      const statusInfo = getAnfrageStatusInfo(anfrage.status);
      return {
        id: anfrage.id,
        name: anfrage.name,
        email: anfrage.email,
        serviceLabel: anfrage.service === 'facility' ? 'Facility Management' : 
                     anfrage.service === 'moving' ? 'Umzüge & Transporte' : 
                     anfrage.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
        formattedDate: formatDateSafely(anfrage.created_at, 'dd.MM.yyyy'),
        status: statusInfo.label,
        statusClass: statusInfo.className
      };
    });

    // Anstehende Termine mit verbesserten Formatierungen und Informationen
    const upcomingAppointmentsQuery = `
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
    `;
    
    const upcomingAppointmentsResult = await getCachedOrFreshData('upcomingAppointments', upcomingAppointmentsQuery, [], 300);
    
    const upcomingAppointments = upcomingAppointmentsResult.map(termin => {
      const datumObj = new Date(termin.termin_datum);
      const heute = isToday(datumObj);
      const morgen = isTomorrow(datumObj);
      
      let dateLabel, dateClass;
      if (heute) {
        dateLabel = 'Heute';
        dateClass = 'primary';
      } else if (morgen) {
        dateLabel = 'Morgen';
        dateClass = 'success';
      } else {
        dateLabel = format(datumObj, 'dd.MM.yyyy');
        dateClass = 'secondary';
      }
      
      return {
        id: termin.id,
        title: termin.titel,
        customer: termin.kunde_name || 'Kein Kunde zugewiesen',
        dateLabel: dateLabel,
        dateClass: dateClass,
        time: format(datumObj, 'HH:mm')
      };
    });

    // Systemstatusabfragen für die neue Statusanzeige
    const systemStatus = {
      database: 'online',
      lastUpdate: format(new Date(), 'dd.MM.yyyy, HH:mm:ss'),
      processing: 'active',
      statistics: 'active'
    };
    
    // Rendere das Dashboard mit allen gesammelten Daten
    res.render('dashboard/index', {
      title: 'Dashboard - Rising BSM',
      user,
      currentPath,
      stats,
      chartFilters,
      charts,
      newRequestsCount,
      notifications,
      recentRequests,
      upcomingAppointments,
      systemStatus
    });
  } catch (error) {
    console.error('Dashboard-Fehler:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

export default router;