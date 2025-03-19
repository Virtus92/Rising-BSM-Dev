const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../services/db.service');
const { body, validationResult } = require('express-validator');

// Middleware to check if setup is needed
const setupRequired = async (req, res, next) => {
  try {
    // Check if any users exist
   // const userCheck = await pool.query('SELECT COUNT(*) FROM benutzer');
   // 
   // if (parseInt(userCheck.rows[0].count) > 0) {
   //   req.flash('info', 'Setup wurde bereits durchgeführt.');
   //   return res.redirect('/login');
   // }
    
    next();
  } catch (error) {
    console.error('Setup check error:', error);
    res.status(500).render('error', { 
      message: 'Fehler bei der Überprüfung des Systemstatus' 
    });
  }
};

// Apply the middleware to both GET and POST routes
router.get('/setup', setupRequired, async (req, res) => {
  try {
    res.render('setup', { 
      title: 'Ersteinrichtung - Rising BSM',
      error: null,
      name: '',
      email: '',
      company_name: '',
      company_email: '',
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).render('error', { 
      message: 'Fehler bei der Systeminitialisierung' 
    });
  }
});

// Validation rules
const setupValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name muss mindestens 3 Zeichen lang sein'),
  body('email').trim().isEmail().withMessage('Gültige E-Mail-Adresse erforderlich'),
  body('password').isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwörter stimmen nicht überein');
    }
    return true;
  }),
  body('company_name').trim().isLength({ min: 2 }).withMessage('Unternehmensname erforderlich'),
  body('company_email').trim().isEmail().withMessage('Gültige Unternehmens-E-Mail erforderlich')
];

router.post('/setup', setupRequired, setupValidation, async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    company_name,
    company_email
  } = req.body;

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('setup', { 
      error: errors.array()[0].msg,
      name, 
      email, 
      company_name, 
      company_email,
      csrfToken: req.csrfToken()
    });
  }

  try {
    // Use db.service transaction method instead of direct pool.connect
    await pool.transaction(async (client) => {
      // Passwort hashen
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Ersten Admin-Benutzer anlegen
      const userQuery = `
        INSERT INTO benutzer 
        (name, email, passwort, rolle, status) 
        VALUES ($1, $2, $3, 'admin', 'aktiv') 
        RETURNING id
      `;
      const userResult = await client.query(userQuery, [name, email, hashedPassword]);
      const userId = userResult.rows[0].id;

      // Unternehmenseinstellungen speichern
      const settingsQuery = `
        INSERT INTO system_settings 
        (schluessel, wert) 
        VALUES 
        ('company_name', $1),
        ('company_email', $2),
        ('setup_complete', 'true'),
        ('setup_date', $3)
      `;
      await client.query(settingsQuery, [
        company_name, 
        company_email,
        new Date().toISOString()
      ]);
    });
    
    // Redirect zur Login-Seite
    req.flash('success', 'Setup erfolgreich abgeschlossen. Bitte melden Sie sich an.');
    res.redirect('/login');
  } catch (error) {
    console.error('Setup error:', error);
    res.render('setup', { 
      error: 'Ein Fehler ist aufgetreten: ' + error.message,
      name, 
      email, 
      company_name, 
      company_email,
      csrfToken: req.csrfToken()
    });
  }
});

module.exports = router;