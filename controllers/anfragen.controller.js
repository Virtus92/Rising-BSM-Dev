/**
 * Anfragen-Controller
 * Zuständig für die Verwaltung von Kontaktanfragen mit optimierter UI
 */

const { format } = require('date-fns');
const { de } = require('date-fns/locale');
const pool = require('../db');
const Excel = require('exceljs');
const PDFDocument = require('pdfkit');

// Hilfsfunktionen direkt im Controller definieren, um Abhängigkeiten zu reduzieren
function formatDateSafely(date, formatString) {
  try {
    return format(new Date(date), formatString);
  } catch (error) {
    console.error('Fehler beim Formatieren des Datums:', error);
    return 'Ungültiges Datum';
  }
}

function getAnfrageStatusInfo(status) {
  const statusMap = {
    'neu': { label: 'Neu', className: 'warning' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'info' },
    'beantwortet': { label: 'Beantwortet', className: 'success' },
    'geschlossen': { label: 'Geschlossen', className: 'secondary' }
  };
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
}

// Mock für getNotifications, bis wir Zugriff auf den echten Code haben
async function getNotifications(req) {
  return [];
}

/**
 * Anfragen-Liste anzeigen mit optimierter UI
 */
exports.getAnfragen = async (req, res) => {
  try {
    // Status-Filter anwenden (falls vorhanden)
    const statusFilter = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    let statusCondition = '';
    let countParams = [];
    let queryParams = [];
    
    if (statusFilter) {
      statusCondition = 'WHERE status = $1';
      countParams.push(statusFilter);
      queryParams.push(statusFilter);
    }
    
    // Gesamtanzahl für Pagination
    const countQuery = await pool.query({
      text: `SELECT COUNT(*) FROM kontaktanfragen ${statusCondition}`,
      values: countParams
    });
    
    const totalItems = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    // Anfragen aus der Datenbank abrufen
    const anfragenQuery = await pool.query({
      text: `
        SELECT 
          id, 
          name, 
          email, 
          service, 
          status,
          phone, 
          created_at
        FROM 
          kontaktanfragen
        ${statusCondition}
        ORDER BY 
          created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `,
      values: [...queryParams, limit, offset]
    });
    
    // Abfrageergebnisse formatieren
    const requests = anfragenQuery.rows.map(anfrage => {
      const statusInfo = getAnfrageStatusInfo(anfrage.status);
      return {
        id: anfrage.id,
        name: anfrage.name,
        email: anfrage.email,
        phone: anfrage.phone || 'Nicht angegeben',
        serviceLabel: anfrage.service === 'facility' ? 'Facility Management' : 
                     anfrage.service === 'moving' ? 'Umzüge & Transporte' : 
                     anfrage.service === 'winter' ? 'Winterdienst' : 'Sonstiges',
        formattedDate: formatDateSafely(anfrage.created_at, 'dd.MM.yyyy'),
        created_at: anfrage.created_at,
        status: statusInfo.label,
        statusClass: statusInfo.className,
        statusValue: anfrage.status
      };
    });
    
    // Statistik für Anfragen
    const statsQuery = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'neu' THEN 1 END) AS neu,
        COUNT(CASE WHEN status = 'in_bearbeitung' THEN 1 END) AS in_bearbeitung,
        COUNT(CASE WHEN status = 'beantwortet' THEN 1 END) AS beantwortet,
        COUNT(CASE WHEN status = 'geschlossen' THEN 1 END) AS geschlossen
      FROM kontaktanfragen
    `);
    
    const stats = statsQuery.rows[0];
    
    // UI-Komponenten Konfiguration
    const renderOptions = {
      baseUrl: '/dashboard/anfragen',
      showNewButton: false,
      showExportButton: true,
      
      // Filter-Optionen definieren
      filterOptions: {
        status: [
          { value: 'neu', label: 'Neue Anfragen' },
          { value: 'in_bearbeitung', label: 'In Bearbeitung' },
          { value: 'beantwortet', label: 'Beantwortet' },
          { value: 'geschlossen', label: 'Geschlossen' }
        ]
      },
      
      // Aktive Filter
      activeFilters: {
        status: statusFilter ? [statusFilter] : []
      },
      
      // Ansichtstypen für die Toggle-Buttons
      viewTypes: [
        { id: 'list-view', icon: 'list' },
        { id: 'card-view', icon: 'th-large' },
        { id: 'stats-view', icon: 'chart-pie' }
      ],
      
      // Massenaktionen definieren
      bulkActions: [
        { action: 'status', value: 'in_bearbeitung', label: 'Als in Bearbeitung markieren', icon: 'spinner', class: 'text-primary' },
        { action: 'status', value: 'beantwortet', label: 'Als beantwortet markieren', icon: 'check', class: 'text-success' },
        { action: 'status', value: 'geschlossen', label: 'Als geschlossen markieren', icon: 'times', class: 'text-secondary' }
      ],
      
      // Export-Optionen
      exportOptions: [
        { value: 'neu', label: 'Neue Anfragen' },
        { value: 'in_bearbeitung', label: 'In Bearbeitung' },
        { value: 'beantwortet', label: 'Beantwortet' },
        { value: 'geschlossen', label: 'Geschlossen' }
      ]
    };
    
    // Benachrichtigungen abrufen
    const notifications = await getNotifications(req);

    // newRequestsCount aus der Statistik extrahieren
    const newRequestsCount = parseInt(stats.neu) || 0;

    res.render('dashboard/anfragen/index', { 
      title: 'Anfragen - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      requests,
      stats,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      },
      filters: {
        status: statusFilter
      },
      notifications,
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') },
      ...renderOptions
    });
  } catch (error) {
    console.error('Fehler beim Laden der Anfragen:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
};

/**
 * Einzelne Anfrage anzeigen
 */
exports.getAnfrageDetails = async (req, res) => {
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
    
    // newRequestsCount abfragen
    const newRequestsQuery = await pool.query(`
      SELECT COUNT(*) AS count 
      FROM kontaktanfragen 
      WHERE status = 'neu'
    `);
    const newRequestsCount = parseInt(newRequestsQuery.rows[0].count) || 0;
    
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
        statusClass: statusInfo.className,
        statusValue: anfrage.status
      },
      notizen: notizenQuery.rows.map(notiz => ({
        id: notiz.id,
        text: notiz.text,
        formattedDate: formatDateSafely(notiz.erstellt_am, 'dd.MM.yyyy, HH:mm'),
        benutzer: notiz.benutzer_name
      })),
      newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') },
      baseUrl: '/dashboard/anfragen'
    });
  } catch (error) {
    console.error('Fehler beim Anzeigen der Anfrage:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
};

/**
 * Anfrage Status aktualisieren
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id, status, note } = req.body;

    // Validierung
    if (!id) {
      req.flash('error', 'Ungültige Anfrage-ID.');
      return res.redirect('/dashboard/anfragen');
    }

    // Gültige Status-Werte
    const validStatuses = ['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen'];
    if (!validStatuses.includes(status)) {
      req.flash('error', 'Ungültiger Status.');
      return res.redirect(`/dashboard/anfragen/${id}`);
    }

    // Prüfen, ob die Anfrage existiert
    const checkAnfrageQuery = await pool.query({
      text: `SELECT id FROM kontaktanfragen WHERE id = $1`,
      values: [id]
    });

    if (checkAnfrageQuery.rows.length === 0) {
      req.flash('error', `Anfrage mit ID ${id} nicht gefunden.`);
      return res.redirect('/dashboard/anfragen');
    }
    
    // Status in der Datenbank aktualisieren
    await pool.query({
      text: `UPDATE kontaktanfragen SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
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
    
    req.flash('success', 'Status erfolgreich aktualisiert');
    res.redirect(`/dashboard/anfragen/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error);
    req.flash('error', 'Fehler: ' + error.message);
    
    if (req.body && req.body.id) {
      return res.redirect(`/dashboard/anfragen/${req.body.id}`);
    } else {
      return res.redirect('/dashboard/anfragen');
    }
  }
};

/**
 * Mehrere Anfragen Status aktualisieren
 */
exports.updateBulkStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Keine gültigen IDs angegeben.' 
      });
    }
    
    // Gültige Status-Werte
    const validStatuses = ['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ungültiger Status.' 
      });
    }
    
    // Platzhalter für die IDs erstellen
    const placeholders = ids.map((_, idx) => `$${idx + 2}`).join(',');
    
    // Status für alle ausgewählten Anfragen aktualisieren
    await pool.query({
      text: `UPDATE kontaktanfragen SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      values: [status, ...ids]
    });
    
    // Notiz für jede Anfrage hinzufügen
    const statusText = status === 'neu' ? 'Neu' : 
                    status === 'in_bearbeitung' ? 'In Bearbeitung' : 
                    status === 'beantwortet' ? 'Beantwortet' : 'Geschlossen';
    
    const noteText = `Status durch Massenaktion auf "${statusText}" geändert.`;
    
    for (const id of ids) {
      await pool.query({
        text: `
          INSERT INTO anfragen_notizen (anfrage_id, benutzer_id, benutzer_name, text)
          VALUES ($1, $2, $3, $4)
        `,
        values: [id, req.session.user.id, req.session.user.name, noteText]
      });
    }
    
    res.json({ 
      success: true, 
      message: `Status für ${ids.length} Anfragen aktualisiert.` 
    });
  } catch (error) {
    console.error('Fehler bei Massen-Status-Aktualisierung:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Datenbankfehler: ' + error.message 
    });
  }
};

/**
 * Mehrere Anfragen löschen
 */
exports.deleteBulk = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Keine gültigen IDs angegeben.' 
      });
    }
    
    // Platzhalter für die IDs erstellen
    const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(',');
    
    // Notizen zu den Anfragen löschen
    await pool.query({
      text: `DELETE FROM anfragen_notizen WHERE anfrage_id IN (${placeholders})`,
      values: ids
    });
    
    // Anfragen löschen
    await pool.query({
      text: `DELETE FROM kontaktanfragen WHERE id IN (${placeholders})`,
      values: ids
    });
    
    res.json({ 
      success: true, 
      message: `${ids.length} Anfragen erfolgreich gelöscht.` 
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Anfragen:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Datenbankfehler: ' + error.message 
    });
  }
};

/**
 * Anfragen-Notiz hinzufügen
 */
exports.addNote = async (req, res) => {
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
};

/**
 * Export-Funktionalität
 */
exports.exportAnfragen = async (req, res) => {
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
          `"${format(new Date(row.created_at), 'dd.MM.yyyy HH:mm')}"`,
        ].join(',');
        
        res.write(csvLine + '\n');
      });
      
      res.end();
    } else if (exportFormat === 'excel') {
      // Excel-Export
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
          service: convertServiceLabel(row.service),
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
    } else if (exportFormat === 'pdf') {
      // PDF-Export mit PDFKit
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
        
        doc.text(convertServiceLabel(row.service), currentX, currentY, { width: columnWidths[4] });
        currentX += columnWidths[4];
        
        const statusInfo = getAnfrageStatusInfo(row.status);
        doc.text(statusInfo.label, currentX, currentY, { width: columnWidths[5] });
        
        currentY += 20;
      });
      
      // PDF finalisieren
      doc.end();
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
};

/**
 * Hilfsfunktion zur Konvertierung des Service-Labels
 */
function convertServiceLabel(service) {
  switch(service) {
    case 'facility': return 'Facility Management';
    case 'moving': return 'Umzüge & Transporte';
    case 'winter': return 'Winterdienst';
    default: return service;
  }
}