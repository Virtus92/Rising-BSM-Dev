const express = require('express');
const csrf = require('@dr.pogodin/csurf');
const cookieParser = require('cookie-parser');

module.exports = function setupCsrf(app) {
  // Clear any existing CSRF middleware
  app._router.stack = app._router.stack.filter(layer => {
    return !(layer.handle && layer.handle.name === 'csrf');
  });
  
  // Setup fresh CSRF protection
  const csrfProtection = csrf({
    cookie: {
      key: 'XSRF-TOKEN',   // Standard name
      path: '/',
      httpOnly: false,     // Must be false for client-side access
      secure: false, // Disable secure for local development
      sameSite: 'lax'
    }
  });
  
  // Apply the middleware
  app.use(csrfProtection);
  
  // Middleware to expose the token in responses
  app.use((req, res, next) => {
    // Set token in locals for templates
    res.locals.csrfToken = req.csrfToken();
    next();
  });
  
  // Debug route
  app.get('/csrf-check', (req, res) => {
    const token = req.csrfToken();
    res.json({
      token: token,
      cookieToken: req.cookies['XSRF-TOKEN'],
      match: token === req.cookies['XSRF-TOKEN']
    });
  });
  
  console.log('CSRF protection reset and reconfigured');
  
  return app;
};
