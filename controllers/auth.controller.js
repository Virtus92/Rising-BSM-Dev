/**
 * Auth Controller
 * Handles all authentication related business logic
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../services/db.service');
const { validateInput } = require('../utils/validators');
const { sendMail } = require('../services/mail.service');

/**
 * Handle user login
 */
exports.login = async (req, res, next) => {
  try {
    // Validierungsschema
    const schema = {
      email: { type: 'email', required: true },
      password: { type: 'text', required: true }
    };

    // Validierung durchführen
    const validation = validateInput(req.body, schema);

    if (!validation.isValid) {
      req.flash('error', 'Bitte überprüfen Sie Ihre Eingaben');
      req.flash('errors', validation.errors);
      return res.redirect('/login');
    }

    const { email, password } = validation.data;

    // Benutzer in DB suchen
    const result = await pool.query(
      'SELECT * FROM benutzer WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    // Prüfen ob Benutzer existiert und Passwort korrekt
    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash('error', 'E-Mail oder Passwort ungültig');
      return res.redirect('/login');
    }

    // Prüfe Account-Status
    if (user.status !== 'aktiv') {
      req.flash('error', 'Ihr Account ist nicht aktiv');
      return res.redirect('/login');
    }

    // Session erstellen
    req.session.userId = user.id;
    req.session.userRole = user.rolle;
    
    // Login-Aktivität loggen
    await pool.query(
      'INSERT INTO benutzer_aktivitaet (benutzer_id, aktivitaet, ip_adresse) VALUES ($1, $2, $3)',
      [user.id, 'login', req.ip]
    );

    res.redirect('/dashboard');
  } catch (err) {
    next(err);
  }
};

/**
 * Handle forgot password request
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    // Validierungsschema
    const schema = {
      email: { type: 'email', required: true }
    };

    // Validierung durchführen
    const validation = validateInput(req.body, schema);

    if (!validation.isValid) {
      req.flash('error', 'Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return res.redirect('/forgot-password');
    }

    const { email } = validation.data;

    // Benutzer in DB suchen
    const result = await pool.query(
      'SELECT id FROM benutzer WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      req.flash('info', 'Falls ein Account mit dieser E-Mail existiert, wurde eine E-Mail verschickt');
      return res.redirect('/login');
    }

    // Token generieren
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token in DB speichern
    await pool.query(
      'UPDATE benutzer SET reset_token = $1, reset_token_expires = NOW() + INTERVAL \'1 hour\' WHERE email = $2',
      [hashedToken, email]
    );

    // Reset-Link per E-Mail versenden
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    await sendMail({
      to: email,
      subject: 'Passwort zurücksetzen',
      text: `Um Ihr Passwort zurückzusetzen, klicken Sie bitte auf folgenden Link: ${resetUrl}`
    });

    req.flash('info', 'Falls ein Account mit dieser E-Mail existiert, wurde eine E-Mail verschickt');
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
};

/**
 * Validate reset token
 */
exports.validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      const error = new Error('Invalid token');
      error.statusCode = 400;
      throw error;
    }

    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and valid expiry
    const result = await pool.query(
      `SELECT id, email FROM benutzer 
       WHERE reset_token = $1 
       AND reset_token_expiry > CURRENT_TIMESTAMP`,
      [hashedToken]
    );

    if (result.rows.length === 0) {
      const error = new Error('Invalid or expired token');
      error.statusCode = 400;
      throw error;
    }

    return {
      success: true,
      userId: result.rows[0].id,
      email: result.rows[0].email
    };
  } catch (error) {
    console.error('Token validation failed:', error);
    error.success = false;
    next(error);
  }
};

/**
 * Reset password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Token hashen
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Benutzer mit gültigem Token suchen
    const result = await pool.query(
      'SELECT id FROM benutzer WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [hashedToken]
    );

    if (result.rows.length === 0) {
      req.flash('error', 'Der Link ist ungültig oder abgelaufen');
      return res.redirect('/login');
    }

    // Validierungsschema
    const schema = {
      password: { type: 'text', required: true, minLength: 8 },
      passwordConfirm: { type: 'text', required: true }
    };

    // Validierung durchführen
    const validation = validateInput(req.body, schema);

    if (!validation.isValid) {
      req.flash('error', 'Bitte überprüfen Sie Ihre Eingaben');
      req.flash('errors', validation.errors);
      return res.redirect(`/reset-password/${token}`);
    }

    const { password, passwordConfirm } = validation.data;

    // Passwörter vergleichen
    if (password !== passwordConfirm) {
      req.flash('error', 'Die Passwörter stimmen nicht überein');
      return res.redirect(`/reset-password/${token}`);
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Passwort aktualisieren und Token zurücksetzen
    await pool.query(
      'UPDATE benutzer SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = $2',
      [hashedPassword, hashedToken]
    );

    req.flash('success', 'Ihr Passwort wurde erfolgreich zurückgesetzt');
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
};

/**
 * Log out user
 */
exports.logout = async (req, res, next) => {
  try {
    if (req.session && req.session.user) {
      // Log logout activity
      await pool.query(
        `INSERT INTO benutzer_aktivitaet (benutzer_id, aktivitaet, ip_adresse) 
         VALUES ($1, $2, $3)`,
        [req.session.user.id, 'logout', req.ip]
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Logout failed:', error);
    error.success = false;
    next(error);
  }
};

exports.renderForgotPassword = (req, res) => {
  res.status(200).json({
    title: 'Passwort vergessen - Rising BSM',
    csrfToken: req.csrfToken()
  });
};

exports.renderResetPassword = (req, res) => {
  const { token } = req.params;
  
  // Token-Validierung
  if (!token) {
    return res.redirect('/login');
  }
  
  res.status(200).json({
    title: 'Passwort zurücksetzen - Rising BSM',
    token: token
  });
};