const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

// Login-Seite rendern
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('login', {
    title: 'Login - Rising BSM',
    csrfToken: req.csrfToken(),
    error: req.flash('error')[0] || null,
    success: req.flash('success')[0] || null
  });
});

// Login verarbeiten
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    // Benutzer in der Datenbank suchen
    const result = await pool.query(
      'SELECT * FROM benutzer WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    // Wenn Benutzer nicht gefunden oder Passwort falsch
    if (!user) {
      console.log("User not found with email:", email);
      req.flash('error', 'Ungültige E-Mail-Adresse oder Passwort');
      return res.redirect('/login');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwort);
    if (!passwordMatch) {
      console.log("Password does not match for user:", email);
      req.flash('error', 'Ungültige E-Mail-Adresse oder Passwort');
      return res.redirect('/login');
    }

    // Sitzung erstellen
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.rolle
    };

    // Cookie-Lebensdauer bei "Angemeldet bleiben" verlängern
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 Tage
    }

    // Auf Dashboard weiterleiten
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login Fehler:', error);
    req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    res.redirect('/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout Fehler:', err);
    }
    res.redirect('/login');
  });
});

// Passwort-Vergessen-Seite
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', {
    title: 'Passwort vergessen - Rising BSM',
    csrfToken: req.csrfToken(),
    error: req.flash('error')[0] || null,
    success: req.flash('success')[0] || null
  });
});

// Passwort-Vergessen verarbeiten
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Prüfen, ob Benutzer existiert
    const result = await pool.query(
      'SELECT * FROM benutzer WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Um keine Informationen preiszugeben, täuschen wir Erfolg vor
      req.flash('success', 'Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen eine Anleitung zum Zurücksetzen Ihres Passworts geschickt.');
      return res.redirect('/login');
    }

    const user = result.rows[0];

    // Hier würde Code zum Versenden einer E-Mail mit dem Reset-Link folgen
    // Für dieses Beispiel überspringen wir diesen Teil

    req.flash('success', 'Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen eine Anleitung zum Zurücksetzen Ihres Passworts geschickt.');
    res.redirect('/login');
  } catch (error) {
    console.error('Passwort vergessen Fehler:', error);
    req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    res.redirect('/forgot-password');
  }
});

module.exports = router;