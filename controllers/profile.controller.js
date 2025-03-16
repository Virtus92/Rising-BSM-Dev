/**
 * Profile Controller
 * Handles all user profile related business logic
 */
const bcrypt = require('bcrypt');
const { pool } = require('../services/db.service');
const { formatDateSafely } = require('../utils/formatters');
const { validateInput } = require('../utils/validators');

/**
 * Get current user profile data
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    // Basis-Profildaten abrufen
    const userResult = await pool.query(
      'SELECT id, name, email, rolle, profilbild, status FROM benutzer WHERE id = $1',
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      const error = new Error('Benutzer nicht gefunden');
      error.statusCode = 404;
      throw error;
    }

    // Benutzereinstellungen abrufen
    const settingsResult = await pool.query(
      'SELECT * FROM benutzer_einstellungen WHERE benutzer_id = $1',
      [req.session.userId]
    );

    // Benutzeraktivitäten abrufen (letzte 5)
    const activityResult = await pool.query(
      'SELECT aktivitaet, ip_adresse, created_at FROM benutzer_aktivitaet WHERE benutzer_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.session.userId]
    );

    return {
      user: userResult.rows[0],
      settings: settingsResult.rows[0] || {},
      activity: activityResult.rows
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    error.success = false;
    next(error);
  }
};

/**
 * Profil anzeigen
 */
exports.getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, telefon, firma, rolle FROM benutzer WHERE id = $1',
      [req.session.userId]
    );

    res.status(200).json({
      title: 'Mein Profil - Rising BSM',
      user: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Profil aktualisieren
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Validierungsschema
    const schema = {
      name: { type: 'text', required: true, maxLength: 100 },
      email: { type: 'email', required: true },
      telefon: { type: 'phone' },
      firma: { type: 'text', maxLength: 100 }
    };

    // Validierung durchführen
    const validation = validateInput(req.body, schema);

    if (!validation.isValid) {
      req.flash('error', 'Bitte überprüfen Sie Ihre Eingaben');
      req.flash('errors', validation.errors);
      req.flash('formData', req.body);
      return res.redirect('/profile');
    }

    const { name, email, telefon, firma } = validation.data;

    // Prüfen ob E-Mail bereits verwendet wird
    const existingUser = await pool.query(
      'SELECT id FROM benutzer WHERE email = $1 AND id != $2',
      [email, req.session.userId]
    );

    if (existingUser.rows.length > 0) {
      req.flash('error', 'Diese E-Mail-Adresse wird bereits verwendet');
      req.flash('formData', req.body);
      return res.redirect('/profile');
    }

    // Profil aktualisieren
    await pool.query(
      'UPDATE benutzer SET name = $1, email = $2, telefon = $3, firma = $4 WHERE id = $5',
      [name, email, telefon, firma, req.session.userId]
    );

    req.flash('success', 'Profil wurde erfolgreich aktualisiert');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

/**
 * Passwort ändern
 */
exports.changePassword = async (req, res, next) => {
  try {
    // Validierungsschema
    const schema = {
      currentPassword: { type: 'text', required: true },
      newPassword: { type: 'text', required: true, minLength: 8 },
      confirmPassword: { type: 'text', required: true }
    };

    // Validierung durchführen
    const validation = validateInput(req.body, schema);

    if (!validation.isValid) {
      req.flash('error', 'Bitte überprüfen Sie Ihre Eingaben');
      req.flash('errors', validation.errors);
      return res.redirect('/profile/password');
    }

    const { currentPassword, newPassword, confirmPassword } = validation.data;

    // Passwörter vergleichen
    if (newPassword !== confirmPassword) {
      req.flash('error', 'Die neuen Passwörter stimmen nicht überein');
      return res.redirect('/profile/password');
    }

    // Aktuelles Passwort prüfen
    const result = await pool.query(
      'SELECT password FROM benutzer WHERE id = $1',
      [req.session.userId]
    );

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      req.flash('error', 'Das aktuelle Passwort ist nicht korrekt');
      return res.redirect('/profile/password');
    }

    // Neues Passwort hashen und speichern
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE benutzer SET password = $1 WHERE id = $2',
      [hashedPassword, req.session.userId]
    );

    req.flash('success', 'Passwort wurde erfolgreich geändert');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

/**
 * Update profile picture
 */
exports.updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return {
        success: false,
        error: 'Keine Datei hochgeladen'
      };
    }

    // Profilbild-Pfad aktualisieren
    const result = await pool.query(
      'UPDATE benutzer SET profilbild = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING profilbild',
      [req.file.path, req.session.userId]
    );

    return {
      success: true,
      profilePicture: result.rows[0].profilbild
    };
  } catch (error) {
    console.error('Error updating profile picture:', error);
    error.success = false;
    next(error);
  }
};

/**
 * Update notification settings
 */
exports.updateNotificationSettings = async (req, res, next) => {
  try {
    const { email_notifications, push_notifications, notification_interval } = req.body;

    // Prüfen ob Einstellungen existieren
    const checkResult = await pool.query(
      'SELECT benutzer_id FROM benutzer_einstellungen WHERE benutzer_id = $1',
      [req.session.userId]
    );

    let result;
    if (checkResult.rows.length === 0) {
      // Neue Einstellungen erstellen
      result = await pool.query(
        'INSERT INTO benutzer_einstellungen (benutzer_id, benachrichtigungen_email, benachrichtigungen_push, benachrichtigungen_intervall) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.session.userId, email_notifications, push_notifications, notification_interval]
      );
    } else {
      // Bestehende Einstellungen aktualisieren
      result = await pool.query(
        'UPDATE benutzer_einstellungen SET benachrichtigungen_email = $1, benachrichtigungen_push = $2, benachrichtigungen_intervall = $3, updated_at = CURRENT_TIMESTAMP WHERE benutzer_id = $4 RETURNING *',
        [email_notifications, push_notifications, notification_interval, req.session.userId]
      );
    }

    return {
      success: true,
      settings: result.rows[0]
    };
  } catch (error) {
    console.error('Error updating notification settings:', error);
    error.success = false;
    next(error);
  }
};