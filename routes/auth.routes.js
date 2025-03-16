/**
 * Auth Routes
 * Handles all authentication-related routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegistration } = require('../middleware/validation.middleware');
const { csrfProtection } = require('../middleware/csrf.middleware');

/**
 * @route   GET /login
 * @desc    Render login page
 */
router.get('/login', csrfProtection, (req, res) => {
  res.status(200).json({
    title: 'Login - Rising BSM',
    csrfToken: req.csrfToken()
  });
});

/**
 * @route   POST /login
 * @desc    Process login
 */
router.post('/login', csrfProtection, validateLogin, async (req, res, next) => {
  try {
    const result = await authController.login(req.body);
    if (result.success) {
      req.session.user = result.user;
      res.redirect('/dashboard');
    } else {
      req.flash('error', result.message);
      res.redirect('/login');
    }
  } catch (error) {
    req.flash('error', 'Ein Fehler ist aufgetreten');
    res.redirect('/login');
  }
});

/**
 * @route   GET /logout
 * @desc    Process logout
 */
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

/**
 * @route   GET /register
 * @desc    Render registration page
 */
router.get('/register', csrfProtection, (req, res) => {
  res.status(200).json({
    title: 'Registrierung - Rising BSM',
    csrfToken: req.csrfToken()
  });
});

/**
 * @route   POST /register
 * @desc    Process registration
 */
router.post('/register', csrfProtection, validateRegistration, async (req, res, next) => {
  try {
    const result = await authController.register(req.body);
    if (result.success) {
      req.flash('success', 'Registrierung erfolgreich. Bitte melden Sie sich an.');
      res.redirect('/login');
    } else {
      req.flash('error', result.message);
      res.redirect('/register');
    }
  } catch (error) {
    req.flash('error', 'Ein Fehler ist aufgetreten');
    res.redirect('/register');
  }
});

/**
 * @route   GET /forgot-password
 * @desc    Render forgot password page
 */
router.get('/forgot-password', csrfProtection, (req, res) => {
  res.status(200).json({
    title: 'Passwort vergessen - Rising BSM',
    csrfToken: req.csrfToken()
  });
});

/**
 * @route   POST /forgot-password
 * @desc    Process forgot password request
 */
router.post('/forgot-password', csrfProtection, async (req, res, next) => {
  try {
    const result = await authController.forgotPassword(req.body.email);
    req.flash('success', 'Falls ein Account mit dieser E-Mail existiert, wurde ein Reset-Link versendet.');
    res.redirect('/login');
  } catch (error) {
    req.flash('error', 'Ein Fehler ist aufgetreten');
    res.redirect('/forgot-password');
  }
});

/**
 * @route   GET /reset-password/:token
 * @desc    Render reset password page
 */
router.get('/reset-password/:token', csrfProtection, async (req, res, next) => {
  try {
    const isValid = await authController.validateResetToken(req.params.token);
    if (isValid) {
      res.status(200).json({
        title: 'Passwort zurücksetzen - Rising BSM',
        token: req.params.token,
        csrfToken: req.csrfToken()
      });
    } else {
      req.flash('error', 'Ungültiger oder abgelaufener Reset-Link');
      res.redirect('/login');
    }
  } catch (error) {
    req.flash('error', 'Ein Fehler ist aufgetreten');
    res.redirect('/login');
  }
});

/**
 * @route   POST /reset-password/:token
 * @desc    Process reset password
 */
router.post('/reset-password/:token', csrfProtection, async (req, res, next) => {
  try {
    const result = await authController.resetPassword(req.params.token, req.body.password);
    if (result.success) {
      req.flash('success', 'Passwort wurde erfolgreich zurückgesetzt');
      res.redirect('/login');
    } else {
      req.flash('error', result.message);
      res.redirect('/reset-password/' + req.params.token);
    }
  } catch (error) {
    req.flash('error', 'Ein Fehler ist aufgetreten');
    res.redirect('/reset-password/' + req.params.token);
  }
});

module.exports = router;