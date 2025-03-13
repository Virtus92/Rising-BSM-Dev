const express = require('express');
const router = express.Router();
const pool = require('../../../db');
const { format } = require('date-fns');

// Authentifizierungs-Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

// Hilfsfunktion für neue Anfragen-Zählung
async function getNewRequestsCount() {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM kontaktanfragen WHERE status = 'neu'");
    return parseInt(result.rows[0].count || 0);
  } catch (error) {
    console.error('Fehler beim Abrufen der neuen Anfragen:', error);
    return 0;
  }
}

// Dienstleistungen-Liste anzeigen
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const diensteQuery = await pool.query(`
      SELECT 
        id, 
        name, 
        beschreibung, 
        preis_basis, 
        einheit, 
        mwst_satz, 
        aktiv,
        created_at,
        updated_at
      FROM 
        dienstleistungen
      ORDER BY 
        name ASC
    `);

    res.render('dashboard/dienste/index', { 
      title: 'Dienstleistungen - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      services: diensteQuery.rows.map(service => ({
        ...service,
        created_at: format(new Date(service.created_at), 'dd.MM.yyyy'),
        updated_at: format(new Date(service.updated_at), 'dd.MM.yyyy')
      })),
      newRequestsCount: await getNewRequestsCount(),
      csrfToken: req.csrfToken(),
      messages: { 
        success: req.flash('success'), 
        error: req.flash('error') 
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Dienstleistungen:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

// Einzelne Dienstleistung abrufen
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        beschreibung, 
        preis_basis, 
        einheit, 
        mwst_satz, 
        aktiv,
        created_at,
        updated_at
      FROM dienstleistungen 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dienstleistung nicht gefunden' });
    }
    
    res.json({ 
      success: true, 
      service: {
        ...result.rows[0],
        created_at: format(new Date(result.rows[0].created_at), 'dd.MM.yyyy HH:mm'),
        updated_at: format(new Date(result.rows[0].updated_at), 'dd.MM.yyyy HH:mm')
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Dienstleistung:', error);
    res.status(500).json({ success: false, error: 'Datenbankfehler: ' + error.message });
  }
});

// Neue Dienstleistung erstellen
router.post('/neu', isAuthenticated, async (req, res) => {
  try {
    const { 
      name, 
      beschreibung, 
      preis_basis, 
      einheit, 
      mwst_satz, 
      aktiv 
    } = req.body;
    
    // Validierung
    if (!name || !preis_basis || !einheit) {
      req.flash('error', 'Bitte füllen Sie alle erforderlichen Felder aus.');
      return res.redirect('/dashboard/dienste');
    }
    
    // In Datenbank einfügen
    const result = await pool.query({
      text: `
        INSERT INTO dienstleistungen (
          name, 
          beschreibung, 
          preis_basis, 
          einheit, 
          mwst_satz, 
          aktiv
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `,
      values: [
        name, 
        beschreibung || null, 
        parseFloat(preis_basis), 
        einheit, 
        parseFloat(mwst_satz || 20), 
        aktiv === 'on'
      ]
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
router.post('/edit', isAuthenticated, async (req, res) => {
  try {
    const { 
      id, 
      name, 
      beschreibung, 
      preis_basis, 
      einheit, 
      mwst_satz, 
      aktiv 
    } = req.body;
    
    // Validierung
    if (!id || !name || !preis_basis || !einheit) {
      req.flash('error', 'Bitte füllen Sie alle erforderlichen Felder aus.');
      return res.redirect('/dashboard/dienste');
    }
    
    // In Datenbank aktualisieren
    await pool.query({
      text: `
        UPDATE dienstleistungen 
        SET 
          name = $1, 
          beschreibung = $2, 
          preis_basis = $3, 
          einheit = $4, 
          mwst_satz = $5, 
          aktiv = $6, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $7
      `,
      values: [
        name, 
        beschreibung || null, 
        parseFloat(preis_basis), 
        einheit, 
        parseFloat(mwst_satz || 20), 
        aktiv === 'on',
        id
      ]
    });
    
    req.flash('success', 'Dienstleistung erfolgreich aktualisiert.');
    res.redirect('/dashboard/dienste');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Dienstleistung:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/dienste');
  }
});

// Dienstleistung Status ändern
router.post('/toggle-status/:id', isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const { aktiv } = req.body;
    
    await pool.query({
      text: `
        UPDATE dienstleistungen 
        SET 
          aktiv = $1, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `,
      values: [aktiv, id]
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Dienstleistungs-Status:', error);
    res.status(500).json({ success: false, error: 'Datenbankfehler: ' + error.message });
  }
});

// Dienstleistungen Export
router.get('/export', isAuthenticated, async (req, res) => {
  try {
    const { format, status } = req.query;
    
    let condition = '';
    let params = [];
    
    if (status === 'aktiv') {
      condition = 'WHERE aktiv = true';
      params.push(true);
    } else if (status === 'inaktiv') {
      condition = 'WHERE aktiv = false';
      params.push(false);
    }
    
    const diensteQuery = await pool.query({
      text: `
        SELECT 
          id, 
          name, 
          beschreibung, 
          preis_basis, 
          einheit, 
          mwst_satz, 
          aktiv,
          created_at
        FROM 
          dienstleistungen
        ${condition}
        ORDER BY name ASC
      `,
      values: params
    });

    // CSV Export
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=dienstleistungen-export.csv');
      
      res.write('ID,Name,Beschreibung,Basis-Preis,Einheit,MwSt-Satz,Status,Erstellt am\n');
      
      diensteQuery.rows.forEach(dienst => {
        const csvLine = [
          dienst.id,
          `"${(dienst.name || '').replace(/"/g, '""')}"`,
          `"${(dienst.beschreibung || '').replace(/"/g, '""')}"`,
          dienst.preis_basis,
          `"${dienst.einheit}"`,
          dienst.mwst_satz,
          dienst.aktiv ? 'Aktiv' : 'Inaktiv',
          format(new Date(dienst.created_at), 'dd.MM.yyyy')
        ].join(',');
        
        res.write(csvLine + '\n');
      });
      
      res.end();
    } 
    // Excel Export
    else if (format === 'excel') {
      const Excel = require('exceljs');
      const workbook = new Excel.Workbook();
      const worksheet = workbook.addWorksheet('Dienstleistungen');
      
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Beschreibung', key: 'beschreibung', width: 50 },
        { header: 'Basis-Preis', key: 'preis_basis', width: 15 },
        { header: 'Einheit', key: 'einheit', width: 15 },
        { header: 'MwSt-Satz', key: 'mwst_satz', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Erstellt am', key: 'created_at', width: 20 }
      ];
      
      diensteQuery.rows.forEach(dienst => {
        worksheet.addRow({
          id: dienst.id,
          name: dienst.name,
          beschreibung: dienst.beschreibung || '',
          preis_basis: dienst.preis_basis,
          einheit: dienst.einheit,
          mwst_satz: dienst.mwst_satz,
          status: dienst.aktiv ? 'Aktiv' : 'Inaktiv',
          created_at: format(new Date(dienst.created_at), 'dd.MM.yyyy')
        });
      });
      
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=dienstleistungen-export.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
    } 
    // PDF Export
    else if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4'
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=dienstleistungen-export.pdf');
      
      doc.pipe(res);
      
      doc.fontSize(16).text('Dienstleistungen - Rising BSM', { align: 'center' });
      doc.moveDown();
      
      const tableTop = doc.y;
      const columnWidths = [30, 120, 100, 50, 50, 50, 50, 50];
      const headers = ['ID', 'Name', 'Beschreibung', 'Preis', 'Einheit', 'MwSt', 'Status', 'Erstellt'];
      
      doc.fillColor('#000')
         .fontSize(10)
         .font('Helvetica-Bold');
      
      headers.forEach((header, i) => {
        doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, { 
          width: columnWidths[i], 
          align: 'left' 
        });
      });
      
      doc.moveDown()
         .strokeColor('#ccc')
         .lineWidth(0.5)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.font('Helvetica').fontSize(8);
      
      diensteQuery.rows.forEach((dienst) => {
        const rowData = [
          dienst.id.toString(),
          dienst.name,
          (dienst.beschreibung || '').substring(0, 50),
          `€${dienst.preis_basis.toFixed(2)}`,
          dienst.einheit,
          `${dienst.mwst_satz}%`,
          dienst.aktiv ? 'Aktiv' : 'Inaktiv',
          format(new Date(dienst.created_at), 'dd.MM.yyyy')
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
      res.json({ 
        success: true, 
        message: 'Export nicht unterstützt', 
        format: format,
        count: diensteQuery.rows.length
      });
    }
  } catch (error) {
    console.error('Fehler beim Exportieren der Dienstleistungen:', error);
    res.status(500).json({
      success: false,
      error: 'Datenbankfehler: ' + error.message
    });
  }
});

// Rechnungsstatistiken für Dienstleistung
router.get('/:id/statistiken', isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      
      // Gesamtumsatz der Dienstleistung
      const umsatzQuery = await pool.query(`
        SELECT 
          SUM(rp.anzahl * rp.einzelpreis) as gesamtumsatz,
          COUNT(DISTINCT r.id) as rechnungsanzahl
        FROM 
          rechnungspositionen rp
          JOIN rechnungen r ON rp.rechnung_id = r.id
        WHERE 
          rp.dienstleistung_id = $1
      `, [id]);
  
      // Monatliche Umsatzentwicklung
      const monatlicheUmsatzQuery = await pool.query(`
        SELECT 
          DATE_TRUNC('month', r.rechnungsdatum) as monat,
          SUM(rp.anzahl * rp.einzelpreis) as umsatz
        FROM 
          rechnungspositionen rp
          JOIN rechnungen r ON rp.rechnung_id = r.id
        WHERE 
          rp.dienstleistung_id = $1
        GROUP BY 
          DATE_TRUNC('month', r.rechnungsdatum)
        ORDER BY 
          monat
      `, [id]);
  
      // Top-Kunden für diese Dienstleistung
      const topKundenQuery = await pool.query(`
        SELECT 
          k.id, 
          k.name, 
          SUM(rp.anzahl * rp.einzelpreis) as umsatz
        FROM 
          rechnungspositionen rp
          JOIN rechnungen r ON rp.rechnung_id = r.id
          JOIN kunden k ON r.kunde_id = k.id
        WHERE 
          rp.dienstleistung_id = $1
        GROUP BY 
          k.id, k.name
        ORDER BY 
          umsatz DESC
        LIMIT 5
      `, [id]);
  
      res.json({
        success: true,
        statistiken: {
          gesamtumsatz: umsatzQuery.rows[0].gesamtumsatz || 0,
          rechnungsanzahl: parseInt(umsatzQuery.rows[0].rechnungsanzahl || 0),
          monatlicheUmsaetze: monatlicheUmsatzQuery.rows.map(row => ({
            monat: format(new Date(row.monat), 'MM/yyyy'),
            umsatz: parseFloat(row.umsatz)
          })),
          topKunden: topKundenQuery.rows.map(row => ({
            kundenName: row.name,
            umsatz: parseFloat(row.umsatz)
          }))
        }
      });
    } catch (error) {
      console.error('Fehler bei Dienstleistungs-Statistiken:', error);
      res.status(500).json({
        success: false,
        error: 'Datenbankfehler: ' + error.message
      });
    }
  });
  
  // Preis-Vergleich mit anderen Dienstleistungen
  router.get('/:id/preisvergleich', isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      
      const preisvergleichQuery = await pool.query(`
        SELECT 
          id, 
          name, 
          preis_basis, 
          einheit
        FROM 
          dienstleistungen
        WHERE 
          id != $1
        ORDER BY 
          ABS(preis_basis - (
            SELECT preis_basis 
            FROM dienstleistungen 
            WHERE id = $1
          )) ASC
        LIMIT 5
      `, [id]);
  
      res.json({
        success: true,
        preisvergleich: preisvergleichQuery.rows.map(dienst => ({
          id: dienst.id,
          name: dienst.name,
          preis: parseFloat(dienst.preis_basis),
          einheit: dienst.einheit
        }))
      });
    } catch (error) {
      console.error('Fehler beim Preisvergleich:', error);
      res.status(500).json({
        success: false,
        error: 'Datenbankfehler: ' + error.message
      });
    }
  });
  
  // Protokollierung von Änderungen
  router.post('/:id/log', isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const { aktion, details } = req.body;
  
      await pool.query({
        text: `
          INSERT INTO dienstleistungen_log (
            dienstleistung_id, 
            benutzer_id, 
            benutzer_name, 
            aktion, 
            details
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        values: [
          id, 
          req.session.user.id, 
          req.session.user.name, 
          aktion, 
          details
        ]
      });
  
      res.json({ success: true });
    } catch (error) {
      console.error('Fehler bei Dienstleistungs-Logging:', error);
      res.status(500).json({
        success: false,
        error: 'Datenbankfehler: ' + error.message
      });
    }
  });
  
  // Dienstleistung löschen
  router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
  
      // Prüfen, ob Dienstleistung in Rechnungen verwendet wird
      const rechnungenQuery = await pool.query(`
        SELECT COUNT(*) as count 
        FROM rechnungspositionen 
        WHERE dienstleistung_id = $1
      `, [id]);
  
      if (parseInt(rechnungenQuery.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          error: 'Dienstleistung kann nicht gelöscht werden. Sie ist bereits in Rechnungen verwendet.'
        });
      }
  
      // Dienstleistung löschen
      await pool.query(`
        DELETE FROM dienstleistungen 
        WHERE id = $1
      `, [id]);
  
      // Löschung protokollieren
      await pool.query({
        text: `
          INSERT INTO dienstleistungen_log (
            dienstleistung_id, 
            benutzer_id, 
            benutzer_name, 
            aktion, 
            details
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        values: [
          id, 
          req.session.user.id, 
          req.session.user.name, 
          'deleted', 
          'Dienstleistung wurde gelöscht'
        ]
      });
  
      res.json({ success: true });
    } catch (error) {
      console.error('Fehler beim Löschen der Dienstleistung:', error);
      res.status(500).json({
        success: false,
        error: 'Datenbankfehler: ' + error.message
      });
    }
  });
  
  module.exports = router;