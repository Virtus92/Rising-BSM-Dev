const express = require('express');
const router = express.Router();
const { formatDistanceToNow, isToday, isTomorrow, format } = require('date-fns');
const { de } = require('date-fns/locale');

// PostgreSQL-Verbindung importieren
const pool = require('../db');

// Auth Middleware
const isAuthenticated = (req, res, next) => {
  console.log("Session check:", req.session);
  console.log("User in session:", req.session.user);
  
  if (req.session && req.session.user) {
    return next();
  } else {
    console.log("Auth failed, redirecting to login");
    return res.redirect('/login');
  }
};

// Dashboard Hauptseite
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log("Dashboard route reached with user:", req.session.user);
    
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

    // Datenbank-Verbindung prüfen
    await pool.query('SELECT NOW()');
    console.log("Datenbankverbindung erfolgreich");

    // --- ECHTE DATENBANKABFRAGEN OHNE FALLBACKS ---
    
    // Statistiken aus der Datenbank abrufen
    let stats = {
      newRequests: { count: 0, trend: 0 },
      activeProjects: { count: 0, trend: 0 },
      totalCustomers: { count: 0, trend: 0 },
      monthlyRevenue: { amount: 0, trend: 0 }
    };
    
    // Neue Anfragen zählen
    const newRequestsQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    stats.newRequests.count = parseInt(newRequestsQuery.rows[0].count || 0);
    
    // Trend: Anzahl neue Anfragen letzte Woche im Vergleich zur Vorwoche
    const lastWeekRequestsQuery = await pool.query(`
      SELECT COUNT(*) FROM kontaktanfragen 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const previousWeekRequestsQuery = await pool.query(`
      SELECT COUNT(*) FROM kontaktanfragen 
      WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'
    `);
    
    const lastWeekCount = parseInt(lastWeekRequestsQuery.rows[0].count || 0);
    const previousWeekCount = parseInt(previousWeekRequestsQuery.rows[0].count || 0);
    
    if (previousWeekCount > 0) {
      stats.newRequests.trend = Math.round(((lastWeekCount - previousWeekCount) / previousWeekCount) * 100);
    }
    
    // Aktive Aufträge zählen
    const activeProjectsQuery = await pool.query(`
      SELECT COUNT(*) FROM auftraege WHERE status IN ('aktiv', 'in_bearbeitung')
    `);
    stats.activeProjects.count = parseInt(activeProjectsQuery.rows[0].count || 0);
    
    // Gesamtkunden zählen
    const customersQuery = await pool.query("SELECT COUNT(*) FROM kunden");
    stats.totalCustomers.count = parseInt(customersQuery.rows[0].count || 0);
    
    // Monatlicher Umsatz
    const monthlyRevenueQuery = await pool.query(`
      SELECT COALESCE(SUM(betrag), 0) as summe FROM rechnungen 
      WHERE rechnungsdatum >= DATE_TRUNC('month', CURRENT_DATE)
    `);
    stats.monthlyRevenue.amount = parseFloat(monthlyRevenueQuery.rows[0].summe || 0);

    // Chart-Daten aus Datenbank abrufen basierend auf ausgewähltem Filter
    let charts = {
      revenue: { labels: [], data: [] },
      services: { labels: [], data: [] }
    };
    
    // Revenue Chart Daten basierend auf Filter
    let revenueQuery;
    switch(revenueFilter) {
      case 'Letzten 30 Tage':
        revenueQuery = await pool.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('day', rechnungsdatum), 'DD.MM.YY') as label,
            SUM(betrag) as summe
          FROM rechnungen 
          WHERE rechnungsdatum >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY DATE_TRUNC('day', rechnungsdatum)
          ORDER BY DATE_TRUNC('day', rechnungsdatum)
        `);
        break;
      case 'Letzten 3 Monate':
        revenueQuery = await pool.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('week', rechnungsdatum), 'DD.MM.YY') as label,
            SUM(betrag) as summe
          FROM rechnungen 
          WHERE rechnungsdatum >= CURRENT_DATE - INTERVAL '3 months'
          GROUP BY DATE_TRUNC('week', rechnungsdatum)
          ORDER BY DATE_TRUNC('week', rechnungsdatum)
        `);
        break;
      case 'Dieses Jahr':
        revenueQuery = await pool.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', rechnungsdatum), 'Mon YY') as label,
            SUM(betrag) as summe
          FROM rechnungen 
          WHERE rechnungsdatum >= DATE_TRUNC('year', CURRENT_DATE)
          GROUP BY DATE_TRUNC('month', rechnungsdatum)
          ORDER BY DATE_TRUNC('month', rechnungsdatum)
        `);
        break;
      case 'Letzten 6 Monate':
      default:
        revenueQuery = await pool.query(`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', rechnungsdatum), 'Mon YY') as label,
            SUM(betrag) as summe
          FROM rechnungen 
          WHERE rechnungsdatum >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', rechnungsdatum)
          ORDER BY DATE_TRUNC('month', rechnungsdatum)
        `);
    }
    
    charts.revenue.labels = revenueQuery.rows.map(row => row.label);
    charts.revenue.data = revenueQuery.rows.map(row => parseFloat(row.summe));
    
    // Services-Verteilung nach Kategorie
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
    
    const servicesQuery = await pool.query(`
      SELECT 
        d.name as service_name,
        SUM(p.anzahl * p.einzelpreis) as summe
      FROM rechnungspositionen p
      JOIN dienstleistungen d ON p.dienstleistung_id = d.id
      JOIN rechnungen r ON p.rechnung_id = r.id
      WHERE d.name IS NOT NULL ${servicesPeriod}
      GROUP BY d.name
      ORDER BY summe DESC
      LIMIT 3
    `);
    
    charts.services.labels = servicesQuery.rows.map(row => row.service_name);
    charts.services.data = servicesQuery.rows.map(row => parseFloat(row.summe));

    // Anzahl neuer Anfragen für Badge
    const newRequestsCount = stats.newRequests.count;

    // Benachrichtigungen aus der Datenbank abrufen
    let notifications = {
      items: [],
      unreadCount: 0,
      totalCount: 0
    };

    // Prüfen, ob die Tabelle existiert
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'benachrichtigungen'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      const notificationsQuery = await pool.query(`
        SELECT 
          id, 
          typ, 
          titel, 
          erstellt_am, 
          gelesen,
          referenz_id
        FROM 
          benachrichtigungen
        WHERE 
          benutzer_id = $1
        ORDER BY 
          erstellt_am DESC
        LIMIT 5
      `, [req.session.user.id]);
      
      const unreadCountQuery = await pool.query(`
        SELECT COUNT(*) FROM benachrichtigungen 
        WHERE benutzer_id = $1 AND gelesen = false
      `, [req.session.user.id]);
      
      const totalCountQuery = await pool.query(`
        SELECT COUNT(*) FROM benachrichtigungen 
        WHERE benutzer_id = $1
      `, [req.session.user.id]);
      
      notifications = {
        items: notificationsQuery.rows.map(n => ({
          id: n.id,
          title: n.titel,
          type: n.typ === 'anfrage' ? 'success' : n.typ === 'termin' ? 'primary' : n.typ === 'warnung' ? 'warning' : 'info',
          icon: n.typ === 'anfrage' ? 'envelope' : n.typ === 'termin' ? 'calendar-check' : n.typ === 'warnung' ? 'exclamation-triangle' : 'bell',
          time: formatDistanceToNow(new Date(n.erstellt_am), { addSuffix: true, locale: de }),
          link: n.typ === 'anfrage' ? `/dashboard/anfragen/${n.referenz_id}` : 
                n.typ === 'termin' ? `/dashboard/termine/${n.referenz_id}` : 
                n.typ === 'auftrag' ? `/dashboard/auftraege/${n.referenz_id}` : 
                '/dashboard/notifications'
        })),
        unreadCount: parseInt(unreadCountQuery.rows[0].count || 0),
        totalCount: parseInt(totalCountQuery.rows[0].count || 0)
      };
    }

    // Aktuelle Anfragen aus der Datenbank
    const recentRequestsQuery = await pool.query(`
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
    `);
    
    const recentRequests = recentRequestsQuery.rows.map(anfrage => {
      return {
        id: anfrage.id,
        name: anfrage.name,
        email: anfrage.email,
        serviceLabel: anfrage.service === 'facility' ? 'Facility Management' : 
                     anfrage.service === 'moving' ? 'Umzüge & Transporte' : 
                     anfrage.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
        formattedDate: format(new Date(anfrage.created_at), 'dd.MM.yyyy'),
        status: anfrage.status === 'neu' ? 'Neu' : 
               anfrage.status === 'in_bearbeitung' ? 'In Bearbeitung' : 
               anfrage.status === 'beantwortet' ? 'Beantwortet' : 'Geschlossen',
        statusClass: anfrage.status === 'neu' ? 'warning' : 
                    anfrage.status === 'in_bearbeitung' ? 'info' : 
                    anfrage.status === 'beantwortet' ? 'success' : 'secondary'
      };
    });

    // Termine aus der Datenbank
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
    
    const upcomingAppointments = appointmentsQuery.rows.map(termin => {
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

    console.log("Rendering dashboard with data");
    
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
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

// Anfragen-Liste anzeigen
router.get('/anfragen', isAuthenticated, async (req, res) => {
  try {
    // Status-Filter anwenden (falls vorhanden)
    const statusFilter = req.query.status;
    let statusCondition = '';
    let params = [];
    
    if (statusFilter) {
      statusCondition = 'WHERE status = $1';
      params.push(statusFilter);
    }
    
    // Anfragen aus der Datenbank abrufen
    const anfragenQuery = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        service, 
        status, 
        created_at
      FROM 
        kontaktanfragen
      ${statusCondition}
      ORDER BY 
        created_at DESC
    `, params);
    
    // Abfrageergebnisse formatieren
    const requests = anfragenQuery.rows.map(anfrage => {
      return {
        id: anfrage.id,
        name: anfrage.name,
        email: anfrage.email,
        serviceLabel: anfrage.service === 'facility' ? 'Facility Management' : 
                     anfrage.service === 'moving' ? 'Umzüge & Transporte' : 
                     anfrage.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
        formattedDate: format(new Date(anfrage.created_at), 'dd.MM.yyyy'),
        status: anfrage.status === 'neu' ? 'Neu' : 
               anfrage.status === 'in_bearbeitung' ? 'In Bearbeitung' : 
               anfrage.status === 'beantwortet' ? 'Beantwortet' : 'Geschlossen',
        statusClass: anfrage.status === 'neu' ? 'warning' : 
                    anfrage.status === 'in_bearbeitung' ? 'info' : 
                    anfrage.status === 'beantwortet' ? 'success' : 'secondary'
      };
    });
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count);
    
    // Benachrichtigungen abrufen (falls vorhanden)
    let notifications = {
      items: [],
      unreadCount: 0,
      totalCount: 0
    };
    
    // Prüfen, ob die Tabelle existiert
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'benachrichtigungen'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      const notificationsQuery = await pool.query(`
        SELECT 
          id, 
          typ, 
          titel, 
          erstellt_am, 
          gelesen,
          referenz_id
        FROM 
          benachrichtigungen
        WHERE 
          benutzer_id = $1
        ORDER BY 
          erstellt_am DESC
        LIMIT 5
      `, [req.session.user.id]);
      
      const unreadCountQuery = await pool.query(`
        SELECT COUNT(*) FROM benachrichtigungen 
        WHERE benutzer_id = $1 AND gelesen = false
      `, [req.session.user.id]);
      
      notifications = {
        items: notificationsQuery.rows.map(n => ({
          id: n.id,
          title: n.titel,
          type: n.typ === 'anfrage' ? 'success' : n.typ === 'termin' ? 'primary' : n.typ === 'warnung' ? 'warning' : 'info',
          icon: n.typ === 'anfrage' ? 'envelope' : n.typ === 'termin' ? 'calendar-check' : n.typ === 'warnung' ? 'exclamation-triangle' : 'bell',
          time: formatDistanceToNow(new Date(n.erstellt_am), { addSuffix: true, locale: de }),
          link: n.typ === 'anfrage' ? `/dashboard/anfragen/${n.referenz_id}` : 
                n.typ === 'termin' ? `/dashboard/termine/${n.referenz_id}` : 
                n.typ === 'auftrag' ? `/dashboard/auftraege/${n.referenz_id}` : 
                '/dashboard/notifications',
          read: n.gelesen
        })),
        unreadCount: parseInt(unreadCountQuery.rows[0].count),
        totalCount: notificationsQuery.rowCount
      };
    }

    res.render('dashboard/anfragen/index', { 
      title: 'Anfragen - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      requests,
      notifications,
      newRequestsCount,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Fehler beim Laden der Anfragen:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

// Einzelne Anfrage anzeigen
router.get('/anfragen/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Anfrage aus der Datenbank abrufen
    const anfrageQuery = await pool.query(`
      SELECT * FROM kontaktanfragen WHERE id = $1
    `, [id]);
    
    if (anfrageQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Anfrage mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const anfrage = anfrageQuery.rows[0];
    
    // Notizen zu dieser Anfrage abrufen
    const notizenQuery = await pool.query(`
      SELECT * FROM anfragen_notizen WHERE anfrage_id = $1 ORDER BY erstellt_am DESC
    `, [id]);
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/anfragen/detail', {
      title: `Anfrage: ${anfrage.name} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/anfragen',
      anfrage: {
        id: anfrage.id,
        name: anfrage.name,
        email: anfrage.email,
        phone: anfrage.phone || 'Nicht angegeben',
        serviceLabel: anfrage.service === 'facility' ? 'Facility Management' : 
                     anfrage.service === 'moving' ? 'Umzüge & Transporte' : 
                     anfrage.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
        message: anfrage.message,
        formattedDate: format(new Date(anfrage.created_at), 'dd.MM.yyyy, HH:mm'),
        status: anfrage.status === 'neu' ? 'Neu' : 
               anfrage.status === 'in_bearbeitung' ? 'In Bearbeitung' : 
               anfrage.status === 'beantwortet' ? 'Beantwortet' : 'Geschlossen',
        statusClass: anfrage.status === 'neu' ? 'warning' : 
                    anfrage.status === 'in_bearbeitung' ? 'info' : 
                    anfrage.status === 'beantwortet' ? 'success' : 'secondary'
      },
      notizen: notizenQuery.rows.map(notiz => ({
        id: notiz.id,
        text: notiz.text,
        formattedDate: format(new Date(notiz.erstellt_am), 'dd.MM.yyyy, HH:mm'),
        benutzer: notiz.benutzer_name
      })),
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Anzeigen der Anfrage:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Anfrage Status aktualisieren
router.post('/anfragen/update-status', isAuthenticated, async (req, res) => {
  try {
    const { id, status, note } = req.body;
    
    // Status in der Datenbank aktualisieren
    await pool.query(`
      UPDATE kontaktanfragen SET status = $1, updated_at = NOW() WHERE id = $2
    `, [status, id]);
    
    // Notiz hinzufügen, falls vorhanden
    if (note && note.trim() !== '') {
      await pool.query(`
        INSERT INTO anfragen_notizen (anfrage_id, benutzer_id, benutzer_name, text)
        VALUES ($1, $2, $3, $4)
      `, [id, req.session.user.id, req.session.user.name, note]);
    }
    
    // Erfolgsmeldung und Weiterleitung
    req.flash('success', 'Status erfolgreich aktualisiert');
    res.redirect(`/dashboard/anfragen/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error);
    req.flash('error', 'Fehler: ' + error.message);
    res.redirect(`/dashboard/anfragen/${req.body.id}`);
  }
});

// Anfragen-Notiz hinzufügen
router.post('/anfragen/add-note', isAuthenticated, async (req, res) => {
  try {
    const { id, note } = req.body;
    
    if (!note || note.trim() === '') {
      req.flash('error', 'Die Notiz darf nicht leer sein.');
      return res.redirect(`/dashboard/anfragen/${id}`);
    }
    
    // In Datenbank einfügen
    await pool.query(`
      INSERT INTO anfragen_notizen (
        anfrage_id, benutzer_id, benutzer_name, text
      ) VALUES ($1, $2, $3, $4)`,
      [id, req.session.user.id, req.session.user.name, note]
    );
    
    req.flash('success', 'Notiz erfolgreich hinzugefügt.');
    res.redirect(`/dashboard/anfragen/${id}`);
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Notiz:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/anfragen/${req.body.id}`);
  }
});

// Kunden-Liste anzeigen
router.get('/kunden', isAuthenticated, async (req, res) => {
  try {
    // Kunden aus der Datenbank abrufen
    const kundenQuery = await pool.query(`
      SELECT 
        id, 
        name, 
        firma,
        email,
        telefon,
        adresse,
        plz,
        ort,
        status,
        created_at
      FROM 
        kunden
      ORDER BY 
        name ASC
    `);
    
    // Abfrageergebnisse formatieren
    const customers = kundenQuery.rows.map(kunde => ({
      id: kunde.id,
      name: kunde.name,
      firma: kunde.firma,
      email: kunde.email,
      telefon: kunde.telefon,
      adresse: kunde.adresse,
      plz: kunde.plz,
      ort: kunde.ort,
      status: kunde.status,
      created_at: format(new Date(kunde.created_at), 'dd.MM.yyyy')
    }));
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);

    res.render('dashboard/kunden/index', { 
      title: 'Kunden - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      customers,
      newRequestsCount
    });
  } catch (error) {
    console.error('Fehler beim Laden der Kunden:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

// Neuen Kunden anlegen
router.get('/kunden/neu', isAuthenticated, async (req, res) => {
  try {
    // Daten für Vorausfüllung aus Query-Parametern
    const { name, email, phone } = req.query;
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/kunden/neu', {
      title: 'Neuer Kunde - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/kunden',
      formData: {
        name: name || '',
        email: email || '',
        telefon: phone || '',
        firma: '',
        adresse: '',
        plz: '',
        ort: '',
      },
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Anzeigen des Kundenformulars:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Neuen Kunden speichern
router.post('/kunden/neu', isAuthenticated, async (req, res) => {
  try {
    const { 
      name, 
      firma, 
      email, 
      telefon, 
      adresse, 
      plz, 
      ort, 
      kundentyp, 
      status, 
      notizen, 
      newsletter 
    } = req.body;
    
    // Validierung
    if (!name || !email) {
      req.flash('error', 'Name und E-Mail sind Pfllichtfelder');