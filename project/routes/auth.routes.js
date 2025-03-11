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
 * @route   POST /login
 * @desc    Process login
 */
router.post('/login', isNotAuthenticated, async (req, res, next) => {
  try {
    const result = await authController.login(req, res, next);
    
    // Create session with user data
    req.session.user = result.user;
    
    // Set cookie lifetime for "remember me"
    if (result.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.maxAge = 8 * 60 * 60 * 1000; // 8 hours
    }
    
    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', error.message || 'Login failed. Please try again.');
    res.redirect('/login');
  }
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

module.exports = router;