const express = require('express');
const router = express.Router();
const { formatDistanceToNow, isToday, isTomorrow, format } = require('date-fns');
const { de } = require('date-fns/locale');
const pool = require('../../../db');

// Helper-Funktionen
function getTerminStatusInfo(status) {
  const statusMap = {
    'geplant': { label: 'Geplant', className: 'warning' },
    'bestaetigt': { label: 'Bestätigt', className: 'success' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'primary' },
    'storniert': { label: 'Storniert', className: 'secondary' }
  };
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
}

// Authentifizierungs-Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    // console.log("Auth failed, redirecting to login");
    return res.redirect('/login');
  }
};

// Termine-Liste anzeigen
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const statusFilter = req.query.status;
    let statusCondition = '';
    let params = [];
    
    if (statusFilter) {
      statusCondition = 'WHERE t.status = $1';
      params.push(statusFilter);
    }
    
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
          p.titel AS projekt_titel
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
    
    const appointments = termineQuery.rows.map(termin => {
      const terminStatusInfo = getTerminStatusInfo(termin.status);
      return {
        id: termin.id,
        titel: termin.titel,
        kunde_id: termin.kunde_id,
        kunde_name: termin.kunde_name || 'Kein Kunde zugewiesen',
        projekt_id: termin.projekt_id,
        projekt_titel: termin.projekt_titel || 'Kein Projekt zugewiesen',
        termin_datum: termin.termin_datum,
        dateFormatted: format(new Date(termin.termin_datum), 'dd.MM.yyyy'),
        timeFormatted: format(new Date(termin.termin_datum), 'HH:mm'),
        dauer: termin.dauer,
        ort: termin.ort || 'Nicht angegeben',
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
      newRequestsCount: await getNewRequestsCount(),
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

// Neuen Termin anlegen (Formular)
router.get('/neu', isAuthenticated, async (req, res) => {
  try {
    const kundenQuery = await pool.query(`
      SELECT id, name FROM kunden ORDER BY name ASC
    `);
    
    const projekteQuery = await pool.query(`
      SELECT id, titel FROM projekte 
      WHERE status IN ('neu', 'in_bearbeitung') 
      ORDER BY titel ASC
    `);
    
    // Vorausgefüllte Daten aus Query-Parametern
    const { kunde_id, projekt_id, kunde_name } = req.query;
    
    res.render('dashboard/termine/neu', {
      title: 'Neuer Termin - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/termine',
      kunden: kundenQuery.rows,
      projekte: projekteQuery.rows,
      formData: {
        kunde_id: kunde_id || '',
        kunde_name: kunde_name || '',
        projekt_id: projekt_id || '',
        titel: '',
        termin_datum: format(new Date(), 'yyyy-MM-dd'),
        termin_zeit: format(new Date(), 'HH:mm'),
        dauer: 60,
        ort: '',
        beschreibung: '',
        status: 'geplant'
      },
      newRequestsCount: await getNewRequestsCount(),
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
router.post('/neu', isAuthenticated, async (req, res) => {
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
    
    req.flash('success', 'Termin erfolgreich angelegt.');
    res.redirect(`/dashboard/termine/${terminId}`);
  } catch (error) {
    console.error('Fehler beim Anlegen des Termins:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/termine/neu');
  }
});
  
  // Termin Status aktualisieren
  router.post('/update-status', isAuthenticated, async (req, res) => {
    try {
      const { id, status, note } = req.body;

      // Validierung der ID
      if (!id || isNaN(parseInt(id))) {
        req.flash('error', 'Ungültige Termin-ID');
        return res.redirect('/dashboard/termine');
      }
      
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
  
  // Termin-Notiz hinzufügen
  router.post('/add-note', isAuthenticated, async (req, res) => {
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
  
  // Kalender-Events API-Endpunkt
  router.get('/calendar-events', isAuthenticated, async (req, res) => {
    try {
      const { start, end } = req.query;
      
      let whereClause = '';
      let params = [];
      let paramCounter = 1;
      
      // Datumsbereichs-Filter
      if (start && end) {
        whereClause = `WHERE termin_datum >= $${paramCounter++} AND termin_datum <= $${paramCounter++}`;
        params = [new Date(start), new Date(end)];
      }
      
      const termineQuery = await pool.query({
        text: `
          SELECT 
            t.id, 
            t.titel, 
            t.termin_datum,
            t.dauer,
            t.status,
            t.ort,
            t.beschreibung,
            k.name AS kunde_name,
            k.id AS kunde_id,
            p.titel AS projekt_titel,
            p.id AS projekt_id
          FROM 
            termine t
            LEFT JOIN kunden k ON t.kunde_id = k.id
            LEFT JOIN projekte p ON t.projekt_id = p.id
          ${whereClause}
          ORDER BY 
            t.termin_datum ASC
        `,
        values: params
      });
      
      const events = termineQuery.rows.map(termin => {
        const startDate = new Date(termin.termin_datum);
        const endDate = new Date(startDate.getTime() + (termin.dauer || 60) * 60000);
        
        const terminStatusInfo = getTerminStatusInfo(termin.status);
        
        return {
          id: termin.id,
          title: termin.titel,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          allDay: false,
          backgroundColor: terminStatusInfo.className,
          borderColor: terminStatusInfo.className,
          textColor: 'white',
          extendedProps: {
            kunde: termin.kunde_name,
            kunde_id: termin.kunde_id,
            projekt: termin.projekt_titel,
            projekt_id: termin.projekt_id,
            ort: termin.ort,
            beschreibung: termin.beschreibung,
            status: termin.status,
            statusText: terminStatusInfo.label
          },
          url: `/dashboard/termine/${termin.id}`
        };
      });
      
      res.json(events);
    } catch (error) {
      console.error('Fehler beim Abrufen der Kalender-Events:', error);
      res.status(500).json({
        success: false,
        error: 'Datenbankfehler: ' + error.message
      });
    }
  });
  
  // Export-Funktionen
    router.get('/export', isAuthenticated, async (req, res) => {
        try {
        const { format, start_date, end_date, status } = req.query;
        
        let conditions = [];
        let params = [];
        let paramCounter = 1;
        
        // Datumsbereich-Filter
        if (start_date) {
            conditions.push(`termin_datum >= $${paramCounter++}`);
            params.push(new Date(start_date));
        }
        
        if (end_date) {
            conditions.push(`termin_datum <= $${paramCounter++}`);
            params.push(new Date(end_date));
        }
        
        // Status-Filter
        if (status) {
            conditions.push(`status = $${paramCounter++}`);
            params.push(status);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const termineQuery = await pool.query({
            text: `
            SELECT 
                t.id, 
                t.titel, 
                t.termin_datum, 
                t.dauer, 
                t.ort, 
                t.status,
                t.beschreibung,
                k.name AS kunde_name,
                p.titel AS projekt_titel
            FROM 
                termine t
                LEFT JOIN kunden k ON t.kunde_id = k.id
                LEFT JOIN projekte p ON t.projekt_id = p.id
            ${whereClause}
            ORDER BY t.termin_datum
            `,
            values: params
        });

        // CSV-Export
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=termine-export.csv');
            
            // CSV-Header
            res.write('ID,Titel,Datum,Uhrzeit,Dauer,Status,Kunde,Projekt,Ort,Beschreibung\n');
            
            // CSV-Zeilen
            termineQuery.rows.forEach(termin => {
            const csvLine = [
                termin.id,
                `"${(termin.titel || '').replace(/"/g, '""')}"`,
                format(new Date(termin.termin_datum), 'dd.MM.yyyy'),
                format(new Date(termin.termin_datum), 'HH:mm'),
                termin.dauer,
                termin.status,
                `"${(termin.kunde_name || '').replace(/"/g, '""')}"`,
                `"${(termin.projekt_titel || '').replace(/"/g, '""')}"`,
                `"${(termin.ort || '').replace(/"/g, '""')}"`,
                `"${(termin.beschreibung || '').replace(/"/g, '""').replace(/\n/g, ' ')}"` 
            ].join(',');
            
            res.write(csvLine + '\n');
            });
            
            res.end();
        } 
        // Excel-Export
        else if (format === 'excel') {
            const Excel = require('exceljs');
            const workbook = new Excel.Workbook();
            const worksheet = workbook.addWorksheet('Termine');
            
            // Spalten definieren
            worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Titel', key: 'titel', width: 30 },
            { header: 'Datum', key: 'datum', width: 15 },
            { header: 'Uhrzeit', key: 'uhrzeit', width: 10 },
            { header: 'Dauer (Min)', key: 'dauer', width: 10 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Kunde', key: 'kunde', width: 25 },
            { header: 'Projekt', key: 'projekt', width: 25 },
            { header: 'Ort', key: 'ort', width: 20 },
            { header: 'Beschreibung', key: 'beschreibung', width: 50 }
            ];
            
            // Zeilen hinzufügen
            termineQuery.rows.forEach(termin => {
            worksheet.addRow({
                id: termin.id,
                titel: termin.titel,
                datum: format(new Date(termin.termin_datum), 'dd.MM.yyyy'),
                uhrzeit: format(new Date(termin.termin_datum), 'HH:mm'),
                dauer: termin.dauer,
                status: getTerminStatusInfo(termin.status).label,
                kunde: termin.kunde_name || 'Kein Kunde',
                projekt: termin.projekt_titel || 'Kein Projekt',
                ort: termin.ort || '',
                beschreibung: termin.beschreibung || ''
            });
            });
            
            // Styling
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
            };
            
            // Excel-Datei an Browser senden
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=termine-export.xlsx');
            
            await workbook.xlsx.write(res);
            res.end();
        } 
        // PDF-Export
        else if (format === 'pdf') {
            const PDFDocument = require('pdfkit');
            
            const doc = new PDFDocument({
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
            size: 'A4'
            });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=termine-export.pdf');
            
            doc.pipe(res);
            
            // PDF-Titel
            doc.fontSize(16).text('Terminübersicht - Rising BSM', { align: 'center' });
            doc.moveDown();
            
            // Filter-Informationen
            doc.fontSize(10)
            .text(`Exportiert am: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`)
            .text(`Zeitraum: ${start_date ? format(new Date(start_date), 'dd.MM.yyyy') : 'Alle'} - ${end_date ? format(new Date(end_date), 'dd.MM.yyyy') : 'Aktuell'}`)
            .text(`Status: ${status || 'Alle'}`)
            .moveDown();
            
            // Tabelle vorbereiten
            const tableTop = doc.y;
            const columnWidths = [30, 120, 70, 50, 50, 70, 70, 70, 40];
            const headers = ['ID', 'Titel', 'Datum', 'Uhrzeit', 'Dauer', 'Status', 'Kunde', 'Projekt', 'Ort'];
            
            // Header zeichnen
            doc.fillColor('#000')
            .fontSize(10)
            .font('Helvetica-Bold');
            
            headers.forEach((header, i) => {
            doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, { 
                width: columnWidths[i], 
                align: 'left' 
            });
            });
            
            // Trennlinie
            doc.moveDown()
            .strokeColor('#ccc')
            .lineWidth(0.5)
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke();
            
            // Daten
            doc.font('Helvetica')
            .fontSize(8);
            
            termineQuery.rows.forEach((termin, rowIndex) => {
            // Neue Seite, wenn Platz knapp wird
            if (doc.y > 700) {
                doc.addPage();
            }
            
            const rowData = [
                termin.id.toString(),
                termin.titel,
                format(new Date(termin.termin_datum), 'dd.MM.yyyy'),
                format(new Date(termin.termin_datum), 'HH:mm'),
                termin.dauer.toString(),
                getTerminStatusInfo(termin.status).label,
                termin.kunde_name || '-',
                termin.projekt_titel || '-',
                termin.ort || '-'
            ];
            
            rowData.forEach((cell, colIndex) => {
                doc.text(cell, 50 + columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0), doc.y, { 
                width: columnWidths[colIndex], 
                align: 'left' 
                });
            });
            
            doc.moveDown();
            });
            
            doc.end();
        } 
        else {
            // Standard-Antwort für unbekanntes Format
            res.json({ 
            success: true, 
            message: 'Export nicht unterstützt', 
            format: format,
            count: termineQuery.rows.length
            });
        }
        } catch (error) {
        console.error('Fehler beim Exportieren der Termine:', error);
        res.status(500).json({
            success: false,
            error: 'Datenbankfehler: ' + error.message
        });
        }
    });
  
  // Hilfsfunktion für Neue Anfragen-Zählung
  async function getNewRequestsCount() {
    try {
      const result = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
      return parseInt(result.rows[0].count || 0);
    } catch (error) {
      console.error('Fehler beim Abrufen der neuen Anfragen:', error);
      return 0;
    }
  }

  
// Einzelnen Termin anzeigen
router.get('/:id', isAuthenticated, async (req, res) => {
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

    // Notizen zu diesem Termin abrufen
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
        dateFormatted: format(new Date(termin.termin_datum), 'dd.MM.yyyy'),
        timeFormatted: format(new Date(termin.termin_datum), 'HH:mm'),
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
        formattedDate: format(new Date(notiz.erstellt_am), 'dd.MM.yyyy, HH:mm'),
        benutzer: notiz.benutzer_name
      })),
      newRequestsCount: await getNewRequestsCount(),
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

// Termin bearbeiten (Formular)
router.get('/:id/edit', isAuthenticated, async (req, res) => {
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
      SELECT id, titel FROM projekte 
      WHERE status IN ('neu', 'in_bearbeitung') 
      ORDER BY titel ASC
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
        termin_datum: termin.termin_datum.toISOString().split('T')[0],
        timeFormatted: format(new Date(termin.termin_datum), 'HH:mm'),
        dauer: termin.dauer || 60,
        ort: termin.ort || '',
        beschreibung: termin.beschreibung || '',
        status: termin.status
      },
      kunden: kundenQuery.rows,
      projekte: projekteQuery.rows,
      newRequestsCount: await getNewRequestsCount(),
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

// Termin aktualisieren
router.post('/:id/edit', isAuthenticated, async (req, res) => {
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
      
      // Notiz über Aktualisierung hinzufügen
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
        await pool.query({
          text: `
            INSERT INTO benachrichtigungen (
              benutzer_id, typ, titel, nachricht, referenz_id, gelesen
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `,
          values: [
            kunde_id,
            'termin',
            'Termin aktualisiert',
            `Der Termin "${titel}" wurde aktualisiert.`,
            id,
            false
          ]
        });
      }
      
      req.flash('success', 'Termin erfolgreich aktualisiert.');
      res.redirect(`/dashboard/termine/${id}`);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Termins:', error);
      req.flash('error', 'Datenbankfehler: ' + error.message);
      res.redirect(`/dashboard/termine/${req.params.id}/edit`);
    }
  });
  
  module.exports = router;