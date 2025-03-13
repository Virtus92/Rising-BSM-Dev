/**
 * Auth Routes
 * Handles all authentication-related routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isNotAuthenticated } = require('../middleware/auth.middleware');

/**
 * @route   GET /login
 * @desc    Render login page
 */
router.get('/login', isNotAuthenticated, (req, res) => {
  res.render('login', {
    title: 'Login - Rising BSM',
    error: req.flash('error')[0] || null,
    success: req.flash('success')[0] || null,
    csrfToken: req.csrfToken()
  });
});

/**
 * @route   POST /auth/login
 * @desc    Process login
 */
router.post('/login', async (req, res, next) => {
  try {
    // Log the request for debugging
    console.log('Login request received:', req.body);
    
    const result = await authController.login(req, res, next);
    
    // Check if result exists before trying to use it
    if (!result) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
    
    // Create session with user data
    req.session.user = result.user;
    
    // Set cookie lifetime for "remember me"
    if (result.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.maxAge = 8 * 60 * 60 * 1000; // 8 hours
    }
    
    // For non-API requests, redirect
    if (!(req.xhr || req.headers.accept.includes('application/json'))) {
      return res.redirect('/dashboard');
    }
    
    // Return success response for API requests
    return res.json({ success: true, user: result.user, redirect: '/dashboard' });
  } catch (error) {
    console.error('Login error:', error);
    // Make sure we don't try to send a response if one has already been sent
    if (!res.headersSent) {
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(401).json({ success: false, message: error.message || 'Login failed' });
      } else {
        req.flash('error', error.message || 'Login failed');
        return res.redirect('/login');
      }
    }
  }
});

/**
 * @route   GET /auth/csrf-token
 * @desc    Get CSRF token
 */
router.get('/csrf-token', (req, res) => {
  return res.json({ csrfToken: req.csrfToken() });
});

/**
 * @route   GET /logout
 * @desc    Process logout
 */
router.get('/logout', async (req, res, next) => {
  try {
    // Call logout controller if user is logged in
    if (req.session && req.session.user) {
      await authController.logout(req, res, next);
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/login');
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.redirect('/login');
  }
});

/**
 * @route   GET /forgot-password
 * @desc    Render forgot password page
 */
router.get('/forgot-password', isNotAuthenticated, (req, res) => {
  res.render('forgot-password', {
    title: 'Passwort vergessen - Rising BSM',
    error: req.flash('error')[0] || null,
    success: req.flash('success')[0] || null,
    csrfToken: req.csrfToken()
  });
});

/**
 * @route   POST /forgot-password
 * @desc    Process forgot password request
 */
router.post('/forgot-password', isNotAuthenticated, async (req, res, next) => {
  try {
    const result = await authController.forgotPassword(req, res, next);
    
    // In a real application, you would send an email with the reset link here
    // We'll just set a success flash message
    req.flash('success', result.message);
    res.redirect('/login');
  } catch (error) {
    req.flash('error', error.message || 'An error occurred. Please try again.');
    res.redirect('/forgot-password');
  }
});

/**
 * @route   GET /reset-password/:token
 * @desc    Render reset password page
 */
router.get('/reset-password/:token', isNotAuthenticated, async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // Validate token
    const result = await authController.validateResetToken(req, res, next);
    
    res.render('reset-password', {
      title: 'Passwort zurücksetzen - Rising BSM',
      token,
      email: result.email,
      error: req.flash('error')[0] || null,
      success: req.flash('success')[0] || null,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    req.flash('error', error.message || 'Invalid or expired reset link.');
    res.redirect('/login');
  }
});

/**
 * @route   POST /reset-password/:token
 * @desc    Process reset password
 */
router.post('/reset-password/:token', isNotAuthenticated, async (req, res, next) => {
  try {
    const result = await authController.resetPassword(req, res, next);
    
    req.flash('success', result.message);
    res.redirect('/login');
  } catch (error) {
    req.flash('error', error.message || 'Password reset failed. Please try again.');
    res.redirect(`/reset-password/${req.params.token}`);
  }
});

/**
 * @route   GET /auth/me
 * @desc    Get current user info
 */
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json(req.session.user);
  } else {
    return res.status(401).json({ message: 'Not authenticated' });
  }
});

module.exports = router;