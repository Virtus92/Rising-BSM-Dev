const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { formatDistanceToNow, isToday, isTomorrow, format } = require('date-fns');
const { de } = require('date-fns/locale');

// PostgreSQL-Verbindung importieren
const pool = require('../db');

// Auth Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Dashboard Hauptseite
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Benutzerinformationen
    const user = req.session.user;
    user.initials = user.name.split(' ').map(n => n[0]).join('');

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

    // Statistiken abrufen
    const statsQuery = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu') AS new_requests,
        (SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu' AND created_at > NOW() - INTERVAL '7 days') AS new_requests_week,
        (SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu' AND created_at > NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days') AS new_requests_prev_week,
        
        (SELECT COUNT(*) FROM projekte WHERE status = 'aktiv') AS active_projects,
        (SELECT COUNT(*) FROM projekte WHERE status = 'aktiv' AND created_at > NOW() - INTERVAL '1 month') AS active_projects_month,
        (SELECT COUNT(*) FROM projekte WHERE status = 'aktiv' AND created_at > NOW() - INTERVAL '2 months' AND created_at < NOW() - INTERVAL '1 month') AS active_projects_prev_month,
        
        (SELECT COUNT(*) FROM kunden) AS total_customers,
        (SELECT COUNT(*) FROM kunden WHERE created_at > NOW() - INTERVAL '1 year') AS total_customers_year,
        (SELECT COUNT(*) FROM kunden WHERE created_at > NOW() - INTERVAL '2 years' AND created_at < NOW() - INTERVAL '1 year') AS total_customers_prev_year,
        
        (SELECT COALESCE(SUM(betrag), 0) FROM rechnungen WHERE status = 'bezahlt' AND bezahlt_am > NOW() - INTERVAL '1 month') AS monthly_revenue,
        (SELECT COALESCE(SUM(betrag), 0) FROM rechnungen WHERE status = 'bezahlt' AND bezahlt_am > NOW() - INTERVAL '2 months' AND bezahlt_am < NOW() - INTERVAL '1 month') AS monthly_revenue_prev
    `);
    
    const statsRow = statsQuery.rows[0];
    
    // Berechne Trends
    const calcTrend = (current, previous) => {
      if (previous === 0) return 100;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    // Formatierte Statistiken
    const stats = {
      newRequests: {
        count: parseInt(statsRow.new_requests) || 0,
        trend: calcTrend(
          parseInt(statsRow.new_requests_week) || 0,
          parseInt(statsRow.new_requests_prev_week) || 0
        )
      },
      activeProjects: {
        count: parseInt(statsRow.active_projects) || 0,
        trend: calcTrend(
          parseInt(statsRow.active_projects_month) || 0,
          parseInt(statsRow.active_projects_prev_month) || 0
        )
      },
      totalCustomers: {
        count: parseInt(statsRow.total_customers) || 0,
        trend: calcTrend(
          parseInt(statsRow.total_customers_year) || 0,
          parseInt(statsRow.total_customers_prev_year) || 0
        )
      },
      monthlyRevenue: {
        amount: parseFloat(statsRow.monthly_revenue) || 0,
        trend: calcTrend(
          parseFloat(statsRow.monthly_revenue) || 0,
          parseFloat(statsRow.monthly_revenue_prev) || 0
        )
      }
    };

    // Daten für Umsatzentwicklungs-Chart
    let revenueInterval, revenueFormat;
    let revenueIntervalValue;

    switch(revenueFilter) {
      case 'Letzten 30 Tage':
        revenueInterval = "SELECT date_trunc('day', bezahlt_am) AS period";
        revenueFormat = 'dd.MM.';
        revenueIntervalValue = '30 days';
        break;
      case 'Letzten 3 Monate':
        revenueInterval = "SELECT date_trunc('week', bezahlt_am) AS period";
        revenueFormat = 'dd.MM.';
        revenueIntervalValue = '3 months';
        break;
      case 'Dieses Jahr':
        revenueInterval = "SELECT date_trunc('month', bezahlt_am) AS period";
        revenueFormat = 'MMM yy';
        revenueIntervalValue = '1 year';
        break;
      case 'Letzten 6 Monate':
      default:
        revenueInterval = "SELECT date_trunc('month', bezahlt_am) AS period";
        revenueFormat = 'MMM yy';
        revenueIntervalValue = '6 months';
    }

    const revenueChartQuery = await pool.query(`
      ${revenueInterval}, SUM(betrag) AS amount
      FROM rechnungen 
      WHERE status = 'bezahlt' 
      AND bezahlt_am > NOW() - INTERVAL $1
      GROUP BY period
      ORDER BY period
    `, [revenueIntervalValue]);

    let servicesIntervalValue;
    switch(servicesFilter) {
      case 'Diese Woche':
        servicesIntervalValue = '1 week';
        break;
      case 'Diesen Monat':
        servicesIntervalValue = '1 month';
        break;
      case 'Dieses Quartal':
        servicesIntervalValue = '3 months';
        break;
      case 'Dieses Jahr':
      default:
        servicesIntervalValue = '1 year';
    }

    const servicesChartQuery = await pool.query(`
      SELECT 
        d.name AS service_name,
        COUNT(p.id) AS project_count
      FROM 
        projekte p
        JOIN dienstleistungen d ON p.dienstleistung_id = d.id
      WHERE 
        p.created_at > NOW() - INTERVAL $1
      GROUP BY d.name
      ORDER BY project_count DESC
    `, [servicesIntervalValue]);

    // Charts-Daten formatieren
    const charts = {
      revenue: {
        labels: revenueChartQuery.rows.map(row => {
          const date = new Date(row.period);
          return format(date, revenueFormat, { locale: de });
        }),
        data: revenueChartQuery.rows.map(row => parseFloat(row.amount))
      },
      services: {
        labels: servicesChartQuery.rows.map(row => row.service_name),
        data: servicesChartQuery.rows.map(row => parseInt(row.project_count))
      }
    };

    // Anzahl neuer Anfragen für Badge
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count);

    // Aktuelle Benachrichtigungen
    const notificationsQuery = await pool.query(`
      SELECT 
        n.id, 
        n.typ, 
        n.titel, 
        n.erstellt_am, 
        n.gelesen,
        (CASE
          WHEN n.typ = 'anfrage' THEN 'envelope'
          WHEN n.typ = 'termin' THEN 'calendar-check'
          WHEN n.typ = 'auftrag' THEN 'briefcase'
          WHEN n.typ = 'warnung' THEN 'exclamation-triangle'
          ELSE 'bell'
        END) AS icon,
        (CASE
          WHEN n.typ = 'anfrage' THEN '/dashboard/anfragen/' || n.referenz_id
          WHEN n.typ = 'termin' THEN '/dashboard/termine/' || n.referenz_id
          WHEN n.typ = 'auftrag' THEN '/dashboard/auftraege/' || n.referenz_id
          ELSE '/dashboard/notifications'
        END) AS link
      FROM 
        benachrichtigungen n
      WHERE 
        n.benutzer_id = $1
      ORDER BY 
        n.erstellt_am DESC
      LIMIT 5
    `, [user.id]);

    const unreadCountQuery = await pool.query(`
      SELECT COUNT(*) FROM benachrichtigungen 
      WHERE benutzer_id = $1 AND gelesen = false
    `, [user.id]);

    const notifications = {
      items: notificationsQuery.rows.map(n => ({
        id: n.id,
        title: n.titel,
        type: n.typ === 'anfrage' ? 'success' : n.typ === 'termin' ? 'primary' : n.typ === 'warnung' ? 'warning' : 'info',
        icon: n.icon,
        time: formatDistanceToNow(new Date(n.erstellt_am), { addSuffix: true, locale: de }),
        link: n.link,
        read: n.gelesen
      })),
      unreadCount: parseInt(unreadCountQuery.rows[0].count),
      totalCount: notificationsQuery.rowCount
    };

    // Neue Kontaktanfragen
    const recentRequestsQuery = await pool.query(`
      SELECT 
        k.id, 
        k.name, 
        k.service, 
        k.created_at,
        k.status
      FROM 
        kontaktanfragen k
      ORDER BY 
        k.created_at DESC
      LIMIT 5
    `);

    const recentRequests = recentRequestsQuery.rows.map(r => ({
      id: r.id,
      name: r.name,
      serviceLabel: r.service === 'facility' ? 'Facility Management' : 
                   r.service === 'moving' ? 'Umzüge & Transporte' : 
                   r.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
      formattedDate: format(new Date(r.created_at), 'dd.MM.yyyy'),
      status: r.status === 'neu' ? 'Neu' : 
             r.status === 'in_bearbeitung' ? 'In Bearbeitung' : 
             r.status === 'beantwortet' ? 'Beantwortet' : 'Geschlossen',
      statusClass: r.status === 'neu' ? 'warning' : 
                  r.status === 'in_bearbeitung' ? 'info' : 
                  r.status === 'beantwortet' ? 'success' : 'secondary'
    }));

    // Anstehende Termine
    const upcomingAppointmentsQuery = await pool.query(`
      SELECT 
        t.id, 
        t.titel, 
        t.kunde_id, 
        t.termin_datum,
        k.name AS kunde_name
      FROM 
        termine t
        JOIN kunden k ON t.kunde_id = k.id
      WHERE 
        t.termin_datum > NOW()
      ORDER BY 
        t.termin_datum ASC
      LIMIT 5
    `);

    const upcomingAppointments = upcomingAppointmentsQuery.rows.map(a => {
      const appointmentDate = new Date(a.termin_datum);
      let dateLabel, dateClass;
      
      if (isToday(appointmentDate)) {
        dateLabel = 'Heute';
        dateClass = 'primary';
      } else if (isTomorrow(appointmentDate)) {
        dateLabel = 'Morgen';
        dateClass = 'success';
      } else {
        dateLabel = format(appointmentDate, 'dd.MM.yyyy');
        dateClass = 'secondary';
      }

      return {
        id: a.id,
        title: a.titel,
        customer: a.kunde_name,
        dateLabel: dateLabel,
        dateClass: dateClass,
        time: format(appointmentDate, 'HH:mm')
      };
    });

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
      upcomingAppointments
    });
  } catch (error) {
    console.error('Dashboard-Fehler:', error);
    res.status(500).render('error', { 
      message: 'Ein Fehler ist aufgetreten', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Weitere Dashboard-Routen...
router.get('/anfragen', isAuthenticated, (req, res) => {
  // Implementierung folgt
  res.render('dashboard/anfragen/index', { 
    title: 'Anfragen - Rising BSM',
    user: req.session.user,
    currentPath: req.path
  });
});

router.get('/kunden', isAuthenticated, (req, res) => {
  // Implementierung folgt
  res.render('dashboard/kunden/index', { 
    title: 'Kunden - Rising BSM',
    user: req.session.user,
    currentPath: req.path
  });
});

router.get('/termine', isAuthenticated, (req, res) => {
  // Implementierung folgt
  res.render('dashboard/termine/index', { 
    title: 'Termine - Rising BSM',
    user: req.session.user,
    currentPath: req.path
  });
});

router.get('/dienste', isAuthenticated, (req, res) => {
  // Implementierung folgt
  res.render('dashboard/dienste/index', { 
    title: 'Dienstleistungen - Rising BSM',
    user: req.session.user,
    currentPath: req.path
  });
});

module.exports = router;