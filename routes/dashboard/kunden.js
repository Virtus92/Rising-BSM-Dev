/**
 * Kunden-Router
 * Zuständig für die Verwaltung von Kundendaten
 */

const express = require('express');
const router = express.Router();
const { format } = require('date-fns');
const pool = require('../../db');
const {
  formatDateSafely,
  getTerminStatusInfo,
  getProjektStatusInfo
} = require('../utils/helpers');
const { isAuthenticated } = require('../middleware/auth');

// Kunden-Liste anzeigen
router.get('/', async (req, res) => {
  try {
    // Filterwerte aus der Query entgegennehmen
    const { status, type, search } = req.query;

    // Filter-Objekt erstellen
    const filters = {
      status: status || '',
      type: type || '',
      search: search || ''
    };

    // SQL-Abfrage basierend auf Filtern erstellen
    let queryText = `
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
    `;
    let whereClauses = [];
    let queryParams = [];

    if (status) {
      whereClauses.push(`status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    if (type) {
      whereClauses.push(`kundentyp = $${queryParams.length + 1}`);
      queryParams.push(type);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      whereClauses.push(`
        (LOWER(name) LIKE $${queryParams.length + 1} OR 
         LOWER(firma) LIKE $${queryParams.length + 1} OR 
         LOWER(email) LIKE $${queryParams.length + 1})
      `);
      queryParams.push(searchTerm);
    }

    if (whereClauses.length > 0) {
      queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    queryText += ` ORDER BY name ASC`;

    // Kunden aus der Datenbank abrufen
    const kundenQuery = await pool.query({
      text: queryText,
      values: queryParams
    });
    
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

    // Kundenstatistiken abrufen
    const statsQuery = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN kundentyp = 'privat' THEN 1 END) AS privat,
        COUNT(CASE WHEN kundentyp = 'geschaeft' THEN 1 END) AS geschaeft,
        COUNT(CASE WHEN status = 'aktiv' THEN 1 END) AS aktiv
      FROM kunden
    `);

    const stats = statsQuery.rows[0];

    // Kundenwachstumsdaten abrufen (monatlich)
    const customerGrowthQuery = await pool.query(`
      SELECT
        DATE_TRUNC('day', created_at) AS day,
        COUNT(*) AS customer_count
      FROM kunden
      WHERE status != 'geloescht' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY day
    `);

    const customerGrowthData = customerGrowthQuery.rows.map(row => ({
      month: format(new Date(row.day), 'dd.MM'),
      customer_count: parseInt(row.customer_count)
    }));

    res.render('dashboard/kunden/index', { 
      title: 'Kunden - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      customers,
      newRequestsCount: req.newRequestsCount,
      filters: filters, 
      stats: stats,
      customerGrowthData: customerGrowthData,
      pagination: {
        current: 1,
        total: 1
      },
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Fehler beim Laden der Kunden:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

// Neuen Kunden anlegen (Formular)
router.get('/neu', async (req, res) => {
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
router.post('/neu', async (req, res) => {
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

// Kundenstatus aktualisieren
router.post('/update-status', async (req, res) => {
  try {
    const { id, status } = req.body;
    
    // Validierung
    if (!id || !status) {
      req.flash('error', 'Fehlende Parameter: ID und Status sind erforderlich.');
      return res.redirect('/dashboard/kunden');
    }
    
    // Status in der Datenbank aktualisieren
    await pool.query({
      text: `UPDATE kunden SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [status, id]
    });

    // Protokollieren der Statusänderung
    await pool.query({
      text: `
        INSERT INTO kunden_log (
          kunde_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        id, 
        req.session.user.id, 
        req.session.user.name, 
        'status_changed',
        `Status geändert auf: ${status}`
      ]
    });
    
    req.flash('success', 'Kundenstatus erfolgreich aktualisiert.');
    res.redirect('/dashboard/kunden');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kundenstatus:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/kunden');
  }
});

// Kunde löschen
router.post('/delete', async (req, res) => {
  try {
    const { id } = req.body;
    
    // Validierung
    if (!id) {
      req.flash('error', 'Fehlende Parameter: ID ist erforderlich.');
      return res.redirect('/dashboard/kunden');
    }
    
    // Prüfen, ob mit diesem Kunden bereits Projekte oder Termine verknüpft sind
    const relatedProjectsQuery = await pool.query(
      'SELECT COUNT(*) FROM projekte WHERE kunde_id = $1',
      [id]
    );
    
    const relatedAppointmentsQuery = await pool.query(
      'SELECT COUNT(*) FROM termine WHERE kunde_id = $1',
      [id]
    );
    
    const relatedProjects = parseInt(relatedProjectsQuery.rows[0].count);
    const relatedAppointments = parseInt(relatedAppointmentsQuery.rows[0].count);
    
    if (relatedProjects > 0 || relatedAppointments > 0) {
      req.flash('error', `Kunde kann nicht gelöscht werden. ${relatedProjects} Projekte und ${relatedAppointments} Termine sind noch mit diesem Kunden verknüpft.`);
      return res.redirect('/dashboard/kunden');
    }
    
    // Statt vollständiger Löschung: Status auf 'gelöscht' setzen und Archivieren
    await pool.query({
      text: `UPDATE kunden SET status = 'geloescht', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      values: [id]
    });
    
    // Protokollieren der Löschung
    await pool.query({
      text: `
        INSERT INTO kunden_log (
          kunde_id, benutzer_id, benutzer_name, aktion, details
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [
        id, 
        req.session.user.id, 
        req.session.user.name, 
        'deleted',
        'Kunde als gelöscht markiert'
      ]
    });
    
    req.flash('success', 'Kunde erfolgreich gelöscht.');
    res.redirect('/dashboard/kunden');
  } catch (error) {
    console.error('Fehler beim Löschen des Kunden:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/kunden');
  }
});

// Kunden-Export
router.get('/export', async (req, res) => {
  try {
    const { format: exportFormat, status, type } = req.query;
    
    // Filterbedingungen aufbauen
    let conditions = [];
    let params = [];
    let paramCounter = 1;
    
    if (status) {
      conditions.push(`status = $${paramCounter++}`);
      params.push(status);
    } else {
      // Standardmäßig nur aktive Kunden exportieren (keine gelöschten)
      conditions.push(`status != 'geloescht'`);
    }
    
    if (type) {
      conditions.push(`kundentyp = $${paramCounter++}`);
      params.push(type);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Daten abrufen
    const query = {
      text: `
        SELECT 
          id, 
          name, 
          firma,
          email,
          telefon,
          adresse,
          plz,
          ort,
          land,
          kundentyp,
          status,
          created_at,
          updated_at,
          newsletter
        FROM 
          kunden
        ${whereClause}
        ORDER BY 
          name ASC
      `,
      values: params
    };
    
    const result = await pool.query(query);
    
    // Format basierte Verarbeitung
    if (exportFormat === 'csv') {
      // CSV-Export
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=kunden-export.csv');
      
      // CSV-Header
      res.write('ID,Name,Firma,Email,Telefon,Adresse,PLZ,Ort,Land,Kundentyp,Status,Erstellt am,Newsletter\n');
      
      // CSV-Zeilen
      result.rows.forEach(row => {
        const csvLine = [
          row.id,
          `"${(row.name || '').replace(/"/g, '""')}"`,
          `"${(row.firma || '').replace(/"/g, '""')}"`,
          `"${(row.email || '').replace(/"/g, '""')}"`,
          `"${(row.telefon || '').replace(/"/g, '""')}"`,
          `"${(row.adresse || '').replace(/"/g, '""')}"`,
          `"${(row.plz || '').replace(/"/g, '""')}"`,
          `"${(row.ort || '').replace(/"/g, '""')}"`,
          `"${(row.land || 'Österreich').replace(/"/g, '""')}"`,
          `"${(row.kundentyp || 'privat').replace(/"/g, '""')}"`,
          `"${(row.status || 'aktiv').replace(/"/g, '""')}"`,
          `"${row.created_at ? new Date(row.created_at).toLocaleDateString('de-DE') : ''}"`,
          row.newsletter ? 'Ja' : 'Nein'
        ].join(',');
        
        res.write(csvLine + '\n');
      });
      
      res.end();
    } else if (exportFormat === 'excel') {
      try {
        // Excel-Export
        const Excel = require('exceljs');
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Kunden');
        
        // Spalten definieren
        worksheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Name', key: 'name', width: 20 },
          { header: 'Firma', key: 'firma', width: 20 },
          { header: 'E-Mail', key: 'email', width: 25 },
          { header: 'Telefon', key: 'telefon', width: 15 },
          { header: 'Adresse', key: 'adresse', width: 25 },
          { header: 'PLZ', key: 'plz', width: 10 },
          { header: 'Ort', key: 'ort', width: 15 },
          { header: 'Land', key: 'land', width: 15 },
          { header: 'Kundentyp', key: 'kundentyp', width: 15 },
          { header: 'Status', key: 'status', width: 12 },
          { header: 'Erstellt am', key: 'created_at', width: 18 },
          { header: 'Newsletter', key: 'newsletter', width: 12 }
        ];
        
        // Zeilen hinzufügen
        result.rows.forEach(row => {
          worksheet.addRow({
            id: row.id,
            name: row.name,
            firma: row.firma || '',
            email: row.email,
            telefon: row.telefon || '',
            adresse: row.adresse || '',
            plz: row.plz || '',
            ort: row.ort || '',
            land: row.land || 'Österreich',
            kundentyp: row.kundentyp === 'geschaeft' ? 'Geschäftskunde' : 'Privatkunde',
            status: row.status === 'aktiv' ? 'Aktiv' : 'Inaktiv',
            created_at: row.created_at ? new Date(row.created_at).toLocaleDateString('de-DE') : '',
            newsletter: row.newsletter ? 'Ja' : 'Nein'
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
        res.setHeader('Content-Disposition', 'attachment; filename=kundenexport.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
      } catch (excelError) {
        console.error('Fehler beim Excel-Export:', excelError);
        res.status(500).json({ 
          success: false, 
          error: 'Excel-Export-Fehler: ' + excelError.message 
        });
      }
    } else if (exportFormat === 'pdf') {
      try {
        // PDF-Export mit PDFKit
        const PDFDocument = require('pdfkit');
        
        // Erstellen eines neuen PDF-Dokuments
        const doc = new PDFDocument({
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          size: 'A4'
        });
        
        // PDF-Header-Metadaten setzen
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=kundenexport.pdf');
        
        // PDF als Stream an die Response weiterleiten
        doc.pipe(res);
        
        // PDF-Inhalt erstellen
        doc.fontSize(16).text('Kundenliste - Rising BSM', { align: 'center' });
        doc.moveDown();
        
        // Filter-Informationen
        doc.fontSize(10).text(`Exportiert am: ${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
        if (status) doc.text(`Status-Filter: ${status === 'aktiv' ? 'Nur aktive Kunden' : 'Nur inaktive Kunden'}`);
        if (type) doc.text(`Typ-Filter: ${type === 'privat' ? 'Nur Privatkunden' : 'Nur Geschäftskunden'}`);
        
        doc.moveDown();
        
        // Tabellen-Header
        const tableHeaders = ['Name', 'Firma', 'Kontakt', 'Adresse', 'Status'];
        const columnWidths = [100, 80, 120, 150, 50];
        let currentY = doc.y;
        
        // Header-Hintergrund
        doc.rect(50, currentY, 500, 20).fill('#f0f0f0');
        doc.fillColor('#000000');
        
        // Header-Texte
        let currentX = 50;
        tableHeaders.forEach((header, i) => {
          doc.text(header, currentX, currentY + 5, { width: columnWidths[i], align: 'left' });
          currentX += columnWidths[i];
        });
        
        currentY += 25;
        
        // Zeilen
        result.rows.forEach((row, rowIndex) => {
            // Seitenumbruch prüfen
            if (currentY > 700) {
              doc.addPage();
              currentY = 50;
            }
            
            currentX = 50;
            doc.fontSize(9);
            
            // Zellen-Inhalte
            doc.text(row.name, currentX, currentY, { width: columnWidths[0] });
            currentX += columnWidths[0];
            
            doc.text(row.firma || '-', currentX, currentY, { width: columnWidths[1] });
            currentX += columnWidths[1];
            
            doc.text(
              `${row.email}\n${row.telefon || ''}`, 
              currentX, currentY, 
              { width: columnWidths[2] }
            );
            currentX += columnWidths[2];
            
            const adresse = row.adresse ? 
              `${row.adresse}, ${row.plz || ''} ${row.ort || ''}` : 
              'Keine Adresse';
            doc.text(adresse, currentX, currentY, { width: columnWidths[3] });
            currentX += columnWidths[3];
            
            doc.text(row.status === 'aktiv' ? 'Aktiv' : 'Inaktiv', currentX, currentY, { width: columnWidths[4] });
            
            currentY += 30;
          });
          
          // PDF finalisieren
          doc.end();
        } catch (pdfError) {
          console.error('Fehler beim PDF-Export:', pdfError);
          res.status(500).json({ 
            success: false, 
            error: 'PDF-Export-Fehler: ' + pdfError.message 
          });
        }
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
      console.error('Fehler beim Exportieren der Kunden:', error);
      res.status(500).json({
        success: false,
        error: 'Datenbankfehler: ' + error.message
      });
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
          titel: projekt.titel,
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
    res.redirect(`/dashboard/kunden/${id}`);
  }
});
  
  module.exports = router;