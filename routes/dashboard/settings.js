const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Authentifizierungs-Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

// Einstellungen-Seite anzeigen
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const settingsQuery = await pool.query(`
      SELECT * FROM benutzer_einstellungen WHERE benutzer_id = $1
    `, [req.session.user.id]);
    
    res.render('dashboard/settings', {
      title: 'Einstellungen - Rising BSM',
      user: req.session.user,
      settings: settingsQuery.rows.length > 0 ? settingsQuery.rows[0] : {
        sprache: 'de',
        dark_mode: false,
        benachrichtigungen_email: true,
        benachrichtigungen_intervall: 'sofort'
      },
      currentPath: '/dashboard/settings',
      csrfToken: req.csrfToken(),
      messages: { 
        success: req.flash('success'), 
        error: req.flash('error') 
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Einstellungen aktualisieren
router.post('/update', isAuthenticated, async (req, res) => {
  try {
    const { 
      sprache, 
      dark_mode, 
      benachrichtigungen_email, 
      benachrichtigungen_intervall 
    } = req.body;
    
    // Vorhandene Einstellungen prüfen
    const existingSettingsQuery = await pool.query(
      'SELECT * FROM benutzer_einstellungen WHERE benutzer_id = $1',
      [req.session.user.id]
    );
    
    if (existingSettingsQuery.rows.length > 0) {
      // Bestehende Einstellungen aktualisieren
      await pool.query(
        `UPDATE benutzer_einstellungen 
         SET 
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
           benutzer_id, 
           sprache, 
           dark_mode, 
           benachrichtigungen_email, 
           benachrichtigungen_intervall
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
    
    // Sitzungsdaten aktualisieren
    req.session.user.sprache = sprache || 'de';
    req.session.user.dark_mode = dark_mode === 'on';
    
    req.flash('success', 'Einstellungen erfolgreich gespeichert.');
    res.redirect('/dashboard/settings');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/settings');
  }
});

// Benachrichtigungseinstellungen
router.post('/notifications', isAuthenticated, async (req, res) => {
  try {
    const { 
      email_notifications, 
      push_notifications, 
      notification_frequency 
    } = req.body;
    
    await pool.query(
      `UPDATE benutzer_einstellungen 
       SET 
         benachrichtigungen_email = $1, 
         benachrichtigungen_push = $2, 
         benachrichtigungen_intervall = $3,
         updated_at = CURRENT_TIMESTAMP 
       WHERE benutzer_id = $4`,
      [
        email_notifications === 'on',
        push_notifications === 'on',
        notification_frequency || 'sofort',
        req.session.user.id
      ]
    );
    
    req.flash('success', 'Benachrichtigungseinstellungen aktualisiert.');
    res.redirect('/dashboard/settings');
  } catch (error) {
    console.error('Fehler bei Benachrichtigungseinstellungen:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/settings');
  }
});

module.exports = router;