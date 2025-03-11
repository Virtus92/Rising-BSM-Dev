import express from 'express';
import bcrypt from 'bcryptjs';
import * as db from '../db.js';
import { sanitizeAndValidate } from '../utils/helpers.js';

const router = express.Router();

// Login-Seite rendern
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('login', {
    title: 'Login - Rising BSM',
    error: req.flash('error')[0] || null,
    success: req.flash('success')[0] || null,
    csrfToken: req.csrfToken()
  });
});

// Login verarbeiten
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    // Daten validieren
    const { isValid, errors } = sanitizeAndValidate(
      { email, password },
      {
        email: { required: true, type: 'string' },
        password: { required: true, type: 'string' }
      }
    );

    if (!isValid) {
      req.flash('error', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return res.redirect('/login');
    }

    // Benutzer in der Datenbank suchen
    const user = await db.getOne(
      'SELECT * FROM benutzer WHERE email = $1',
      [email]
    );

    if (!user) {
      req.flash('error', 'Ungültige E-Mail-Adresse oder Passwort');
      return res.redirect('/login');
    }

    // Passwort überprüfen
    const passwordMatches = await bcrypt.compare(password, user.passwort);
    
    if (!passwordMatches) {
      req.flash('error', 'Ungültige E-Mail-Adresse oder Passwort');
      return res.redirect('/login');
    }

    // Sitzung erstellen - Sicherheitsverbesserung: Passwort nicht in Session speichern
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.rolle,
      initials: user.name.split(' ').map(n => n[0]).join('')
    };

    // Cookie-Lebensdauer bei "Angemeldet bleiben" verlängern
    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 Tage
    } else {
      // Standardmäßig 8 Stunden
      req.session.cookie.maxAge = 8 * 60 * 60 * 1000;
    }

    // Letzte Anmeldung aktualisieren
    await db.query(
      'UPDATE benutzer SET letzter_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Auf Dashboard weiterleiten
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login-Fehler:', error);
    req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    res.redirect('/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout-Fehler:', err);
    }
    res.redirect('/login');
  });
});

// Passwort-Vergessen-Seite
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', {
    title: 'Passwort vergessen - Rising BSM',
    error: req.flash('error')[0] || null,
    success: req.flash('success')[0] || null,
    csrfToken: req.csrfToken()
  });
});

// Passwort-Vergessen verarbeiten
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Daten validieren
    const { isValid } = sanitizeAndValidate(
      { email },
      { email: { required: true, type: 'string' } }
    );

    if (!isValid) {
      req.flash('error', 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return res.redirect('/forgot-password');
    }

    // Sanitized email
    const sanitizedEmail = email.trim().toLowerCase();

    // Prüfen, ob Benutzer existiert
    const user = await db.getOne(
      'SELECT * FROM benutzer WHERE email = $1',
      [sanitizedEmail]
    );

    // Um keine Informationen preiszugeben, täuschen wir Erfolg vor
    // unabhängig davon, ob der Benutzer existiert
    req.flash('success', 'Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen eine Anleitung zum Zurücksetzen Ihres Passworts geschickt.');
    
    // Hier würde Code zum Versenden einer E-Mail mit dem Reset-Link folgen
    // wenn der Benutzer existiert
    if (user) {
      // TODO: Implement actual password reset email functionality
      console.log('Password reset requested for:', sanitizedEmail);
    }
    
    res.redirect('/login');
  } catch (error) {
    console.error('Passwort vergessen Fehler:', error);
    req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    res.redirect('/forgot-password');
  }
});

// Passwort zurücksetzen (nach Klick auf Link in E-Mail)
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Token prüfen
    const tokenData = await db.getOne(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expiry > NOW()',
      [token]
    );
    
    if (!tokenData) {
      req.flash('error', 'Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.');
      return res.redirect('/login');
    }
    
    res.render('reset-password', {
      title: 'Passwort zurücksetzen - Rising BSM',
      token,
      csrfToken: req.csrfToken(),
      error: req.flash('error')[0] || null
    });
    
  } catch (error) {
    console.error('Fehler beim Passwort-Reset:', error);
    req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    res.redirect('/login');
  }
});

// Neues Passwort speichern
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, password_confirm } = req.body;
    
    // Validierung
    if (!token || !password || password !== password_confirm) {
      req.flash('error', 'Die Passwörter stimmen nicht überein oder sind ungültig.');
      return res.redirect(`/reset-password/${token}`);
    }

      // Passwort-Komplexität prüfen
      if (password.length < 8) {
        req.flash('error', 'Das Passwort muss mindestens 8 Zeichen lang sein.');
        return res.redirect(`/reset-password/${token}`);
      }

      // Token prüfen
      const tokenData = await db.getOne(
        'SELECT * FROM password_reset_tokens WHERE token = $1 AND expiry > NOW()',
        [token]
      );

      if (!tokenData) {
        req.flash('error', 'Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.');
        return res.redirect('/login');
      }

      // Benutzer anhand des Tokens finden
      const user = await db.getOne(
        'SELECT * FROM benutzer WHERE id = $1',
        [tokenData.user_id]
      );

      if (!user) {
        req.flash('error', 'Benutzer nicht gefunden.');
        return res.redirect('/login');
      }

      // Neues Passwort hashen
      const hashedPassword = await bcrypt.hash(password, 10);

      // Passwort aktualisieren
      await db.query(
        'UPDATE benutzer SET passwort = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );

      // Token löschen
      await db.query(
        'DELETE FROM password_reset_tokens WHERE token = $1',
        [token]
      );

      req.flash('success', 'Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.');
      res.redirect('/login');

      } catch (error) {
      console.error('Fehler beim Passwort-Reset:', error);
      req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      res.redirect('/login');
      }
    });

    export default router;