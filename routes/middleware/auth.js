/**
 * Authentifizierungs- und Autorisierungs-Middleware für Rising BSM Dashboard
 */

/**
 * Prüft, ob der Benutzer authentifiziert ist
 * Wenn nicht, wird zur Login-Seite weitergeleitet
 */
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

/**
 * Prüft, ob der authentifizierte Benutzer Admin-Rechte hat
 * Wenn nicht, wird zur Dashboard-Seite weitergeleitet
 */
export const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  } else {
    req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    return res.redirect('/dashboard');
  }
};

/**
 * Prüft, ob der authentifizierte Benutzer Manager-Rechte hat (Manager oder Admin)
 * Wenn nicht, wird zur Dashboard-Seite weitergeleitet
 */
export const isManager = (req, res, next) => {
  if (req.session && req.session.user && 
     (req.session.user.role === 'admin' || req.session.user.role === 'manager')) {
    return next();
  } else {
    req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    return res.redirect('/dashboard');
  }
};

/**
 * Prüft, ob der authentifizierte Benutzer Mitarbeiter-Rechte hat (oder höher)
 * Wenn nicht, wird zur Dashboard-Seite weitergeleitet
 */
export const isEmployee = (req, res, next) => {
  if (req.session && req.session.user && 
     (req.session.user.role === 'admin' || req.session.user.role === 'manager' || req.session.user.role === 'employee')) {
    return next();
  } else {
    req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
    return res.redirect('/dashboard');
  }
};

/**
 * CSRF-Schutz-Middleware für API-Anfragen
 */
export const csrfProtection = (req, res, next) => {
  // Prüft CSRF-Token in Header für API-Anfragen
  const csrfToken = req.headers['csrf-token'] || req.body._csrf;
  
  if (!csrfToken || csrfToken !== req.csrfToken()) {
    return res.status(403).json({
      success: false,
      error: 'CSRF Token ungültig oder abgelaufen'
    });
  }
  
  next();
};