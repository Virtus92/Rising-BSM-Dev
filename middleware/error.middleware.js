/**
 * Error handling middleware
 */

/**
 * Global error handler
 * Formats and processes all errors caught in route handlers
 */
exports.errorHandler = (err, req, res, next) => {
    // Set default status code and error message
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred';
    
    // Log the error (with stack trace in development)
    console.error(`[${new Date().toISOString()}] Error ${statusCode}: ${message}`);
    if (process.env.NODE_ENV !== 'production') {
      console.error(err.stack);
    }
    
    // Handle API requests
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        ...(err.validationErrors && { validationErrors: err.validationErrors })
      });
    }
    
    // Handle CSRF errors
    if (err.code === 'EBADCSRFTOKEN') {
      req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
      return res.redirect('back');
    }
    
    // Handle regular requests
    if (statusCode === 404) {
      return res.status(404).render('error', {
        title: 'Seite nicht gefunden - Rising BSM',
        statusCode: 404,
        message: 'Die angeforderte Seite wurde nicht gefunden.',
        error: process.env.NODE_ENV !== 'production' ? err : {},
        user: req.session && req.session.user ? req.session.user : null
      });
    }
    
    // For all other errors
    res.status(statusCode).render('error', {
      title: 'Fehler - Rising BSM',
      statusCode,
      message: process.env.NODE_ENV === 'production' ? 
        'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' : 
        message,
      error: process.env.NODE_ENV !== 'production' ? err : {},
      user: req.session && req.session.user ? req.session.user : null
    });
  };
  
  /**
   * 404 Not Found handler
   * Handles routes that don't match any defined routes
   */
  exports.notFoundHandler = (req, res, next) => {
    const err = new Error('Seite nicht gefunden');
    err.statusCode = 404;
    next(err);
  };
  
  /**
   * CSRF error handler
   * Special handler for CSRF token validation errors
   */
  exports.csrfErrorHandler = (err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') {
      return next(err);
    }
    
    // For API requests
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token verification failed',
        message: 'Sicherheitstoken ungültig oder abgelaufen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.'
      });
    }
    
    // For regular requests
    req.flash('error', 'Das Formular ist abgelaufen. Bitte versuchen Sie es erneut.');
    res.redirect('back');
  };