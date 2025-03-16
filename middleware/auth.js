const { pool } = require('../services/db.service');

/**
 * Prüft ob der Benutzer authentifiziert ist
 */
exports.isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({
        success: false,
        message: 'Nicht authentifiziert',
        redirect: '/login'
      });
    }
    // Aktuelle URL für Redirect-Back speichern
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
};

/**
 * Prüft ob der Benutzer Admin-Rechte hat
 */
exports.isAdmin = (req, res, next) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({
        success: false,
        message: 'Admin-Rechte erforderlich',
        redirect: '/dashboard'
      });
    }
    req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    return res.redirect('/dashboard');
  }
  next();
};

/**
 * Prüft ob der Benutzer Manager-Rechte hat (Manager oder Admin)
 */
exports.isManager = (req, res, next) => {
  if (!req.session?.user || !['admin', 'manager'].includes(req.session.user.role)) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({
        success: false,
        message: 'Manager-Rechte erforderlich',
        redirect: '/dashboard'
      });
    }
    req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    return res.redirect('/dashboard');
  }
  next();
};

/**
 * Prüft ob der Benutzer Mitarbeiter-Rechte hat (oder höher)
 */
exports.isEmployee = (req, res, next) => {
  if (!req.session?.user || !['admin', 'manager', 'employee'].includes(req.session.user.role)) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({
        success: false,
        message: 'Mitarbeiter-Rechte erforderlich',
        redirect: '/dashboard'
      });
    }
    req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    return res.redirect('/dashboard');
  }
  next();
};

/**
 * Prüft ob der Benutzer NICHT authentifiziert ist
 * Wird für Login/Register-Seiten verwendet
 */
exports.isNotAuthenticated = (req, res, next) => {
  if (!req.session?.user) {
    return next();
  }
  return res.redirect('/dashboard');
};

/**
 * Fügt Benutzerdaten zur Request hinzu
 */
exports.attachUserToRequest = async (req, res, next) => {
  if (req.session?.user?.id) {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, status FROM benutzer WHERE id = $1',
        [req.session.user.id]
      );
      
      if (result.rows.length > 0) {
        // Aktualisiere Benutzerdaten in Session und Request
        req.session.user = {
          ...req.session.user,
          ...result.rows[0]
        };
        req.user = result.rows[0];
        // Für Templates
        res.locals.user = result.rows[0];
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzerdaten:', error);
    }
  }
  next();
};

/**
 * CSRF-Protection Middleware
 */
exports.csrfProtection = (req, res, next) => {
  if (req.method === 'GET') {
    // CSRF-Token generieren und in Session speichern
    req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
    // Token für Templates verfügbar machen
    res.locals.csrfToken = req.session.csrfToken;
    next();
  } else {
    // Bei POST/PUT/DELETE Token prüfen
    const token = req.body._csrf || req.headers['x-csrf-token'];
    
    if (!token || token !== req.session?.csrfToken) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({
          success: false,
          message: 'Ungültiger CSRF-Token'
        });
      }
      return res.redirect('/login');
    }
    next();
  }
}; 