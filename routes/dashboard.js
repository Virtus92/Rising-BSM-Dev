const express = require('express');
const router = express.Router();
const { formatDistanceToNow, isToday, isTomorrow, format } = require('date-fns');
const { de } = require('date-fns/locale');
const bcrypt = require('bcrypt'); // Import bcrypt

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

// Hilfsfunktionen

/**
 * Führt eine Datenbankabfrage aus und gibt die Anzahl zurück.
 * @param {string} query - Die SQL-Abfrage.
 * @param {array} params - Parameter für die SQL-Abfrage.
 * @returns {number} - Die Anzahl aus der Datenbank.
 */
async function getCountFromDB(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count || 0, 10);
  } catch (error) {
    console.error('Fehler beim Abrufen der Anzahl aus der Datenbank:', error);
    return 0;
  }
}

/**
 * Formatiert ein Datum sicher in ein lesbares Format.
 * @param {string|Date} date - Das zu formatierende Datum.
 * @param {string} formatString - Das Format, in das das Datum umgewandelt werden soll.
 * @returns {string} - Das formatierte Datum oder 'Unbekannt', wenn ein Fehler auftritt.
 */
function formatDateSafely(date, formatString) {
  try {
    if (!date) return 'Unbekannt';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      console.error(`Ungültiges Datumsformat für Datum: ${date} mit Format: ${formatString}`);
      return 'Ungültiges Datum';
    }
    return format(parsedDate, formatString);
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error);
    return 'Unbekannt';
  }
}

/**
 * Generiert Statusinformationen für eine Anfrage.
 * @param {string} status - Der Status der Anfrage.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
function getAnfrageStatusInfo(status) {
  switch (status) {
    case 'neu':
      return { label: 'Neu', className: 'warning' };
    case 'in_bearbeitung':
      return { label: 'In Bearbeitung', className: 'info' };
    case 'beantwortet':
      return { label: 'Beantwortet', className: 'success' };
    default:
      return { label: 'Geschlossen', className: 'secondary' };
  }
}

/**
 * Generiert Statusinformationen für einen Termin.
 * @param {string} status - Der Status des Termins.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
function getTerminStatusInfo(status) {
  switch (status) {
    case 'geplant':
      return { label: 'Geplant', className: 'warning' };
    case 'bestaetigt':
      return { label: 'Bestätigt', className: 'success' };
    case 'abgeschlossen':
      return { label: 'Abgeschlossen', className: 'primary' };
    default:
      return { label: 'Storniert', className: 'secondary' };
  }
}

/**
 * Generiert Statusinformationen für ein Projekt.
 * @param {string} status - Der Status des Projekts.
 * @returns {object} - Ein Objekt mit Statuslabel und -klasse.
 */
function getProjektStatusInfo(status) {
  switch (status) {
    case 'neu':
      return { label: 'Neu', className: 'info' };
    case 'in_bearbeitung':
      return { label: 'In Bearbeitung', className: 'primary' };
    case 'abgeschlossen':
      return { label: 'Abgeschlossen', className: 'success' };
    default:
      return { label: 'Storniert', className: 'secondary' };
  }
}

/**
 * Ruft Benachrichtigungen aus der Datenbank ab.
 * @param {object} req - Das Request-Objekt von Express.
 * @returns {object} - Ein Objekt mit Benachrichtigungselementen, ungelesener Anzahl und Gesamtanzahl.
 */
async function getNotifications(req) {
  try {
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

    const unreadCount = await getCountFromDB(
      `SELECT COUNT(*) FROM benachrichtigungen WHERE benutzer_id = $1 AND gelesen = false`,
      [req.session.user.id]
    );

    const totalCount = await getCountFromDB(
      `SELECT COUNT(*) FROM benachrichtigungen WHERE benutzer_id = $1`,
      [req.session.user.id]
    );

    return {
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
      unreadCount: unreadCount,
      totalCount: totalCount
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
    return { items: [], unreadCount: 0, totalCount: 0 };
  }
}

// Middleware to get new requests count
const getNewRequestsCountMiddleware = async (req, res, next) => {
  try {
    req.newRequestsCount = await getCountFromDB("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    next();
  } catch (error) {
    console.error('Error fetching new requests count:', error);
    req.newRequestsCount = 0; // Default value in case of error
    next();
  }
};

// Apply middleware to all routes that need it
router.use(getNewRequestsCountMiddleware);

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
    stats.newRequests.count = await getCountFromDB("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");

    // Trend: Anzahl neue Anfragen letzte Woche im Vergleich zur Vorwoche
    const lastWeekRequestsCount = await getCountFromDB(`
      SELECT COUNT(*) FROM kontaktanfragen
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const previousWeekRequestsCount = await getCountFromDB(`
      SELECT COUNT(*) FROM kontaktanfragen
      WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'
    `);

    if (previousWeekRequestsCount > 0) {
      stats.newRequests.trend = Math.round(((lastWeekRequestsCount - previousWeekRequestsCount) / previousWeekRequestsCount) * 100);
    }

    // Aktive Aufträge zählen
    stats.activeProjects.count = await getCountFromDB(`
      SELECT COUNT(*) FROM projekte WHERE status IN ('aktiv', 'in_bearbeitung')
    `);

    // Gesamtkunden zählen
    stats.totalCustomers.count = await getCountFromDB("SELECT COUNT(*) FROM kunden");

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
        revenueQuery = await pool.query({
          text: `
            SELECT 
              TO_CHAR(DATE_TRUNC('day', rechnungsdatum), 'DD.MM.YY') as label,
              SUM(betrag) as summe
            FROM rechnungen 
            WHERE rechnungsdatum >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE_TRUNC('day', rechnungsdatum)
            ORDER BY DATE_TRUNC('day', rechnungsdatum)
          `
        });
        break;
      case 'Letzten 3 Monate':
        revenueQuery = await pool.query({
          text: `
            SELECT 
              TO_CHAR(DATE_TRUNC('week', rechnungsdatum), 'DD.MM.YY') as label,
              SUM(betrag) as summe
            FROM rechnungen 
            WHERE rechnungsdatum >= CURRENT_DATE - INTERVAL '3 months'
            GROUP BY DATE_TRUNC('week', rechnungsdatum)
            ORDER BY DATE_TRUNC('week', rechnungsdatum)
          `
        });
        break;
      case 'Dieses Jahr':
        revenueQuery = await pool.query({
          text: `
            SELECT 
              TO_CHAR(DATE_TRUNC('month', rechnungsdatum), 'Mon YY') as label,
              SUM(betrag) as summe
            FROM rechnungen 
            WHERE rechnungsdatum >= DATE_TRUNC('year', CURRENT_DATE)
            GROUP BY DATE_TRUNC('month', rechnungsdatum)
            ORDER BY DATE_TRUNC('month', rechnungsdatum)
          `
        });
        break;
      case 'Letzten 6 Monate':
      default:
        revenueQuery = await pool.query({
          text: `
            SELECT 
              TO_CHAR(DATE_TRUNC('month', rechnungsdatum), 'Mon YY') as label,
              SUM(betrag) as summe
            FROM rechnungen 
            WHERE rechnungsdatum >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', rechnungsdatum)
            ORDER BY DATE_TRUNC('month', rechnungsdatum)
          `
        });
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
    const newRequestsCount = req.newRequestsCount;

    // Benachrichtigungen aus der Datenbank abrufen
    const notifications = await getNotifications(req);

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
      newRequestsCount: req.newRequestsCount,
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
    const anfragenQuery = await pool.query({
      text: `
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
      `,
      values: params
    });
    
    // Abfrageergebnisse formatieren
    const requests = anfragenQuery.rows.map(anfrage => {
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
    
    // Benachrichtigungen abrufen (falls vorhanden)
    const notifications = await getNotifications(req);

    res.render('dashboard/anfragen/index', { 
      title: 'Anfragen - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      requests,
      notifications,
      newRequestsCount: req.newRequestsCount,
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

// Projekt Status aktualisieren
router.post('/projekte/:id/update-status', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    // Status in der Datenbank aktualisieren
    await pool.query({
      text: `UPDATE projekte SET status = $1, updated_at = NOW() WHERE id = $2`,
      values: [status, id]
    });
    
    // Notiz hinzufügen, falls vorhanden
    if (note && note.trim() !== '') {
      await pool.query({
        text: `
          INSERT INTO projekt_notizen (projekt_id, benutzer_id, benutzer_name, text)
          VALUES ($1, $2, $3, $4)
        `,
        values: [id, req.session.user.id, req.session.user.name, note]
      });
    }
    
    req.flash('success', 'Projekt-Status erfolgreich aktualisiert.');
    res.redirect(`/dashboard/projekte/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Projekt-Status:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/projekte/${req.params.id}`);
  }
});

// Projekt-Notiz hinzufügen
router.post('/projekte/:id/add-note', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    if (!note || note.trim() === '') {
      req.flash('error', 'Die Notiz darf nicht leer sein.');
      return res.redirect(`/dashboard/projekte/${id}`);
    }
    
    // In Datenbank einfügen
    await pool.query({
      text: `
        INSERT INTO projekt_notizen (
          projekt_id, benutzer_id, benutzer_name, text
        ) VALUES ($1, $2, $3, $4)
      `,
      values: [id, req.session.user.id, req.session.user.name, note]
    });
    
    req.flash('success', 'Notiz erfolgreich hinzugefügt.');
    res.redirect(`/dashboard/projekte/${id}`);
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Notiz:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/projekte/${req.params.id}`);
  }
});

// In routes/dashboard.js
router.get('/anfragen/export', isAuthenticated, async (req, res) => {
  try {
    const { format: exportFormat, dateFrom, dateTo, status } = req.query;
    
    // Filterbedingungen aufbauen
    let conditions = [];
    let params = [];
    let paramCounter = 1;
    
    if (dateFrom) {
      conditions.push(`created_at >= $${paramCounter++}`);
      params.push(dateFrom);
    }
    
    if (dateTo) {
      conditions.push(`created_at <= $${paramCounter++}`);
      params.push(dateTo);
    }
    
    if (status && Array.isArray(status)) {
      conditions.push(`status IN (${status.map((_, i) => `$${paramCounter + i}`).join(', ')})`);
      params.push(...status);
      paramCounter += status.length;
    } else if (status) {
      conditions.push(`status = $${paramCounter++}`);
      params.push(status);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Daten abrufen
    const query = {
      text: `
        SELECT 
          id, 
          name, 
          email, 
          phone, 
          service, 
          message, 
          status, 
          created_at
        FROM 
          kontaktanfragen
        ${whereClause}
        ORDER BY 
          created_at DESC
      `,
      values: params
    };
    
    const result = await pool.query(query);
    
    // Format basierte Verarbeitung
    if (exportFormat === 'csv') {
      // CSV-Export
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=anfragen-export.csv');
      
      // CSV-Header
      res.write('ID,Name,Email,Telefon,Service,Nachricht,Status,Datum\n');
      
      // CSV-Zeilen
      result.rows.forEach(row => {
        const csvLine = [
          row.id,
          `"${row.name.replace(/"/g, '""')}"`,
          `"${row.email.replace(/"/g, '""')}"`,
          `"${row.phone || ''}"`,
          `"${row.service}"`,
          `"${(row.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${row.status}"`,
          `"${format(new Date(row.created_at), 'dd.MM.yyyy HH:mm')}"`
        ].join(',');
        
        res.write(csvLine + '\n');
      });
      
      res.end();
    } else if (exportFormat === 'pdf') {
      // PDF-Export mit PDFKit
      const PDFDocument = require('pdfkit');
      
      // Erstellen eines neuen PDF-Dokuments
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4'
      });
      
      // PDF-Header-Metadaten setzen
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=anfragen-export.pdf');
      
      // PDF als Stream an die Response weiterleiten
      doc.pipe(res);
      
      // PDF-Inhalt erstellen
      doc.fontSize(16).text('Anfragen-Export', { align: 'center' });
      doc.moveDown();
      
      // Filter-Informationen
      doc.fontSize(10).text(`Exportiert am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`);
      if (dateFrom) doc.text(`Von: ${dateFrom}`);
      if (dateTo) doc.text(`Bis: ${dateTo}`);
      if (status) {
        const statusLabels = Array.isArray(status) 
          ? status.map(s => getAnfrageStatusInfo(s).label).join(', ')
          : getAnfrageStatusInfo(status).label;
        doc.text(`Status: ${statusLabels}`);
      }
      
      doc.moveDown();
      
      // Tabellen-Header
      doc.fontSize(12);
      const tableHeaders = ['ID', 'Name', 'E-Mail', 'Datum', 'Service', 'Status'];
      let currentY = doc.y;
      
      // Header-Hintergrund
      doc.rect(50, currentY, 500, 20).fill('#f0f0f0');
      doc.fillColor('#000000');
      
      // Header-Texte
      let currentX = 50;
      const columnWidths = [40, 100, 120, 80, 80, 80];
      
      tableHeaders.forEach((header, i) => {
        doc.text(header, currentX, currentY + 5, { width: columnWidths[i], align: 'left' });
        currentX += columnWidths[i];
      });
      
      currentY += 25;
      
      // Zeilen
      result.rows.forEach((row, rowIndex) => {
        // Zeilen abwechselnd einfärben
        if (rowIndex % 2 === 0) {
          doc.rect(50, currentY - 5, 500, 20).fill('#f9f9f9');
          doc.fillColor('#000000');
        }
        
        // Seitenumbruch prüfen
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        currentX = 50;
        doc.fontSize(10);
        
        // Zellen-Inhalte
        doc.text(row.id.toString(), currentX, currentY, { width: columnWidths[0] });
        currentX += columnWidths[0];
        
        doc.text(row.name, currentX, currentY, { width: columnWidths[1] });
        currentX += columnWidths[1];
        
        doc.text(row.email, currentX, currentY, { width: columnWidths[2] });
        currentX += columnWidths[2];
        
        doc.text(format(new Date(row.created_at), 'dd.MM.yyyy'), currentX, currentY, { width: columnWidths[3] });
        currentX += columnWidths[3];
        
        let serviceLabel = '';
        switch(row.service) {
          case 'facility': serviceLabel = 'Facility'; break;
          case 'moving': serviceLabel = 'Umzüge'; break;
          case 'winter': serviceLabel = 'Winterdienst'; break;
          default: serviceLabel = row.service;
        }
        doc.text(serviceLabel, currentX, currentY, { width: columnWidths[4] });
        currentX += columnWidths[4];
        
        const statusInfo = getAnfrageStatusInfo(row.status);
        doc.text(statusInfo.label, currentX, currentY, { width: columnWidths[5] });
        
        currentY += 20;
      });
      
      // PDF finalisieren
      doc.end();
    } else if (exportFormat === 'excel') {
      // Excel-Export
      const Excel = require('exceljs');
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet('Anfragen');
      
      // Spalten definieren
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'E-Mail', key: 'email', width: 30 },
        { header: 'Telefon', key: 'phone', width: 15 },
        { header: 'Service', key: 'service', width: 15 },
        { header: 'Nachricht', key: 'message', width: 50 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Datum', key: 'date', width: 15 }
      ];
      
      // Zeilen hinzufügen
      result.rows.forEach(row => {
        worksheet.addRow({
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone || '',
          service: row.service,
          message: row.message || '',
          status: getAnfrageStatusInfo(row.status).label,
          date: format(new Date(row.created_at), 'dd.MM.yyyy HH:mm')
        });
      });
      
      // Header-Stil
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Excel-Datei an Browser senden
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=anfragen-export.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Standard-Antwort bei unbekanntem Format
      res.json({ 
        success: true, 
        message: 'Export verfügbar', 
        format: exportFormat,
        count: result.rows.length
      });
    }
  } catch (error) {
    console.error('Fehler beim Exportieren der Anfragen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Datenbankfehler: ' + error.message 
    });
  }
});

// In routes/dashboard.js
router.get('/anfragen/export', isAuthenticated, async (req, res) => {
  try {
    const { format: exportFormat, dateFrom, dateTo, status } = req.query;
    
    // Filterbedingungen aufbauen
    let conditions = [];
    let params = [];
    let paramCounter = 1;
    
    if (dateFrom) {
      conditions.push(`created_at >= $${paramCounter++}`);
      params.push(dateFrom);
    }
    
    if (dateTo) {
      conditions.push(`created_at <= $${paramCounter++}`);
      params.push(dateTo);
    }
    
    if (status && Array.isArray(status)) {
      conditions.push(`status IN (${status.map((_, i) => `$${paramCounter + i}`).join(', ')})`);
      params.push(...status);
      paramCounter += status.length;
    } else if (status) {
      conditions.push(`status = $${paramCounter++}`);
      params.push(status);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Daten abrufen
    const query = {
      text: `
        SELECT 
          id, 
          name, 
          email, 
          phone, 
          service, 
          message, 
          status, 
          created_at
        FROM 
          kontaktanfragen
        ${whereClause}
        ORDER BY 
          created_at DESC
      `,
      values: params
    };
    
    const result = await pool.query(query);
    
    // Format basierte Verarbeitung
    if (exportFormat === 'csv') {
      // CSV-Export
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=anfragen-export.csv');
      
      // CSV-Header
      res.write('ID,Name,Email,Telefon,Service,Nachricht,Status,Datum\n');
      
      // CSV-Zeilen
      result.rows.forEach(row => {
        const csvLine = [
          row.id,
          `"${row.name.replace(/"/g, '""')}"`,
          `"${row.email.replace(/"/g, '""')}"`,
          `"${row.phone || ''}"`,
          `"${row.service}"`,
          `"${(row.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${row.status}"`,
          `"${format(new Date(row.created_at), 'dd.MM.yyyy HH:mm')}"`
        ].join(',');
        
        res.write(csvLine + '\n');
      });
      
      res.end();
    } else {
      // Standard-Antwort bei unbekanntem Format
      res.json({ 
        success: true, 
        message: 'Export verfügbar', 
        format: exportFormat,
        count: result.rows.length
      });
    }
  } catch (error) {
    console.error('Fehler beim Exportieren der Anfragen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Datenbankfehler: ' + error.message 
    });
  }
});

// Einzelne Anfrage anzeigen
router.get('/anfragen/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Anfrage aus der Datenbank abrufen
    const anfrageQuery = await pool.query({
      text: `SELECT * FROM kontaktanfragen WHERE id = $1`,
      values: [id]
    });
    
    if (anfrageQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Anfrage mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const anfrage = anfrageQuery.rows[0];
    const statusInfo = getAnfrageStatusInfo(anfrage.status);

    // Notizen zu dieser Anfrage abrufen
    const notizenQuery = await pool.query({
      text: `SELECT * FROM anfragen_notizen WHERE anfrage_id = $1 ORDER BY erstellt_am DESC`,
      values: [id]
    });
    
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
        formattedDate: formatDateSafely(anfrage.created_at, 'dd.MM.yyyy, HH:mm'),
        status: statusInfo.label,
        statusClass: statusInfo.className
      },
      notizen: notizenQuery.rows.map(notiz => ({
        id: notiz.id,
        text: notiz.text,
        formattedDate: formatDateSafely(notiz.erstellt_am, 'dd.MM.yyyy, HH:mm'),
        benutzer: notiz.benutzer_name
      })),
      newRequestsCount: req.newRequestsCount,
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
    await pool.query({
      text: `UPDATE kontaktanfragen SET status = $1, updated_at = NOW() WHERE id = $2`,
      values: [status, id]
    });
    
    // Notiz hinzufügen, falls vorhanden
    if (note && note.trim() !== '') {
      await pool.query({
        text: `
          INSERT INTO anfragen_notizen (anfrage_id, benutzer_id, benutzer_name, text)
          VALUES ($1, $2, $3, $4)
        `,
        values: [id, req.session.user.id, req.session.user.name, note]
      });
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
    await pool.query({
      text: `
        INSERT INTO anfragen_notizen (
          anfrage_id, benutzer_id, benutzer_name, text
        ) VALUES ($1, $2, $3, $4)
      `,
      values: [id, req.session.user.id, req.session.user.name, note]
    });
    
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
      created_at: formatDateSafely(kunde.created_at, 'dd.MM.yyyy')
    }));

    res.render('dashboard/kunden/index', { 
      title: 'Kunden - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      customers,
      newRequestsCount: req.newRequestsCount
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
      newRequestsCount: req.newRequestsCount,
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
    const result = await pool.query({
      text: `
        INSERT INTO kunden (
          name, firma, email, telefon, adresse, plz, ort, 
          kundentyp, status, notizen, newsletter
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
      `,
      values: [
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
    });
    
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
    const kundeQuery = await pool.query({
      text: `SELECT * FROM kunden WHERE id = $1`,
      values: [id]
    });
    
    if (kundeQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Kunde mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const kunde = kundeQuery.rows[0];
    
    // Termine des Kunden abrufen
    const termineQuery = await pool.query({
      text: `
        SELECT id, titel, termin_datum, status 
        FROM termine 
        WHERE kunde_id = $1 
        ORDER BY termin_datum DESC
      `,
      values: [id]
    });
    
    // Projekte des Kunden abrufen
    const projekteQuery = await pool.query({
      text: `
        SELECT id, titel, start_datum, status 
        FROM projekte 
        WHERE kunde_id = $1 
        ORDER BY start_datum DESC
      `,
      values: [id]
    });
    
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
        created_at: formatDateSafely(kunde.created_at, 'dd.MM.yyyy')
      },
      termine: termineQuery.rows.map(termin => {
        const terminStatusInfo = getTerminStatusInfo(termin.status);
        return {
          id: termin.id,
          titel: termin.titel,
          datum: formatDateSafely(termin.termin_datum, 'dd.MM.yyyy, HH:mm'),
          status: termin.status,
          statusLabel: terminStatusInfo.label,
          statusClass: terminStatusInfo.className
        };
      }),
      projekte: projekteQuery.rows.map(projekt => {
        const projektStatusInfo = getProjektStatusInfo(projekt.status);
        return {
          id: projekt.id,
          name: projekt.name,
          datum: formatDateSafely(projekt.start_datum, 'dd.MM.yyyy'),
          status: projekt.status,
          statusLabel: projektStatusInfo.label,
          statusClass: projektStatusInfo.className
        };
      }),
      newRequestsCount: req.newRequestsCount,
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
    const kundeQuery = await pool.query({
      text: `SELECT * FROM kunden WHERE id = $1`,
      values: [id]
    });
    
    if (kundeQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Kunde mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const kunde = kundeQuery.rows[0];
    
    res.render('dashboard/kunden/edit', {
      title: `Kunde bearbeiten: ${kunde.name} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/kunden',
      kunde: kunde,
      newRequestsCount: req.newRequestsCount,
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
    await pool.query({
      text: `
        UPDATE kunden SET 
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
         WHERE id = $12
      `,
      values: [
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
    });
    
    req.flash('success', 'Kunde erfolgreich aktualisiert.');
    res.redirect(`/dashboard/kunden/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kunden:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/kunden/${req.params.id}/edit`);
  }
});

// Kunden-Notiz hinzufügen
router.post('/kunden/:id/add-note', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { notiz } = req.body;
    
    if (!notiz || notiz.trim() === '') {
      req.flash('error', 'Die Notiz darf nicht leer sein.');
      return res.redirect(`/dashboard/kunden/${id}`);
    }
    
    // Aktuelle Notizen abrufen
    const kundeQuery = await pool.query({
      text: `SELECT notizen FROM kunden WHERE id = $1`,
      values: [id]
    });
    
    if (kundeQuery.rows.length === 0) {
      req.flash('error', 'Kunde nicht gefunden.');
      return res.redirect('/dashboard/kunden');
    }
    
    const alteNotizen = kundeQuery.rows[0].notizen || '';
    const zeitstempel = format(new Date(), 'dd.MM.yyyy, HH:mm');
    const benutzerName = req.session.user.name;
    
    // Neue Notiz mit Datum und Benutzer
    const neueNotiz = `${zeitstempel} - ${benutzerName}:\n${notiz}\n\n${alteNotizen}`;
    
    // In Datenbank aktualisieren
    await pool.query({
      text: `UPDATE kunden SET notizen = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [neueNotiz, id]
    });
    
    req.flash('success', 'Notiz erfolgreich hinzugefügt.');
    res.redirect(`/dashboard/kunden/${id}`);
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Notiz:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/kunden/${req.params.id}`);
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
    const termineQuery = await pool.query({
      text: `
        SELECT 
          t.id, 
          t.titel, 
          t.kunde_id, 
          t.projekt_id,
          t.termin_datum,
          t.dauer,
          t.ort,
          t.status,
          k.name AS kunde_name,
          p.titel AS projekt_name
        FROM 
          termine t
          LEFT JOIN kunden k ON t.kunde_id = k.id
          LEFT JOIN projekte p ON t.projekt_id = p.id
        ${statusCondition}
        ORDER BY 
          t.termin_datum ASC
      `,
      values: params
    });
    
    // Abfrageergebnisse formatieren
    const appointments = termineQuery.rows.map(termin => {
      const terminStatusInfo = getTerminStatusInfo(termin.status);
      return {
        id: termin.id,
        titel: termin.titel,
        kunde_id: termin.kunde_id,
        kunde_name: termin.kunde_name || ' - ',
        projekt_id: termin.projekt_id,
        projekt_name: termin.projekt_name || ' - ',
        termin_datum: termin.termin_datum,
        dateFormatted: formatDateSafely(termin.termin_datum, 'dd.MM.yyyy'),
        timeFormatted: formatDateSafely(termin.termin_datum, 'HH:mm'),
        dauer: termin.dauer,
        ort: termin.ort,
        status: termin.status,
        statusLabel: terminStatusInfo.label,
        statusClass: terminStatusInfo.className
      };
    });

    res.render('dashboard/termine/index', { 
      title: 'Termine - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      appointments,
      newRequestsCount: req.newRequestsCount,
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
    
    // Projekte für Dropdown abrufen
    const projekteQuery = await pool.query(`
      SELECT id, titel FROM projekte 
      WHERE status IN ('neu', 'in_bearbeitung') 
      ORDER BY titel ASC
    `);
    
    // Vorausgefüllte Daten aus Query-Parametern
    const kunde_id = req.query.kunde_id || '';
    const projekt_id = req.query.projekt_id || '';
    const kunde_name = req.query.kunde_name || '';
    
    res.render('dashboard/termine/neu', {
      title: 'Neuer Termin - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/termine',
      kunden: kundenQuery.rows,
      projekte: projekteQuery.rows,
      formData: {
        kunde_id,
        kunde_name,
        projekt_id,
        titel: '',
        termin_datum: format(new Date(), 'yyyy-MM-dd'),
        termin_zeit: format(new Date(), 'HH:mm'),
        dauer: 60,
        ort: '',
        beschreibung: '',
        status: 'geplant'
      },
      newRequestsCount: req.newRequestsCount,
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
      projekt_id,
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
    const result = await pool.query({
      text: `
        INSERT INTO termine (
          titel, kunde_id, projekt_id, termin_datum, dauer, ort, 
          beschreibung, status, erstellt_von
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `,
      values: [
        titel, 
        kunde_id || null,
        projekt_id || null, 
        terminDatumObj, 
        dauer || 60, 
        ort || null, 
        beschreibung || null, 
        status || 'geplant',
        req.session.user.id
      ]
    });
    
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
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          req.session.user.id,
          'termin',
          'Neuer Termin erstellt',
          `Termin "${titel}" am ${format(terminDatumObj, 'dd.MM.yyyy')} um ${format(terminDatumObj, 'HH:mm')} Uhr`,
          terminId,
          false
        ]);
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
    await pool.query({
      text: `UPDATE termine SET status = $1, updated_at = NOW() WHERE id = $2`,
      values: [status, id]
    });
    
    // Notiz hinzufügen, falls vorhanden
    if (note && note.trim() !== '') {
      await pool.query({
        text: `
          INSERT INTO termin_notizen (termin_id, benutzer_id, benutzer_name, text)
          VALUES ($1, $2, $3, $4)
        `,
        values: [id, req.session.user.id, req.session.user.name, note]
      });
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
    const terminQuery = await pool.query({
      text: `
        SELECT 
          t.*, 
          k.name AS kunde_name,
          p.titel AS projekt_titel,
          p.id AS projekt_id
        FROM 
          termine t
          LEFT JOIN kunden k ON t.kunde_id = k.id
          LEFT JOIN projekte p ON t.projekt_id = p.id
        WHERE 
          t.id = $1
      `,
      values: [id]
    });
    
    if (terminQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Termin mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const termin = terminQuery.rows[0];
    const terminStatusInfo = getTerminStatusInfo(termin.status);

    // Notizen zu diesem Termin abrufen (falls Sie eine entsprechende Tabelle haben)
    const notizenQuery = await pool.query({
      text: `SELECT * FROM termin_notizen WHERE termin_id = $1 ORDER BY erstellt_am DESC`,
      values: [id]
    });
    
    res.render('dashboard/termine/detail', {
      title: `Termin: ${termin.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/termine',
      termin: {
        id: termin.id,
        titel: termin.titel,
        kunde_id: termin.kunde_id,
        kunde_name: termin.kunde_name || 'Kein Kunde zugewiesen',
        projekt_id: termin.projekt_id,
        projekt_titel: termin.projekt_titel || 'Kein Projekt zugewiesen',
        termin_datum: termin.termin_datum,
        dateFormatted: formatDateSafely(termin.termin_datum, 'dd.MM.yyyy'),
        timeFormatted: formatDateSafely(termin.termin_datum, 'HH:mm'),
        dauer: termin.dauer || 60,
        ort: termin.ort || 'Nicht angegeben',
        beschreibung: termin.beschreibung || 'Keine Beschreibung vorhanden',
        status: termin.status,
        statusLabel: terminStatusInfo.label,
        statusClass: terminStatusInfo.className
      },
      notizen: notizenQuery.rows.map(notiz => ({
        id: notiz.id,
        text: notiz.text,
        formattedDate: formatDateSafely(notiz.erstellt_am, 'dd.MM.yyyy, HH:mm'),
        benutzer: notiz.benutzer_name
      })),
      newRequestsCount: req.newRequestsCount,
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
    const terminQuery = await pool.query({
      text: `
        SELECT 
          t.*, 
          k.name AS kunde_name
        FROM 
          termine t
          LEFT JOIN kunden k ON t.kunde_id = k.id
        WHERE 
          t.id = $1
      `,
      values: [id]
    });
    
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
    
    // Projekte für Dropdown abrufen
    const projekteQuery = await pool.query(`
      SELECT id, titel FROM projekte ORDER BY titel ASC
    `);
    
    res.render('dashboard/termine/edit', {
      title: `Termin bearbeiten: ${termin.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/termine',
      termin: {
        id: termin.id,
        titel: termin.titel,
        kunde_id: termin.kunde_id,
        kunde_name: termin.kunde_name || 'Kein Kunde zugewiesen',
        projekt_id: termin.projekt_id,
        termin_datum: termin.termin_datum,
        dateFormatted: formatDateSafely(termin.termin_datum, 'dd.MM.yyyy'),
        timeFormatted: formatDateSafely(termin.termin_datum, 'HH:mm'),
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
      projekte: projekteQuery.rows,
      newRequestsCount: req.newRequestsCount,
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
      projekt_id,
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
    await pool.query({
      text: `
        UPDATE termine SET 
          titel = $1, 
          kunde_id = $2, 
          projekt_id = $3, 
          termin_datum = $4, 
          dauer = $5, 
          ort = $6, 
          beschreibung = $7, 
          status = $8, 
          updated_at = NOW() 
        WHERE id = $9
      `,
      values: [
        titel, 
        kunde_id || null, 
        projekt_id || null,
        terminDatumObj, 
        dauer || 60, 
        ort || null, 
        beschreibung || null, 
        status || 'geplant',
        id
      ]
    });
    
    // Notiz hinzufügen, dass der Termin aktualisiert wurde
    await pool.query({
      text: `
        INSERT INTO termin_notizen (
          termin_id, benutzer_id, benutzer_name, text
        ) VALUES ($1, $2, $3, $4)
      `,
      values: [
        id, 
        req.session.user.id, 
        req.session.user.name, 
        'Termin wurde aktualisiert.'
      ]
    });
    
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
    await pool.query({
      text: `
        INSERT INTO termin_notizen (
          termin_id, benutzer_id, benutzer_name, text
        ) VALUES ($1, $2, $3, $4)
      `,
      values: [id, req.session.user.id, req.session.user.name, note]
    });
    
    req.flash('success', 'Notiz erfolgreich hinzugefügt.');
    res.redirect(`/dashboard/termine/${id}`);
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Notiz:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/termine/${req.body.id}`);
  }
});

/**
 * API Routes für AJAX-Anfragen
 * Ergänzung zu routes/dashboard.js
 */

// API-Endpunkt für Termine im Kalender
router.get('/termine/api/events', isAuthenticated, async (req, res) => {
  try {
    // Filter für Zeitraum (falls vorhanden)
    const start = req.query.start;
    const end = req.query.end;
    
    let timeCondition = '';
    let params = [];
    
    if (start && end) {
      timeCondition = 'WHERE t.termin_datum BETWEEN $1 AND $2';
      params = [start, end];
    }
    
    // Termine aus der Datenbank abrufen
    const termineQuery = await pool.query(`
      SELECT 
        t.id, 
        t.titel, 
        t.termin_datum,
        t.dauer,
        t.status,
        t.ort,
        k.name AS kunde_name,
        k.id AS kunde_id
      FROM 
        termine t
        LEFT JOIN kunden k ON t.kunde_id = k.id
      ${timeCondition}
      ORDER BY 
        t.termin_datum ASC
    `, params);
    
    // Termine in FullCalendar-Event-Format umwandeln
    const events = termineQuery.rows.map(termin => {
      const startDate = new Date(termin.termin_datum);
      const endDate = new Date(startDate.getTime() + (termin.dauer * 60 * 1000));
      
      let backgroundColor, textColor;
      switch(termin.status) {
        case 'geplant': 
          backgroundColor = '#ffc107'; 
          textColor = '#000000';
          break;
        case 'bestaetigt': 
          backgroundColor = '#198754'; 
          textColor = '#ffffff';
          break;
        case 'abgeschlossen': 
          backgroundColor = '#0d6efd'; 
          textColor = '#ffffff';
          break;
        case 'storniert': 
          backgroundColor = '#6c757d'; 
          textColor = '#ffffff';
          break;
        default: 
          backgroundColor = '#6c757d';
          textColor = '#ffffff';
      }
      
      return {
        id: termin.id,
        title: termin.titel,
        description: termin.kunde_name ? `Kunde: ${termin.kunde_name}` : '',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        location: termin.ort || '',
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        textColor: textColor,
        extendedProps: {
          kunde_id: termin.kunde_id,
          status: termin.status
        }
      };
    });
    
    res.json(events);
  } catch (error) {
    console.error('Fehler beim Abrufen der Termine für den Kalender:', error);
    res.status(500).json({ error: 'Datenbankfehler', details: error.message });
  }
});

// API-Endpunkt für Kunden-Suche (Autocomplete)
router.get('/kunden/api/search', isAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.term;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.json([]);
    }
    
    const kundenQuery = await pool.query(`
      SELECT 
        id, 
        name, 
        firma,
        email,
        telefon
      FROM 
        kunden
      WHERE 
        LOWER(name) LIKE LOWER($1) OR
        LOWER(firma) LIKE LOWER($1) OR
        LOWER(email) LIKE LOWER($1)
      ORDER BY 
        name ASC
      LIMIT 10
    `, [`%${searchTerm}%`]);
    
    const results = kundenQuery.rows.map(kunde => ({
      id: kunde.id,
      label: kunde.name + (kunde.firma ? ` (${kunde.firma})` : ''),
      value: kunde.id,
      name: kunde.name,
      email: kunde.email,
      telefon: kunde.telefon
    }));
    
    res.json(results);
  } catch (error) {
    console.error('Fehler bei der Kundensuche:', error);
    res.status(500).json({ error: 'Datenbankfehler', details: error.message });
  }
});

// API-Endpunkt für Kunden-Details
router.get('/kunden/api/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    const kundeQuery = await pool.query(`
      SELECT 
        id, 
        name, 
        firma,
        email,
        telefon,
        adresse,
        plz,
        ort,
        status
      FROM 
        kunden
      WHERE 
        id = $1
    `, [id]);
    
    if (kundeQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Kunde nicht gefunden' });
    }
    
    res.json({ success: true, kunde: kundeQuery.rows[0] });
  } catch (error) {
    console.error('Fehler beim Abrufen der Kundendetails:', error);
    res.status(500).json({ error: 'Datenbankfehler', details: error.message });
  }
});

// API-Endpunkt für Dashboard-Statistiken
router.get('/api/dashboard-stats', isAuthenticated, async (req, res) => {
  try {
    // Datenzeitraum aus Query-Parametern ermitteln
    const period = req.query.period || 'month'; // week, month, quarter, year
    
    let timeFrame, format, groupBy;
    switch(period) {
      case 'week':
        timeFrame = "CURRENT_DATE - INTERVAL '7 days'";
        format = 'dy';
        groupBy = "DATE_TRUNC('day', date)";
        break;
      case 'month':
        timeFrame = "DATE_TRUNC('month', CURRENT_DATE)";
        format = 'DD';
        groupBy = "DATE_TRUNC('day', date)";
        break;
      case 'quarter':
        timeFrame = "DATE_TRUNC('quarter', CURRENT_DATE)";
        format = 'Mon';
        groupBy = "DATE_TRUNC('month', date)";
        break;
      case 'year':
        timeFrame = "DATE_TRUNC('year', CURRENT_DATE)";
        format = 'Mon';
        groupBy = "DATE_TRUNC('month', date)";
        break;
      default:
        timeFrame = "DATE_TRUNC('month', CURRENT_DATE)";
        format = 'DD';
        groupBy = "DATE_TRUNC('day', date)";
    }
    
    // Umsatzentwicklung abrufen
    const revenueQuery = await pool.query(`
      SELECT 
        TO_CHAR(${groupBy}, '${format}') as label,
        SUM(betrag) as summe
      FROM 
        rechnungen 
      WHERE 
        rechnungsdatum >= ${timeFrame}
      GROUP BY 
        ${groupBy}
      ORDER BY 
        ${groupBy}
    `);
    
    // Services-Verteilung nach Kategorie
    const servicesQuery = await pool.query(`
      SELECT 
        d.name as service_name,
        SUM(p.anzahl * p.einzelpreis) as summe
      FROM 
        rechnungspositionen p
        JOIN dienstleistungen d ON p.dienstleistung_id = d.id
        JOIN rechnungen r ON p.rechnung_id = r.id
      WHERE 
        d.name IS NOT NULL 
        AND r.rechnungsdatum >= ${timeFrame}
      GROUP BY 
        d.name
      ORDER BY 
        summe DESC
      LIMIT 3
    `);
    
    // Aktuelle Anfragen
    const newRequestsCount = await getCountFromDB("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    
    // Anstehende Termine
    const upcomingAppointmentsQuery = await pool.query(`
      SELECT COUNT(*) FROM termine WHERE termin_datum >= CURRENT_DATE
    `);
    
    // Offene Rechnungen
    const openInvoicesQuery = await pool.query(`
      SELECT COUNT(*), SUM(gesamtbetrag) FROM rechnungen WHERE status = 'offen'
    `);
    
    // Response zusammenstellen
    const stats = {
      revenue: {
        labels: revenueQuery.rows.map(row => row.label),
        data: revenueQuery.rows.map(row => parseFloat(row.summe))
      },
      services: {
        labels: servicesQuery.rows.map(row => row.service_name),
        data: servicesQuery.rows.map(row => parseFloat(row.summe))
      },
      counts: {
        newRequests: newRequestsCount,
        upcomingAppointments: parseInt(upcomingAppointmentsQuery.rows[0].count || 0),
        openInvoices: parseInt(openInvoicesQuery.rows[0].count || 0),
        openInvoicesAmount: parseFloat(openInvoicesQuery.rows[0].sum || 0)
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
    res.status(500).json({ error: 'Datenbankfehler', details: error.message });
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

    res.render('dashboard/dienste/index', { 
      title: 'Dienstleistungen - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      services: diensteQuery.rows,
      newRequestsCount: req.newRequestsCount,
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
    await pool.query({
      text: 'INSERT INTO dienstleistungen (name, beschreibung, preis_basis, einheit, mwst_satz, aktiv) VALUES ($1, $2, $3, $4, $5, $6)',
      values: [name, beschreibung, preis_basis, einheit, mwst_satz, aktiv === 'on']
    });
    
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
    
    await pool.query({
      text: 'UPDATE dienstleistungen SET aktiv = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      values: [aktiv, id]
    });
    
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
    
    res.render('dashboard/settings', {
      title: 'Einstellungen - Rising BSM',
      user: req.session.user,
      settings: settingsQuery.rows.length > 0 ? settingsQuery.rows[0] : {
        benachrichtigungen_email: true,
        dark_mode: false,
        sprache: 'de'
      },
      currentPath: '/dashboard/settings',
      newRequestsCount: req.newRequestsCount,
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
    
    res.render('dashboard/profile', {
      title: 'Mein Profil - Rising BSM',
      user: req.session.user,
      userProfile: {
        id: user.id,
        name: user.name,
        email: user.email,
        rolle: user.rolle,
        telefon: user.telefon || '',
        erstelltAm: formatDateSafely(user.created_at, 'dd.MM.yyyy'),
      },
      currentPath: '/dashboard/profile',
      newRequestsCount: req.newRequestsCount,
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
      const userQuery = await pool.query({
        text: 'SELECT passwort FROM benutzer WHERE id = $1',
        values: [req.session.user.id]
      });
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