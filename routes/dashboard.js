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

    // Testen, ob die Datenbank verfügbar ist
    try {
      await pool.query('SELECT NOW()');
      console.log("Datenbankverbindung erfolgreich");
    } catch (dbError) {
      console.error("Datenbankfehler:", dbError);
      throw new Error("Datenbankverbindung fehlgeschlagen");
    }

    // Für den Debug-Modus: Prüfe, ob kontaktanfragen existiert
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'kontaktanfragen'
        );
      `);
      console.log("Kontaktanfragen table exists:", tableCheck.rows[0].exists);
      
      // Wenn Tabelle existiert, Struktur prüfen
      if (tableCheck.rows[0].exists) {
        const columnCheck = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'kontaktanfragen';
        `);
        console.log("Kontaktanfragen columns:", columnCheck.rows);
      }
    } catch (tableError) {
      console.error("Fehler beim Tabellen-Check:", tableError);
    }

    // --- MOCK-DATEN FÜR DIE ENTWICKLUNG ---
    
    // Mock-Statistiken
    const stats = {
      newRequests: {
        count: 8,
        trend: 12
      },
      activeProjects: {
        count: 15,
        trend: 8
      },
      totalCustomers: {
        count: 67,
        trend: 24
      },
      monthlyRevenue: {
        amount: 12586,
        trend: 18
      }
    };

    // Mock-Charts
    const charts = {
      revenue: {
        labels: ['Okt 24', 'Nov 24', 'Dez 24', 'Jan 25', 'Feb 25', 'Mär 25'],
        data: [8200, 9100, 10500, 11800, 10900, 12600]
      },
      services: {
        labels: ['Facility Management', 'Umzüge & Transporte', 'Winterdienst'],
        data: [42, 28, 30]
      }
    };

    // Anzahl neuer Anfragen
    const newRequestsCount = 5;

    // Mock-Benachrichtigungen
    const notifications = {
      items: [
        {
          id: 1,
          title: 'Neue Kontaktanfrage',
          type: 'success',
          icon: 'envelope',
          time: 'vor 5 Minuten',
          link: '/dashboard/anfragen/15'
        },
        {
          id: 2,
          title: 'Neuer Termin bestätigt',
          type: 'primary',
          icon: 'calendar-check',
          time: 'vor 2 Stunden',
          link: '/dashboard/termine/8'
        },
        {
          id: 3,
          title: 'Auftrag benötigt Aufmerksamkeit',
          type: 'warning',
          icon: 'exclamation-triangle',
          time: 'vor 1 Tag',
          link: '/dashboard/auftraege/23'
        }
      ],
      unreadCount: 3,
      totalCount: 12
    };

    // Mock-Anfragen
    const recentRequests = [
      {
        id: 15,
        name: 'Maria Schmidt',
        serviceLabel: 'Facility Management',
        formattedDate: '08.03.2025',
        status: 'Neu',
        statusClass: 'warning'
      },
      {
        id: 14,
        name: 'Thomas Huber',
        serviceLabel: 'Umzüge & Transporte',
        formattedDate: '07.03.2025',
        status: 'In Bearbeitung',
        statusClass: 'info'
      },
      {
        id: 13,
        name: 'Julia Meyer',
        serviceLabel: 'Winterdienst',
        formattedDate: '06.03.2025',
        status: 'Beantwortet',
        statusClass: 'success'
      },
      {
        id: 12,
        name: 'Peter Wagner',
        serviceLabel: 'Facility Management',
        formattedDate: '05.03.2025',
        status: 'In Bearbeitung',
        statusClass: 'info'
      },
      {
        id: 11,
        name: 'Lisa Bauer',
        serviceLabel: 'Umzüge & Transporte',
        formattedDate: '04.03.2025',
        status: 'Beantwortet',
        statusClass: 'success'
      }
    ];

    // Mock-Termine
    const upcomingAppointments = [
      {
        id: 8,
        title: 'Baustellenbesichtigung',
        customer: 'Schmidt & Partner GmbH',
        dateLabel: 'Heute',
        dateClass: 'primary',
        time: '14:30'
      },
      {
        id: 9,
        title: 'Umzugsplanung',
        customer: 'Familie Müller',
        dateLabel: 'Morgen',
        dateClass: 'success',
        time: '10:00'
      },
      {
        id: 10,
        title: 'Routineinspektion',
        customer: 'Wohnanlage Sonnenhof',
        dateLabel: '09.03.2025',
        dateClass: 'secondary',
        time: '09:00'
      },
      {
        id: 11,
        title: 'Vertragsbesprechung',
        customer: 'Bürogebäude Zentrum',
        dateLabel: '10.03.2025',
        dateClass: 'secondary',
        time: '13:00'
      },
      {
        id: 12,
        title: 'Wartungsarbeiten',
        customer: 'Logistikzentrum Nord',
        dateLabel: '11.03.2025',
        dateClass: 'secondary',
        time: '08:30'
      }
    ];

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
      message: 'Ein Fehler ist aufgetreten', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Weitere Dashboard-Routen...
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
    
    try {
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
    } catch (notifError) {
      console.log('Benachrichtigungen nicht verfügbar:', notifError.message);
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
      message: 'Ein Fehler ist aufgetreten', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

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
      message: 'Ein Fehler ist aufgetreten', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

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
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Fehler beim Laden der Termine:', error);
    res.status(500).render('error', { 
      message: 'Ein Fehler ist aufgetreten', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

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
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Fehler beim Laden der Dienstleistungen:', error);
    res.status(500).render('error', { 
      message: 'Ein Fehler ist aufgetreten', 
      error: process.env.NODE_ENV === 'development' ? error : {}
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
    res.status(500).json({ success: false, error: 'Datenbank-Fehler' });
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
    req.flash('error', 'Fehler beim Erstellen der Dienstleistung.');
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
    req.flash('error', 'Fehler beim Aktualisieren der Dienstleistung.');
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
    res.status(500).json({ success: false, error: 'Datenbank-Fehler' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout-Fehler:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;