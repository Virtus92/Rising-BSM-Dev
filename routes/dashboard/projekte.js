const express = require('express');
const router = express.Router();
const { format, formatDistanceToNow, isToday, isTomorrow } = require('date-fns');
const { de } = require('date-fns/locale');
const pool = require('../../db');

// Hilfsfunktionen
function getProjektStatusInfo(status) {
  const statusMap = {
    'neu': { label: 'Neu', className: 'info' },
    'in_bearbeitung': { label: 'In Bearbeitung', className: 'primary' },
    'abgeschlossen': { label: 'Abgeschlossen', className: 'success' },
    'storniert': { label: 'Storniert', className: 'secondary' }
  };
  return statusMap[status] || { label: 'Unbekannt', className: 'secondary' };
}

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

// Projekte-Liste anzeigen
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.query;
    
    let queryText = `
      SELECT 
        p.id, 
        p.titel, 
        p.kunde_id,
        p.start_datum,
        p.end_datum,
        p.status,
        p.betrag,
        k.name AS kunde_name,
        d.name AS dienstleistung_name
      FROM 
        projekte p
        LEFT JOIN kunden k ON p.kunde_id = k.id
        LEFT JOIN dienstleistungen d ON p.dienstleistung_id = d.id
    `;

    const queryParams = [];
    
    if (status) {
      queryText += ' WHERE p.status = $1';
      queryParams.push(status);
    }
    
    queryText += ' ORDER BY p.start_datum DESC';
    
    const projekteQuery = await pool.query({
      text: queryText,
      values: queryParams
    });
    
    const projects = projekteQuery.rows.map(projekt => {
      const statusInfo = getProjektStatusInfo(projekt.status);
      return {
        id: projekt.id,
        titel: projekt.titel,
        kunde_id: projekt.kunde_id,
        kunde_name: projekt.kunde_name || 'Kein Kunde zugewiesen',
        dienstleistung: projekt.dienstleistung_name || 'Nicht zugewiesen',
        start_datum: format(new Date(projekt.start_datum), 'dd.MM.yyyy'),
        end_datum: projekt.end_datum ? format(new Date(projekt.end_datum), 'dd.MM.yyyy') : '-',
        status: projekt.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className,
        betrag: projekt.betrag ? parseFloat(projekt.betrag) : null
      };
    });

    res.render('dashboard/projekte/index', { 
      title: 'Projekte - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      projects,
      newRequestsCount: await getNewRequestsCount(),
      statusFilter: status || '',
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Fehler beim Laden der Projekte:', error);
    res.status(500).render('error', { 
      message: 'Datenbankfehler: ' + error.message, 
      error: error
    });
  }
});

// Neues Projekt-Formular anzeigen
router.get('/neu', isAuthenticated, async (req, res) => {
  try {
    // Kunden für Dropdown
    const kundenQuery = await pool.query(`
      SELECT id, name FROM kunden ORDER BY name ASC
    `);
    
    // Dienstleistungen für Dropdown
    const dienstleistungenQuery = await pool.query(`
      SELECT id, name FROM dienstleistungen 
      WHERE aktiv = true 
      ORDER BY name ASC
    `);
    
    res.render('dashboard/projekte/neu', {
      title: 'Neues Projekt - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/projekte',
      kunden: kundenQuery.rows,
      dienstleistungen: dienstleistungenQuery.rows,
      formData: {
        titel: '',
        kunde_id: req.query.kunde_id || '',
        dienstleistung_id: '',
        start_datum: format(new Date(), 'yyyy-MM-dd'),
        end_datum: '',
        betrag: '',
        beschreibung: '',
        status: 'neu'
      },
      newRequestsCount: await getNewRequestsCount(),
      csrfToken: req.csrfToken(),
      messages: { 
        success: req.flash('success'), 
        error: req.flash('error') 
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Projektformulars:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Neues Projekt speichern
router.post('/neu', isAuthenticated, async (req, res) => {
  try {
    const { 
      titel, 
      kunde_id, 
      dienstleistung_id,
      start_datum, 
      end_datum, 
      betrag, 
      beschreibung, 
      status 
    } = req.body;
    
    // Validierung
    if (!titel || !start_datum) {
      req.flash('error', 'Titel und Start-Datum sind Pflichtfelder.');
      return res.redirect('/dashboard/projekte/neu');
    }
    
    // In Datenbank einfügen
    const result = await pool.query({
      text: `
        INSERT INTO projekte (
          titel, 
          kunde_id, 
          dienstleistung_id,
          start_datum, 
          end_datum, 
          betrag, 
          beschreibung, 
          status,
          erstellt_von
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `,
      values: [
        titel, 
        kunde_id || null, 
        dienstleistung_id || null,
        start_datum, 
        end_datum || null, 
        betrag ? parseFloat(betrag) : null, 
        beschreibung || null, 
        status || 'neu',
        req.session.user.id
      ]
    });
    
    const projektId = result.rows[0].id;
    
    // Benachrichtigung für Kunden, wenn zugewiesen
    if (kunde_id) {
      await pool.query({
        text: `
          INSERT INTO benachrichtigungen (
            benutzer_id, typ, titel, nachricht, referenz_id
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        values: [
          kunde_id,
          'projekt',
          'Neues Projekt erstellt',
          `Ein neues Projekt "${titel}" wurde angelegt.`,
          projektId
        ]
      });
    }
    
    req.flash('success', 'Projekt erfolgreich angelegt.');
    res.redirect(`/dashboard/projekte/${projektId}`);
  } catch (error) {
    console.error('Fehler beim Anlegen des Projekts:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/projekte/neu');
  }
});

// Einzelnes Projekt anzeigen
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Projekt aus der Datenbank abrufen
    const projektQuery = await pool.query({
      text: `
        SELECT 
          p.*, 
          k.name AS kunde_name
        FROM 
          projekte p
          LEFT JOIN kunden k ON p.kunde_id = k.id
        WHERE 
          p.id = $1
      `,
      values: [id]
    });
    
    if (projektQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Projekt mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const projekt = projektQuery.rows[0];
    const statusInfo = getProjektStatusInfo(projekt.status);
    
    // Termine des Projekts abrufen
    const termineQuery = await pool.query({
      text: `
        SELECT id, titel, termin_datum, status 
        FROM termine 
        WHERE projekt_id = $1 
        ORDER BY termin_datum ASC
      `,
      values: [id]
    });
    
    // Notizen zu diesem Projekt abrufen
    const notizenQuery = await pool.query({
      text: `
        SELECT * FROM projekt_notizen 
        WHERE projekt_id = $1 
        ORDER BY erstellt_am DESC
      `,
      values: [id]
    });
    
    const newRequestsCount = await getNewRequestsCount();
    
    res.render('dashboard/projekte/detail', {
      title: `Projekt: ${projekt.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/projekte',
      projekt: {
        id: projekt.id,
        titel: projekt.titel,
        kunde_id: projekt.kunde_id,
        kunde_name: projekt.kunde_name || 'Kein Kunde zugewiesen',
        start_datum: format(new Date(projekt.start_datum), 'dd.MM.yyyy'),
        end_datum: projekt.end_datum ? format(new Date(projekt.end_datum), 'dd.MM.yyyy') : 'Nicht festgelegt',
        betrag: projekt.betrag ? parseFloat(projekt.betrag).toLocaleString('de-DE', {style: 'currency', currency: 'EUR'}) : 'Nicht festgelegt',
        beschreibung: projekt.beschreibung || 'Keine Beschreibung vorhanden',
        status: projekt.status,
        statusLabel: statusInfo.label,
        statusClass: statusInfo.className
      },
      termine: termineQuery.rows.map(termin => {
        const terminStatus = termin.status === 'geplant' ? { label: 'Geplant', className: 'warning' } :
                          termin.status === 'bestaetigt' ? { label: 'Bestätigt', className: 'success' } :
                          termin.status === 'abgeschlossen' ? { label: 'Abgeschlossen', className: 'primary' } :
                          { label: 'Storniert', className: 'secondary' };
        return {
          id: termin.id,
          titel: termin.titel,
          datum: format(new Date(termin.termin_datum), 'dd.MM.yyyy, HH:mm'),
          statusLabel: terminStatus.label,
          statusClass: terminStatus.className
        };
      }),
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
    console.error('Fehler beim Anzeigen des Projekts:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Projekt Status aktualisieren
router.post('/update-status', isAuthenticated, async (req, res) => {
  try {
    const { id, status, note } = req.body;
    
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
    
    // Für AJAX-Anfragen JSON zurückgeben
    if (req.xhr || req.headers.accept && req.headers.accept.includes('json')) {
      return res.json({ success: true });
    }
    
    // Für normale Formulare Flash-Message und Redirect
    req.flash('success', 'Projekt-Status erfolgreich aktualisiert.');
    res.redirect(`/dashboard/projekte/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Projekt-Status:', error);
    
    // Für AJAX-Anfragen JSON zurückgeben
    if (req.xhr || req.headers.accept && req.headers.accept.includes('json')) {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    // Für normale Formulare Flash-Message und Redirect
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/projekte/${req.body.id}`);
  }
});

// Projekt bearbeiten (Formular anzeigen)
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Projekt aus der Datenbank abrufen
    const projektQuery = await pool.query({
      text: `
        SELECT 
          p.*, 
          k.name AS kunde_name
        FROM 
          projekte p
          LEFT JOIN kunden k ON p.kunde_id = k.id
        WHERE 
          p.id = $1
      `,
      values: [id]
    });
    
    if (projektQuery.rows.length === 0) {
      return res.status(404).render('error', {
        message: `Projekt mit ID ${id} nicht gefunden`,
        error: { status: 404 }
      });
    }
    
    const projekt = projektQuery.rows[0];
    
    // Kunden für Dropdown abrufen
    const kundenQuery = await pool.query(`
      SELECT id, name FROM kunden ORDER BY name ASC
    `);
    
    const newRequestsCount = await getNewRequestsCount();
    
    res.render('dashboard/projekte/edit', {
      title: `Projekt bearbeiten: ${projekt.titel} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/projekte',
      projekt: {
        id: projekt.id,
        titel: projekt.titel,
        kunde_id: projekt.kunde_id,
        kunde_name: projekt.kunde_name || 'Kein Kunde zugewiesen',
        start_datum: projekt.start_datum.toISOString().split('T')[0],
        end_datum: projekt.end_datum ? projekt.end_datum.toISOString().split('T')[0] : '',
        betrag: projekt.betrag || '',
        beschreibung: projekt.beschreibung || '',
        status: projekt.status
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

// Projekt aktualisieren
router.post('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      titel, 
      kunde_id, 
      start_datum, 
      end_datum, 
      betrag, 
      beschreibung, 
      status 
    } = req.body;
    
    // Validierung
    if (!titel || !start_datum) {
      req.flash('error', 'Titel und Start-Datum sind Pflichtfelder.');
      return res.redirect(`/dashboard/projekte/${id}/edit`);
    }
    
    // In Datenbank aktualisieren
    await pool.query({
      text: `
        UPDATE projekte SET 
          titel = $1, 
          kunde_id = $2, 
          start_datum = $3, 
          end_datum = $4, 
          betrag = $5, 
          beschreibung = $6, 
          status = $7, 
          updated_at = NOW() 
        WHERE id = $8
      `,
      values: [
        titel, 
        kunde_id || null, 
        start_datum, 
        end_datum || null, 
        betrag || null, 
        beschreibung || null, 
        status || 'neu',
        id
      ]
    });
    
    req.flash('success', 'Projekt erfolgreich aktualisiert.');
    res.redirect(`/dashboard/projekte/${id}`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Projekts:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect(`/dashboard/projekte/${req.params.id}/edit`);
  }
});

// Weitere Routen für Projektbearbeitung, Statusänderung usw. ...

module.exports = router;