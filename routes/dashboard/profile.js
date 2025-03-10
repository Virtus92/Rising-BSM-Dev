const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../../db');

// Authentifizierungs-Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

// Profilseite anzeigen
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userQuery = await pool.query(`
      SELECT 
        id, name, email, telefon, rolle, 
        created_at 
      FROM benutzer 
      WHERE id = $1
    `, [req.session.user.id]);
    
    res.render('dashboard/profile', {
      title: 'Mein Profil - Rising BSM',
      user: req.session.user,
      userProfile: userQuery.rows[0],
      currentPath: '/dashboard/profile',
      csrfToken: req.csrfToken(),
      messages: { 
        success: req.flash('success'), 
        error: req.flash('error') 
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden des Profils:', error);
    res.status(500).render('error', {
      message: 'Datenbankfehler: ' + error.message,
      error: error
    });
  }
});

// Profil aktualisieren
router.post('/update', isAuthenticated, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      telefon, 
      current_password, 
      new_password, 
      new_password_confirm 
    } = req.body;
    
    // Grundlegende Validierung
    if (!name || !email) {
      req.flash('error', 'Name und E-Mail-Adresse sind Pflichtfelder.');
      return res.redirect('/dashboard/profile');
    }
    
    // Passwortänderung
    if (current_password && new_password && new_password_confirm) {
      // Prüfen, ob neue Passwörter übereinstimmen
      if (new_password !== new_password_confirm) {
        req.flash('error', 'Die neuen Passwörter stimmen nicht überein.');
        return res.redirect('/dashboard/profile');
      }
      
      // Aktuelles Passwort überprüfen
      const userQuery = await pool.query(
        'SELECT passwort FROM benutzer WHERE id = $1', 
        [req.session.user.id]
      );
      
      const passwordMatch = await bcrypt.compare(
        current_password, 
        userQuery.rows[0].passwort
      );
      
      if (!passwordMatch) {
        req.flash('error', 'Das aktuelle Passwort ist nicht korrekt.');
        return res.redirect('/dashboard/profile');
      }
      
      // Neues Passwort hashen
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);
      
      // Benutzer mit neuem Passwort aktualisieren
      await pool.query(
        `UPDATE benutzer 
         SET 
           name = $1, 
           email = $2, 
           telefon = $3, 
           passwort = $4,
           updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5`,
        [name, email, telefon, hashedPassword, req.session.user.id]
      );
    } else {
      // Benutzer ohne Passwortänderung aktualisieren
      await pool.query(
        `UPDATE benutzer 
         SET 
           name = $1, 
           email = $2, 
           telefon = $3,
           updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4`,
        [name, email, telefon, req.session.user.id]
      );
    }
    
    // Sitzungsdaten aktualisieren
    req.session.user.name = name;
    req.session.user.email = email;
    req.session.user.telefon = telefon;
    
    req.flash('success', 'Profil erfolgreich aktualisiert.');
    res.redirect('/dashboard/profile');
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Profils:', error);
    req.flash('error', 'Datenbankfehler: ' + error.message);
    res.redirect('/dashboard/profile');
  }
});

module.exports = router;