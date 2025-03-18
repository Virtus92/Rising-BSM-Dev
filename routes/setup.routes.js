const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../services/db.service');

router.get('/setup', async (req, res) => {
  try {
    // Prüfen, ob bereits Benutzer existieren
    // const userCheck = await pool.query('SELECT COUNT(*) FROM benutzer');
    // 
    // if (userCheck.rows[0].count > 0) {
    //   return res.redirect('/login');
    // }

    res.render('setup', { 
      title: 'Ersteinrichtung - Rising BSM',
      error: null 
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).render('error', { 
      message: 'Fehler bei der Systeminitialisierung' 
    });
  }
});

router.post('/setup', async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    confirm_password,
    company_name,
    company_email
  } = req.body;

  try {
    // Validierung
    if (password !== confirm_password) {
      return res.render('setup', { 
        error: 'Passwörter stimmen nicht überein',
        name, email, company_name, company_email 
      });
    }

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
    const userResult = await pool.query(userQuery, [name, email, hashedPassword]);
    const userId = userResult.rows[0].id;

    // Unternehmenseinstellungen speichern
    const settingsQuery = `
      INSERT INTO system_settings 
      (schluessel, wert) 
      VALUES 
      ('company_name', $1),
      ('company_email', $2)
    `;
    await pool.query(settingsQuery, [company_name, company_email]);

    // Redirect zur Login-Seite
    req.flash('success', 'Setup erfolgreich. Bitte melden Sie sich an.');
    res.redirect('/login');

  } catch (error) {
    console.error('Setup error:', error);
    res.render('setup', { 
      error: 'Ein Fehler ist aufgetreten',
      name, email, company_name, company_email 
    });
  }
});

module.exports = router;