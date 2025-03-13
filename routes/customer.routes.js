/**
 * Customer Routes
 * Handles all routes related to customer management
 */
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { validateCustomer } = require('../middleware/validation.middleware');


// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/customers
 * @desc    Display list of customers with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await customerController.getAllCustomers(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(data);
    }
    
    // Otherwise render the view
    res.render('dashboard/customers/index', { 
      title: 'Kunden - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      customers: data.customers,
      newRequestsCount: req.newRequestsCount,
      filters: data.filters,
      stats: data.stats,
      customerGrowthData: data.growthData,
      pagination: data.pagination,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /dashboard/customers/neu
 * @desc    Display form to create a new customer
 */
router.get('/neu', async (req, res, next) => {
  try {
    // Pre-fill data from query parameters if available
    const { name, email, phone } = req.query;
    
    res.render('dashboard/customers/neu', {
      title: 'Neuer Kunde - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/customers',
      formData: {
        name: name || '',
        email: email || '',
        telefon: phone || '',
        firma: '',
        adresse: '',
        plz: '',
        ort: '',
      },
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/customers/neu
 * @desc    Create a new customer
 */
router.post('/neu', validateCustomer, async (req, res, next) => {
  try {
    const result = await customerController.createCustomer(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Kunde erfolgreich angelegt.');
    res.redirect(`/dashboard/customers/${result.customerId}`);
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/customers/neu');
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/customers/export
 * @desc    Export customers in various formats
 */
router.get('/export', async (req, res, next) => {
  try {
    const result = await customerController.exportCustomers(req, res, next);
    
    // The export service returns different content types based on format
    const { format, data, contentType, filename } = result;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    if (contentType.includes('json')) {
      return res.json(data);
    } else {
      return res.send(data);
    }
  } catch (error) {
    // For export errors, return JSON error response
    console.error('Export error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'An error occurred during export'
    });
  }
});

/**
 * @route   POST /dashboard/customers/update-status
 * @desc    Update customer status
 */
router.post('/update-status', async (req, res, next) => {
  try {
    const result = await customerController.updateCustomerStatus(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Kundenstatus erfolgreich aktualisiert.');
    res.redirect('/dashboard/customers');
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/customers');
    }
    next(error);
  }
});

/**
 * @route   POST /dashboard/customers/delete
 * @desc    Delete a customer (mark as deleted)
 */
router.post('/delete', async (req, res, next) => {
  try {
    const result = await customerController.deleteCustomer(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Kunde erfolgreich gelöscht.');
    res.redirect('/dashboard/customers');
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/customers');
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/customers/:id
 * @desc    Display customer details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await customerController.getCustomerById(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(data);
    }
    
    // Otherwise render the view
    res.render('dashboard/customers/detail', {
      title: `Kunde: ${data.customer.name} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/customers',
      kunde: data.customer,
      termine: data.appointments,
      projekte: data.projects,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    if (error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/customers');
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/customers/:id/edit
 * @desc    Display form to edit a customer
 */
router.get('/:id/edit', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Fetch customer data
    const customerQuery = await req.db.query({
      text: `SELECT * FROM kunden WHERE id = $1`,
      values: [id]
    });
    
    if (customerQuery.rows.length === 0) {
      req.flash('error', `Kunde mit ID ${id} nicht gefunden`);
      return res.redirect('/dashboard/customers');
    }
    
    const customer = customerQuery.rows[0];
    
    res.render('dashboard/customers/edit', {
      title: `Kunde bearbeiten: ${customer.name} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/customers',
      kunde: customer,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/customers/:id/edit
 * @desc    Update customer data
 */
router.post('/:id/edit', validateCustomer, async (req, res, next) => {
  try {
    const result = await customerController.updateCustomer(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Kunde erfolgreich aktualisiert.');
    res.redirect(`/dashboard/customers/${req.params.id}`);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/customers/${req.params.id}/edit`);
    }
    next(error);
  }
});

/**
 * @route   POST /dashboard/customers/:id/add-note
 * @desc    Add a note to customer
 */
router.post('/:id/add-note', async (req, res, next) => {
  try {
    const result = await customerController.addCustomerNote(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Notiz erfolgreich hinzugefügt.');
    res.redirect(`/dashboard/customers/${req.params.id}`);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/customers/${req.params.id}`);
    }
    next(error);
  }
});

module.exports = router;