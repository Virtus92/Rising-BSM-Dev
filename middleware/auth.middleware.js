 /**
 * Authentication and authorization middleware
 */

/**
 * Checks if the user is authenticated
 * If not, redirects to login page
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.id) {
    return next();
  } else {
    // For API requests, return 401 Unauthorized
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        redirect: '/login'
      });
    }
    
    // For regular requests, redirect to login page
    req.flash('error', 'Bitte melden Sie sich an, um fortzufahren.');
    return res.redirect('/login');
  }
};
  
  /**
   * Checks if the authenticated user has admin privileges
   * If not, redirects to dashboard with an error message
   */
  exports.isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
      return next();
    } else {
      // For API requests, return 403 Forbidden
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({
          success: false,
          message: 'Admin privileges required',
          redirect: '/dashboard'
        });
      }
      
      // For regular requests, redirect with flash message
      req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
      return res.redirect('/dashboard');
    }
  };
  
  /**
   * Checks if the authenticated user has manager privileges (manager or admin)
   * If not, redirects to dashboard with an error message
   */
  exports.isManager = (req, res, next) => {
    if (req.session && req.session.user && 
       (req.session.user.role === 'admin' || req.session.user.role === 'manager')) {
      return next();
    } else {
      // For API requests, return 403 Forbidden
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({
          success: false,
          message: 'Manager privileges required',
          redirect: '/dashboard'
        });
      }
      
      // For regular requests, redirect with flash message
      req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
      return res.redirect('/dashboard');
    }
  };
  
  /**
   * Checks if the authenticated user has employee privileges (or higher)
   * If not, redirects to dashboard with an error message
   */
  exports.isEmployee = (req, res, next) => {
    if (req.session && req.session.user && 
       ['admin', 'manager', 'employee'].includes(req.session.user.role)) {
      return next();
    } else {
      // For API requests, return 403 Forbidden
      if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.status(403).json({
          success: false,
          message: 'Employee privileges required',
          redirect: '/dashboard'
        });
      }
      
      // For regular requests, redirect with flash message
      req.flash('error', 'Sie haben keine Berechtigung für diesen Bereich.');
      return res.redirect('/dashboard');
    }
  };
  
  /**
   * Checks if the user is not authenticated
   * Used for login/register pages to prevent authenticated users from accessing them
   */
  exports.isNotAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.user) {
      return next();
    } else {
      return res.redirect('/dashboard');
    }
  };