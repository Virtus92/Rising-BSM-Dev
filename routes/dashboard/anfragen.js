/**
 * Anfragen-Router
 * Zuständig für die Verwaltung von Kontaktanfragen
 */

const express = require('express');
const router = express.Router();
const { format } = require('date-fns');
const pool = require('../../db');
const {
  getNotifications,
  formatDateSafely,
  getAnfrageStatusInfo,
} = require('../utils/helpers');

// Anfragen-Liste anzeigen
router.get('/', async (req, res) => {
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
    
    // Benachrichtigungen abrufen
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



// Anfrage Status aktualisieren
router.post('/update-status', async (req, res) => {
  try {
    const { id, status, note } = req.body;

    // Robust validation to prevent empty ID
    if (!id) {
      req.flash('error', 'Ungültige Anfrage-ID.');
      return res.redirect('/dashboard/anfragen');
    }

    // Validate status
    const validStatuses = ['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen'];
    if (!validStatuses.includes(status)) {
      req.flash('error', 'Ungültiger Status.');
      return res.redirect(`/dashboard/anfragen/${id}`);
    }

    // Prüfen, ob die Anfrage mit der gegebenen ID existiert
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
    
    // Erfolgsmeldung und Weiterleitung
    req.flash('success', 'Status erfolgreich aktualisiert');
    res.redirect(`/dashboard/anfragen/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error);
    req.flash('error', 'Fehler: ' + error.message);
    
    // In case `id` is not defined in the catch block
    if (req.body && req.body.id) {
      return res.redirect(`/dashboard/anfragen/${req.body.id}`);
    } else {
      return res.redirect('/dashboard/anfragen');
    }
  }
});

// Anfragen-Notiz hinzufügen
router.post('/add-note', async (req, res) => {
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

// Export-Funktionalität
router.get('/export', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
  
  module.exports = router;