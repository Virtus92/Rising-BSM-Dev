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
      csrfToken: req.csrfToken ? req.csrfToken() : 'test-token' 
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      return res.status(500).json({ error: error.message });
    }
    next(error);
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
    if (process.env.NODE_ENV === 'test') {
      return res.status(500).json({ error: error.message });
    }
    next(error);
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
    if (process.env.NODE_ENV === 'test') {
      return res.status(500).json({ error: error.message });
    }
    next(error);
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
    if (process.env.NODE_ENV === 'test') {
      return res.status(500).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * @route   POST /contact
 * @desc    Process contact form submission
 */
router.post('/contact', contactLimiter, async (req, res, next) => {
  try {
    const result = await contactController.submitContact(req, res);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Handle result with appropriate redirect
    if (result.success) {
      if (req.flash) req.flash('success', result.message);
      return res.redirect('/#contact-success');
    } else {
      if (req.flash) req.flash('error', result.error);
      return res.redirect('/#contact-error');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      return res.status(500).json({ success: false, error: error.message });
    }
    next(error);
  }
});

module.exports = router;