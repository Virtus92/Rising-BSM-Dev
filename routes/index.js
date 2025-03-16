/**
 * Index Routes
 * Main public routes for the website
 */
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const validator = require('validator');
const rateLimit = require('express-rate-limit');

// Rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per IP
  message: { success: false, error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' }
});

/**
 * @route   GET /
 * @desc    Home page
 */
router.get('/', (req, res, next) => {
  try {
    return res.render('index', { 
      title: 'Rising BSM – Ihre Allround-Experten',
      user: req.session.user || null,
      csrfToken: req.csrfToken ? req.csrfToken() : null
    });
  } catch (error) {
    console.error('Fehler auf der Startseite:', error);
    return next(error);
  }
});

/**
 * @route   GET /impressum
 * @desc    Imprint page
 */
router.get('/impressum', (req, res, next) => {
  try {
    return res.render('impressum', { 
      title: 'Rising BSM – Impressum',
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Fehler auf der Impressum-Seite:', error);
    return next(error);
  }
});

/**
 * @route   GET /datenschutz
 * @desc    Privacy policy page
 */
router.get('/datenschutz', (req, res, next) => {
  try {
    return res.render('datenschutz', { 
      title: 'Rising BSM – Datenschutz',
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Fehler auf der Datenschutz-Seite:', error);
    return next(error);
  }
});

/**
 * @route   GET /agb
 * @desc    Terms and conditions page
 */
router.get('/agb', (req, res, next) => {
  try {
    return res.render('agb', { 
      title: 'Rising BSM – AGB',
      user: req.session.user || null
    });
  } catch (error) {
    console.error('Fehler auf der AGB-Seite:', error);
    return next(error);
  }
});

/**
 * @route   POST /contact
 * @desc    Process contact form submission
 */
router.post('/contact', contactLimiter, async (req, res) => {
  try {
    const result = await contactController.submitContact(req);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(result.statusCode || 200).json({
        success: result.success,
        message: result.message || result.error,
        errors: result.errors,
        requestId: result.requestId
      });
    }
    
    if (result.success) {
      if (req.flash) req.flash('success', result.message);
      return res.redirect('/#contact-success');
    } else {
      if (req.flash) req.flash('error', result.error);
      return res.redirect('/#contact-error');
    }
  } catch (error) {
    console.error('Fehler beim Kontaktformular:', error);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' 
      });
    }
    
    if (req.flash) req.flash('error', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    return res.redirect('/#contact-error');
  }
});

module.exports = router;