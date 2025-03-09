const express = require('express');
const router = express.Router();
const { formatDistanceToNow, isToday, isTomorrow, format } = require('date-fns');
const { de } = require('date-fns/locale');

// PostgreSQL-Verbindung importieren
const pool = require('../db');

// Auth Middleware
const isAuthenticated = (req, res, next) => {
  
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
      SELECT COUNT(*) FROM projekte WHERE status IN ('aktiv', 'in_bearbeitung')
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
    
    // Services chart data
    let servicesData = { labels: [], data: [] };
    try {
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
    } catch (error) {
      console.error('Error fetching service chart data:', error.message);
      // Provide default values or fallback
      charts.services.labels = ['Facility', 'Umzüge', 'Winterdienst'];
      charts.services.data = [0, 0, 0];
    }
    
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
                n.typ === 'auftrag' ? `/dashboard/projekte/${n.referenz_id}` : 
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
                n.typ === 'auftrag' ? `/dashboard/projekte/${n.referenz_id}` : 
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
      req.flash('error', 'Name und E-Mail sind Pflichtfelder.');
      return res.redirect('/dashboard/kunden/neu');
    }
    
    // In Datenbank einfügen
    const result = await pool.query(
      `INSERT INTO kunden (
        name, firma, email, telefon, adresse, plz, ort, 
        kundentyp, status, notizen, newsletter
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        name, 
        firma || null, 
        email, 
        telefon || null, 
        adresse || null, 
        plz || null, 
        ort || null, 
        kundentyp || 'privat', 
        status || 'aktiv', 
        notizen || null, 
        newsletter === 'on'
      ]
    );
    
    const kundeId = result.rows[0].id;
    
    req.flash('success', 'Kunde erfolgreich angelegt.');
    res.redirect(`/dashboard/kunden/${kundeId}`);
  } catch (error) {
    console.error('Fehler beim Anlegen des Kunden:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/kunden/neu');
  }
});

// Einzelnen Kunden anzeigen
router.get('/kunden/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kunde aus der Datenbank abrufen
    const kundeQuery = await pool.query(`
      SELECT * FROM kunden WHERE id = $1
    `, [id]);
    
    if (kundeQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Kunde mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const kunde = kundeQuery.rows[0];
    
    // Termine des Kunden abrufen
    const termineQuery = await pool.query(`
      SELECT id, titel, termin_datum, status 
      FROM termine 
      WHERE kunde_id = $1 
      ORDER BY termin_datum DESC
    `, [id]);
    
    // Projekte des Kunden abrufen
    const projekteQuery = await pool.query(`
      SELECT id, titel, start_datum, status 
      FROM projekte 
      WHERE kunde_id = $1 
      ORDER BY start_datum DESC
    `, [id]);
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/kunden/detail', {
      title: `Kunde: ${kunde.name} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/kunden',
      kunde: {
        id: kunde.id,
        name: kunde.name,
        firma: kunde.firma || 'Nicht angegeben',
        email: kunde.email,
        telefon: kunde.telefon || 'Nicht angegeben',
        adresse: kunde.adresse || 'Nicht angegeben',
        plz: kunde.plz || '',
        ort: kunde.ort || '',
        kundentyp: kunde.kundentyp === 'privat' ? 'Privatkunde' : 'Geschäftskunde',
        status: kunde.status,
        statusLabel: kunde.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
        statusClass: kunde.status === 'aktiv' ? 'success' : 'secondary',
        notizen: kunde.notizen || 'Keine Notizen vorhanden',
        newsletter: kunde.newsletter,
        created_at: format(new Date(kunde.created_at), 'dd.MM.yyyy')
      },
      termine: termineQuery.rows.map(termin => ({
        id: termin.id,
        titel: termin.titel,
        datum: format(new Date(termin.termin_datum), 'dd.MM.yyyy, HH:mm'),
        status: termin.status,
        statusLabel: termin.status === 'geplant' ? 'Geplant' : 
                    termin.status === 'bestaetigt' ? 'Bestätigt' : 
                    termin.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Storniert',
        statusClass: termin.status === 'geplant' ? 'warning' : 
                    termin.status === 'bestaetigt' ? 'success' : 
                    termin.status === 'abgeschlossen' ? 'primary' : 'secondary'
      })),
      projekte: projekteQuery.rows.map(projekt => ({
        id: projekt.id,
        name: projekt.name,
        datum: format(new Date(projekt.start_datum), 'dd.MM.yyyy'),
        status: projekt.status,
        statusLabel: projekt.status === 'neu' ? 'Neu' : 
                    projekt.status === 'in_bearbeitung' ? 'In Bearbeitung' : 
                    projekt.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Storniert',
        statusClass: projekt.status === 'neu' ? 'info' : 
                    projekt.status === 'in_bearbeitung' ? 'primary' : 
                    projekt.status === 'abgeschlossen' ? 'success' : 'secondary'
      })),
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Anzeigen des Kunden:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Kunden bearbeiten
router.get('/kunden/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kunde aus der Datenbank abrufen
    const kundeQuery = await pool.query(`
      SELECT * FROM kunden WHERE id = $1
    `, [id]);
    
    if (kundeQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Kunde mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const kunde = kundeQuery.rows[0];
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/kunden/edit', {
      title: `Kunde bearbeiten: ${kunde.name} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/kunden',
      kunde: kunde,
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Kunden zum Bearbeiten:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Kunden aktualisieren
router.post('/kunden/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
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
      req.flash('error', 'Name und E-Mail sind Pflichtfelder.');
      return res.redirect(`/dashboard/kunden/${id}/edit`);
    }
    
    // In Datenbank aktualisieren
    await pool.query(
      `UPDATE kunden SET 
        name = $1, 
        firma = $2, 
        email = $3, 
        telefon = $4, 
        adresse = $5, 
        plz = $6, 
        ort = $7, 
        kundentyp = $8, 
        status = $9, 
        notizen = $10, 
        newsletter = $11, 
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $12`,
      [
        name, 
        firma || null, 
        email, 
        telefon || null, 
        adresse || null, 
        plz || null, 
        ort || null, 
        kundentyp || 'privat', 
        status || 'aktiv', 
        notizen || null, 
        newsletter === 'on',
        id
      ]
    );
    
    req.flash('success', 'Kunde erfolgreich aktualisiert.');
    res.redirect(`/dashboard/kunden/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kunden:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/kunden/${req.params.id}/edit`);
  }
});

// Termine-Liste anzeigen
router.get('/termine', isAuthenticated, async (req, res) => {
  try {
    // Status-Filter anwenden (falls vorhanden)
    const statusFilter = req.query.status;
    let statusCondition = '';
    let params = [];
    
    if (statusFilter) {
      statusCondition = 'WHERE t.status = $1';
      params.push(statusFilter);
    }
    
    // Termine aus der Datenbank abrufen
    const termineQuery = await pool.query(`
      SELECT 
        t.id, 
        t.titel, 
        t.kunde_id, 
        t.projekt_id,
        t.termin_datum,
        t.dauer,
        t.ort,
        t.status,
        k.name AS kunde_name
      FROM 
        termine t
        LEFT JOIN kunden k ON t.kunde_id = k.id
      ${statusCondition}
      ORDER BY 
        t.termin_datum ASC
    `, params);
    
    // Abfrageergebnisse formatieren
    const appointments = termineQuery.rows.map(termin => {
      const datumObj = new Date(termin.termin_datum);
      const formattedDate = format(datumObj, 'dd.MM.yyyy');
      const formattedTime = format(datumObj, 'HH:mm');
      
      return {
        id: termin.id,
        titel: termin.titel,
        kunde_id: termin.kunde_id,
        kunde_name: termin.kunde_name || 'Kein Kunde zugewiesen',
        projekt_id: termin.projekt_id,
        termin_datum: termin.termin_datum,
        dateFormatted: formattedDate,
        timeFormatted: formattedTime,
        dauer: termin.dauer,
        ort: termin.ort,
        status: termin.status,
        statusLabel: termin.status === 'geplant' ? 'Geplant' : 
                    termin.status === 'bestaetigt' ? 'Bestätigt' : 
                    termin.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Storniert',
        statusClass: termin.status === 'geplant' ? 'warning' : 
                    termin.status === 'bestaetigt' ? 'success' : 
                    termin.status === 'abgeschlossen' ? 'primary' : 'secondary'
      };
    });
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);

    res.render('dashboard/termine/index', { 
      title: 'Termine - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      appointments,
      newRequestsCount,
      statusFilter: statusFilter || '',
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Fehler beim Laden der Termine:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

// Neuen Termin anlegen
router.get('/termine/neu', isAuthenticated, async (req, res) => {
  try {
    // Kunden für Dropdown abrufen
    const kundenQuery = await pool.query(`
      SELECT id, name FROM kunden ORDER BY name ASC
    `);
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    // Vorausgefüllte Daten aus Query-Parametern
    const kunde_id = req.query.kunde_id || '';
    const kunde_name = req.query.kunde_name || '';
    
    res.render('dashboard/termine/neu', {
      title: 'Neuer Termin - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/termine',
      kunden: kundenQuery.rows,
      formData: {
        kunde_id,
        kunde_name,
        titel: '',
        termin_datum: format(new Date(), 'yyyy-MM-dd'),
        termin_zeit: format(new Date(), 'HH:mm'),
        dauer: 60,
        ort: '',
        beschreibung: '',
        status: 'geplant'
      },
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Terminformulars:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Termin speichern
router.post('/termine/neu', isAuthenticated, async (req, res) => {
  try {
    const { 
      titel, 
      kunde_id, 
      termin_datum, 
      termin_zeit, 
      dauer, 
      ort, 
      beschreibung, 
      status 
    } = req.body;
    
    // Validierung
    if (!titel || !termin_datum || !termin_zeit) {
      req.flash('error', 'Titel, Datum und Uhrzeit sind Pflichtfelder.');
      return res.redirect('/dashboard/termine/neu');
    }
    
    // Datum und Uhrzeit kombinieren
    const terminDatumObj = new Date(`${termin_datum}T${termin_zeit}`);
    
    // In Datenbank einfügen
    const result = await pool.query(
      `INSERT INTO termine (
        titel, kunde_id, termin_datum, dauer, ort, 
        beschreibung, status, erstellt_von
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        titel, 
        kunde_id || null, 
        terminDatumObj, 
        dauer || 60, 
        ort || null, 
        beschreibung || null, 
        status || 'geplant',
        req.session.user.id
      ]
    );
    
    const terminId = result.rows[0].id;
    
    // Benachrichtigung erstellen, falls ein Kunde zugewiesen wurde
    if (kunde_id) {
      // Kundeninformationen abrufen
      const kundeQuery = await pool.query(`
        SELECT id, email FROM kunden WHERE id = $1
      `, [kunde_id]);
      
      if (kundeQuery.rows.length > 0 && kundeQuery.rows[0].email) {
        // Benachrichtigung in der Datenbank speichern
        await pool.query(`
          INSERT INTO benachrichtigungen (
            benutzer_id, typ, titel, beschreibung, referenz_id, gelesen
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.session.user.id,
            'termin',
            'Neuer Termin erstellt',
            `Termin "${titel}" am ${format(terminDatumObj, 'dd.MM.yyyy')} um ${format(terminDatumObj, 'HH:mm')} Uhr`,
            terminId,
            false
          ]
        );
      }
    }
    
    req.flash('success', 'Termin erfolgreich angelegt.');
    res.redirect(`/dashboard/termine/${terminId}`);
  } catch (error) {
    console.error('Fehler beim Anlegen des Termins:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/termine/neu');
  }
});

// Termin Status aktualisieren
router.post('/termine/update-status', isAuthenticated, async (req, res) => {
  try {
    const { id, status, note } = req.body;
    
    // Status in der Datenbank aktualisieren
    await pool.query(`
      UPDATE termine SET status = $1, updated_at = NOW() WHERE id = $2
    `, [status, id]);
    
    // Notiz hinzufügen, falls vorhanden
    if (note && note.trim() !== '') {
      await pool.query(`
        INSERT INTO termin_notizen (termin_id, benutzer_id, benutzer_name, text)
        VALUES ($1, $2, $3, $4)
      `, [id, req.session.user.id, req.session.user.name, note]);
    }
    
    req.flash('success', 'Termin-Status erfolgreich aktualisiert.');
    res.redirect(`/dashboard/termine/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Termin-Status:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/termine/${req.body.id}`);
  }
});


// Termin Status aktualisieren
router.post('/termine/update-status', isAuthenticated, async (req, res) => {
  try {
    const { id, status, note } = req.body;
    
    // Status in der Datenbank aktualisieren
    await pool.query(`
      UPDATE termine SET status = $1, updated_at = NOW() WHERE id = $2
    `, [status, id]);
    
    // Notiz hinzufügen, falls vorhanden
    if (note && note.trim() !== '') {
      await pool.query(`
        INSERT INTO termin_notizen (termin_id, benutzer_id, benutzer_name, text)
        VALUES ($1, $2, $3, $4)
      `, [id, req.session.user.id, req.session.user.name, note]);
    }
    
    req.flash('success', 'Termin-Status erfolgreich aktualisiert.');
    res.redirect(`/dashboard/termine/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Termin-Status:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/termine/${req.body.id}`);
  }
});

// Einzelnen Termin anzeigen
router.get('/termine/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Termin aus der Datenbank abrufen
    const terminQuery = await pool.query(`
      SELECT 
        t.*, 
        k.name AS kunde_name
      FROM 
        termine t
        LEFT JOIN kunden k ON t.kunde_id = k.id
      WHERE 
        t.id = $1
    `, [id]);
    
    if (terminQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Termin mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const termin = terminQuery.rows[0];
    
    // Notizen zu diesem Termin abrufen (falls Sie eine entsprechende Tabelle haben)
    const notizenQuery = await pool.query(`
      SELECT * FROM termin_notizen WHERE termin_id = $1 ORDER BY erstellt_am DESC
    `, [id]);
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/termine/detail', {
      title: `Termin: ${termin.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/termine',
      termin: {
        id: termin.id,
        titel: termin.titel,
        kunde_id: termin.kunde_id,
        kunde_name: termin.kunde_name || 'Kein Kunde zugewiesen',
        termin_datum: termin.termin_datum,
        dateFormatted: format(new Date(termin.termin_datum), 'dd.MM.yyyy'),
        timeFormatted: format(new Date(termin.termin_datum), 'HH:mm'),
        dauer: termin.dauer || 60,
        ort: termin.ort || 'Nicht angegeben',
        beschreibung: termin.beschreibung || 'Keine Beschreibung vorhanden',
        status: termin.status,
        statusLabel: termin.status === 'geplant' ? 'Geplant' : 
                    termin.status === 'bestaetigt' ? 'Bestätigt' : 
                    termin.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Storniert',
        statusClass: termin.status === 'geplant' ? 'warning' : 
                    termin.status === 'bestaetigt' ? 'success' : 
                    termin.status === 'abgeschlossen' ? 'primary' : 'secondary'
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
    console.error('Fehler beim Anzeigen des Termins:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Einzelnen Termin anzeigen
router.get('/termine/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Termin aus der Datenbank abrufen
    const terminQuery = await pool.query(`
      SELECT 
        t.*, 
        k.name AS kunde_name
      FROM 
        termine t
        LEFT JOIN kunden k ON t.kunde_id = k.id
      WHERE 
        t.id = $1
    `, [id]);
    
    if (terminQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Termin mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const termin = terminQuery.rows[0];
    
    // Notizen zu diesem Termin abrufen (falls Sie eine entsprechende Tabelle haben)
    const notizenQuery = await pool.query(`
      SELECT * FROM termin_notizen WHERE termin_id = $1 ORDER BY erstellt_am DESC
    `, [id]);
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/termine/detail', {
      title: `Termin: ${termin.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/termine',
      termin: {
        id: termin.id,
        titel: termin.titel,
        kunde_id: termin.kunde_id,
        kunde_name: termin.kunde_name || 'Kein Kunde zugewiesen',
        termin_datum: termin.termin_datum,
        dateFormatted: format(new Date(termin.termin_datum), 'dd.MM.yyyy'),
        timeFormatted: format(new Date(termin.termin_datum), 'HH:mm'),
        dauer: termin.dauer || 60,
        ort: termin.ort || 'Nicht angegeben',
        beschreibung: termin.beschreibung || 'Keine Beschreibung vorhanden',
        status: termin.status,
        statusLabel: termin.status === 'geplant' ? 'Geplant' : 
                    termin.status === 'bestaetigt' ? 'Bestätigt' : 
                    termin.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Storniert',
        statusClass: termin.status === 'geplant' ? 'warning' : 
                    termin.status === 'bestaetigt' ? 'success' : 
                    termin.status === 'abgeschlossen' ? 'primary' : 'secondary'
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
    console.error('Fehler beim Anzeigen des Termins:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Termin bearbeiten (Formular anzeigen)
router.get('/termine/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Termin aus der Datenbank abrufen
    const terminQuery = await pool.query(`
      SELECT 
        t.*, 
        k.name AS kunde_name
      FROM 
        termine t
        LEFT JOIN kunden k ON t.kunde_id = k.id
      WHERE 
        t.id = $1
    `, [id]);
    
    if (terminQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Termin mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const termin = terminQuery.rows[0];
    
    // Kunden für Dropdown abrufen
    const kundenQuery = await pool.query(`
      SELECT id, name FROM kunden ORDER BY name ASC
    `);
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/termine/edit', {
      title: `Termin bearbeiten: ${termin.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/termine',
      termin: {
        id: termin.id,
        titel: termin.titel,
        kunde_id: termin.kunde_id,
        kunde_name: termin.kunde_name || 'Kein Kunde zugewiesen',
        termin_datum: termin.termin_datum,
        dateFormatted: format(new Date(termin.termin_datum), 'dd.MM.yyyy'),
        timeFormatted: format(new Date(termin.termin_datum), 'HH:mm'),
        dauer: termin.dauer || 60,
        ort: termin.ort || 'Nicht angegeben',
        beschreibung: termin.beschreibung || 'Keine Beschreibung vorhanden',
        status: termin.status,
        statusLabel: termin.status === 'geplant' ? 'Geplant' : 
                    termin.status === 'bestaetigt' ? 'Bestätigt' : 
                    termin.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Storniert',
        statusClass: termin.status === 'geplant' ? 'warning' : 
                    termin.status === 'bestaetigt' ? 'success' : 
                    termin.status === 'abgeschlossen' ? 'primary' : 'secondary'
      },
      kunden: kundenQuery.rows,
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Bearbeitungsformulars:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Termin aktualisieren (POST)
router.post('/termine/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titel, 
      kunde_id, 
      termin_datum, 
      termin_zeit, 
      dauer, 
      ort, 
      beschreibung, 
      status,
      benachrichtigung
    } = req.body;
    
    // Validierung
    if (!titel || !termin_datum || !termin_zeit) {
      req.flash('error', 'Titel, Datum und Uhrzeit sind Pflichtfelder.');
      return res.redirect(`/dashboard/termine/${id}/edit`);
    }
    
    // Datum und Uhrzeit kombinieren
    const terminDatumObj = new Date(`${termin_datum}T${termin_zeit}`);
    
    // In Datenbank aktualisieren
    await pool.query(
      `UPDATE termine SET 
        titel = $1, 
        kunde_id = $2, 
        termin_datum = $3, 
        dauer = $4, 
        ort = $5, 
        beschreibung = $6, 
        status = $7, 
        updated_at = NOW() 
      WHERE id = $8`,
      [
        titel, 
        kunde_id || null, 
        terminDatumObj, 
        dauer || 60, 
        ort || null, 
        beschreibung || null, 
        status || 'geplant',
        id
      ]
    );
    
    // Notiz hinzufügen, dass der Termin aktualisiert wurde
    await pool.query(`
      INSERT INTO termin_notizen (
        termin_id, benutzer_id, benutzer_name, text
      ) VALUES ($1, $2, $3, $4)`,
      [
        id, 
        req.session.user.id, 
        req.session.user.name, 
        'Termin wurde aktualisiert.'
      ]
    );
    
    // Benachrichtigung erstellen, falls gewünscht und Kunde zugewiesen
    if (benachrichtigung && kunde_id) {
      try {
        // Hier Code für E-Mail-Benachrichtigung
        console.log('Benachrichtigung für Kunden-ID:', kunde_id);
      } catch (notifyError) {
        console.error('Fehler bei der Benachrichtigung:', notifyError);
      }
    }
    
    req.flash('success', 'Termin erfolgreich aktualisiert.');
    res.redirect(`/dashboard/termine/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Termins:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/termine/${req.params.id}/edit`);
  }
});

// Termin-Notiz hinzufügen
router.post('/termine/add-note', isAuthenticated, async (req, res) => {
  try {
    const { id, note } = req.body;
    
    if (!note || note.trim() === '') {
      req.flash('error', 'Die Notiz darf nicht leer sein.');
      return res.redirect(`/dashboard/termine/${id}`);
    }
    
    // In Datenbank einfügen
    await pool.query(`
      INSERT INTO termin_notizen (
        termin_id, benutzer_id, benutzer_name, text
      ) VALUES ($1, $2, $3, $4)`,
      [id, req.session.user.id, req.session.user.name, note]
    );
    
    req.flash('success', 'Notiz erfolgreich hinzugefügt.');
    res.redirect(`/dashboard/termine/${id}`);
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Notiz:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/termine/${req.body.id}`);
  }
});

// API Endpoint für Termine im Kalender
router.get('/termine/api/events', isAuthenticated, async (req, res) => {
  try {
    // Termine aus der Datenbank abrufen
    const termineQuery = await pool.query(`
      SELECT 
        t.id, 
        t.titel, 
        t.termin_datum,
        t.dauer,
        t.status,
        k.name AS kunde_name
      FROM 
        termine t
        LEFT JOIN kunden k ON t.kunde_id = k.id
      ORDER BY 
        t.termin_datum ASC
    `);
    
    // Termine in FullCalendar-Event-Format umwandeln
    const events = termineQuery.rows.map(termin => {
      const startDate = new Date(termin.termin_datum);
      const endDate = new Date(startDate.getTime() + (termin.dauer * 60 * 1000));
      
      let backgroundColor;
      switch(termin.status) {
        case 'geplant': backgroundColor = '#ffc107'; break; // warning
        case 'bestaetigt': backgroundColor = '#28a745'; break; // success
        case 'abgeschlossen': backgroundColor = '#0d6efd'; break; // primary
        case 'storniert': backgroundColor = '#6c757d'; break; // secondary
        default: backgroundColor = '#6c757d'; // default gray
      }
      
      return {
        id: termin.id,
        title: termin.titel + (termin.kunde_name ? ` (${termin.kunde_name})` : ''),
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: backgroundColor,
        borderColor: backgroundColor
      };
    });
    
    res.json(events);
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine für den Kalender:', error);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// Dienstleistungen-Liste anzeigen
router.get('/dienste', isAuthenticated, async (req, res) => {
  try {
    // Dienstleistungen aus der Datenbank abrufen
    const diensteQuery = await pool.query(`
      SELECT 
        id, 
        name, 
        beschreibung, 
        preis_basis, 
        einheit, 
        mwst_satz, 
        aktiv
      FROM 
        dienstleistungen
      ORDER BY 
        name ASC
    `);
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);

    res.render('dashboard/dienste/index', { 
      title: 'Dienstleistungen - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      services: diensteQuery.rows,
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Dienstleistungen:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

// Einzelne Dienstleistung abrufen (für Edit-Modal)
router.get('/dienste/:id', isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query('SELECT * FROM dienstleistungen WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dienstleistung nicht gefunden' });
    }
    
    res.json({ success: true, service: result.rows[0] });
  } catch (error) {
    console.error('Fehler beim Abrufen der Dienstleistung:', error);
    res.status(500).json({ success: false, error: 'Datenbankfehler: ' + error.message });
  }
});

// Neue Dienstleistung erstellen
router.post('/dienste/neu', isAuthenticated, async (req, res) => {
  try {
    const { name, beschreibung, preis_basis, einheit, mwst_satz, aktiv } = req.body;
    
    // Validierung
    if (!name || !preis_basis || !einheit) {
      req.flash('error', 'Bitte füllen Sie alle erforderlichen Felder aus.');
      return res.redirect('/dashboard/dienste');
    }
    
    // In Datenbank einfügen
    await pool.query(
      'INSERT INTO dienstleistungen (name, beschreibung, preis_basis, einheit, mwst_satz, aktiv) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, beschreibung, preis_basis, einheit, mwst_satz, aktiv === 'on']
    );
    
    req.flash('success', 'Dienstleistung erfolgreich erstellt.');
    res.redirect('/dashboard/dienste');
  } catch (error) {
    console.error('Fehler beim Erstellen der Dienstleistung:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/dienste');
  }
});

// Dienstleistung bearbeiten
router.post('/dienste/edit', isAuthenticated, async (req, res) => {
  try {
    const { id, name, beschreibung, preis_basis, einheit, mwst_satz, aktiv } = req.body;
    
    // Validierung
    if (!id || !name || !preis_basis || !einheit) {
      req.flash('error', 'Bitte füllen Sie alle erforderlichen Felder aus.');
      return res.redirect('/dashboard/dienste');
    }
    
    // In Datenbank aktualisieren
    await pool.query(
      'UPDATE dienstleistungen SET name = $1, beschreibung = $2, preis_basis = $3, einheit = $4, mwst_satz = $5, aktiv = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
      [name, beschreibung, preis_basis, einheit, mwst_satz, aktiv === 'on', id]
    );
    
    req.flash('success', 'Dienstleistung erfolgreich aktualisiert.');
    res.redirect('/dashboard/dienste');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Dienstleistung:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/dienste');
  }
});

// Dienstleistung Status ändern
router.post('/dienste/toggle-status/:id', isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { aktiv } = req.body;
    
    await pool.query(
      'UPDATE dienstleistungen SET aktiv = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [aktiv, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Dienstleistungs-Status:', error);
    res.status(500).json({ success: false, error: 'Datenbankfehler: ' + error.message });
  }
});

// Settings-Seite
router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    // Benutzereinstellungen aus der Datenbank abrufen
    const settingsQuery = await pool.query(`
      SELECT * FROM benutzer_einstellungen WHERE benutzer_id = $1
    `, [req.session.user.id]);
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/settings', {
      title: 'Einstellungen - Rising BSM',
      user: req.session.user,
      settings: settingsQuery.rows.length > 0 ? settingsQuery.rows[0] : {
        benachrichtigungen_email: true,
        dark_mode: false,
        sprache: 'de'
      },
      currentPath: '/dashboard/settings',
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Benutzereinstellungen aktualisieren
router.post('/settings/update', isAuthenticated, async (req, res) => {
  try {
    const { category, sprache, dark_mode, benachrichtigungen_email, benachrichtigungen_intervall } = req.body;
    
    // Prüfen, ob bereits Einstellungen für diesen Benutzer vorhanden sind
    const existingSettings = await pool.query(
      'SELECT * FROM benutzer_einstellungen WHERE benutzer_id = $1',
      [req.session.user.id]
    );
    
    if (existingSettings.rows.length > 0) {
      // Aktualisieren der vorhandenen Einstellungen
      await pool.query(
        `UPDATE benutzer_einstellungen SET 
          sprache = $1, 
          dark_mode = $2, 
          benachrichtigungen_email = $3, 
          benachrichtigungen_intervall = $4, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE benutzer_id = $5`,
        [
          sprache || 'de', 
          dark_mode === 'on', 
          benachrichtigungen_email === 'on', 
          benachrichtigungen_intervall || 'sofort',
          req.session.user.id
        ]
      );
    } else {
      // Neue Einstellungen anlegen
      await pool.query(
        `INSERT INTO benutzer_einstellungen (
          benutzer_id, sprache, dark_mode, benachrichtigungen_email, benachrichtigungen_intervall
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          req.session.user.id,
          sprache || 'de', 
          dark_mode === 'on', 
          benachrichtigungen_email === 'on', 
          benachrichtigungen_intervall || 'sofort'
        ]
      );
    }
    
    req.flash('success', 'Einstellungen erfolgreich gespeichert.');
    res.redirect('/dashboard/settings');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/settings');
  }
});

function safeFormat(date, formatString) {
  try {
    return format(new Date(date), formatString);
  } catch (error) {
    console.error('Invalid date format:', date, error);
    return 'Unbekannt';
  }
}

// Profile-Seite
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // Benutzerinformationen aus der Datenbank abrufen
    const userQuery = await pool.query(`
      SELECT * FROM benutzer WHERE id = $1
    `, [req.session.user.id]);
    
    if (userQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: 'Benutzerprofil nicht gefunden',
        error: { status: 404 }
      });
    }
    
    const user = userQuery.rows[0];
    
    // Neue Anfragen für Badge zählen
    const newRequestsCountQuery = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    const newRequestsCount = parseInt(newRequestsCountQuery.rows[0].count || 0);
    
    res.render('dashboard/profile', {
      title: 'Mein Profil - Rising BSM',
      user: req.session.user,
      userProfile: {
        id: user.id,
        name: user.name,
        email: user.email,
        rolle: user.rolle,
        telefon: user.telefon || '',
        erstelltAm: safeFormat(user.created_at, 'dd.MM.yyyy'),
      },
      currentPath: '/dashboard/profile',
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Profils:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Benutzerprofil aktualisieren
router.post('/profile/update', isAuthenticated, async (req, res) => {
  try {
    const { name, email, telefon, current_password, new_password, new_password_confirm } = req.body;
    
    // Validierung
    if (!name || !email) {
      req.flash('error', 'Name und E-Mail-Adresse sind Pflichtfelder.');
      return res.redirect('/dashboard/profile');
    }
    
    // Passwort ändern, falls angegeben
    if (current_password && new_password && new_password_confirm) {
      // Prüfen, ob Passwörter übereinstimmen
      if (new_password !== new_password_confirm) {
        req.flash('error', 'Die neuen Passwörter stimmen nicht überein.');
        return res.redirect('/dashboard/profile');
      }
      
      // Prüfen, ob aktuelles Passwort korrekt ist
      const userQuery = await pool.query('SELECT passwort FROM benutzer WHERE id = $1', [req.session.user.id]);
      const currentHashedPassword = userQuery.rows[0].passwort;
      
      const passwordMatches = await bcrypt.compare(current_password, currentHashedPassword);
      if (!passwordMatches) {
        req.flash('error', 'Das aktuelle Passwort ist nicht korrekt.');
        return res.redirect('/dashboard/profile');
      }
      
      // Neues Passwort hashen
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      
      // Benutzerdaten mit neuem Passwort aktualisieren
      await pool.query(
        'UPDATE benutzer SET name = $1, email = $2, telefon = $3, passwort = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [name, email, telefon || null, hashedPassword, req.session.user.id]
      );
    } else {
      // Benutzerdaten ohne Passwortänderung aktualisieren
      await pool.query(
        'UPDATE benutzer SET name = $1, email = $2, telefon = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [name, email, telefon || null, req.session.user.id]
      );
    }
    
    // Sitzungsdaten aktualisieren
    req.session.user.name = name;
    req.session.user.email = email;
    req.session.user.initials = name.split(' ').map(n => n[0]).join('');
    
    req.flash('success', 'Profil erfolgreich aktualisiert.');
    res.redirect('/dashboard/profile');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/profile');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout-Fehler:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;