const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { serviceValidation } = require('../middleware/validation.middleware');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /dashboard/services
 * @desc    Display list of services with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await serviceController.getAllServices(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(data);
    }
    
    // Otherwise render the view
    res.render('dashboard/services/index', { 
      title: 'Dienstleistungen - Rising BSM',
      user: req.session.user,
      currentPath: req.path,
      services: data.services,
      newRequestsCount: req.newRequestsCount,
      statusFilter: req.query.status || '',
      search: req.query.search || '',
      pagination: data.pagination,
      filters: data.filters,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /dashboard/services/edit
 * @desc    Update a service via modal
 */
router.post('/edit', serviceValidation.validateService, async (req, res, next) => {
  try {
    const result = await serviceController.updateService(req, res, next);

    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }

    // Otherwise, respond with a success message
    req.flash('success', 'Dienstleistung erfolgreich aktualisiert.');
    res.redirect('/dashboard/services'); // Redirect back to the main services page
  } catch (error) {
    console.error("Error updating service:", error);
    next(error); // Pass the error to the error handling middleware
  }
});

/**
 * @route   POST /dashboard/services/:id/update
 * @desc    Update a service via modal
 */
router.post('/update/:id', serviceValidation.validateServiceUpdate, async (req, res, next) => {
  try {
    const result = await serviceController.updateService(req, res, next);

    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }

    // Otherwise, respond with a success message
    req.flash('success', 'Dienstleistung erfolgreich aktualisiert.');
    res.redirect('/dashboard/services'); // Redirect back to the main services page
  } catch (error) {
    console.error("Error updating service:", error);
    next(error); // Pass the error to the error handling middleware
  }
});

/**
 * @route   GET /dashboard/services/neu
 * @desc    Display form to create a new service
 */
router.get('/neu', async (req, res, next) => {
  try {
    res.render('dashboard/services/neu', {
      title: 'Neue Dienstleistung - Rising BSM',
      user: req.session.user,
      currentPath: '/dashboard/services',
      formData: {
        name: '',
        beschreibung: '',
        preis_basis: '',
        einheit: '',
        mwst_satz: 20,
        aktiv: true
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
 * @route   POST /dashboard/services/neu
 * @desc    Create a new service
 */
router.post('/neu', serviceValidation.validateService, async (req, res, next) => {
  try {
    const result = await serviceController.createService(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Dienstleistung erfolgreich angelegt.');
    res.redirect(`/dashboard/services/${result.serviceId}`);
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/services/neu');
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/services/export
 * @desc    Export services in various formats
 */
router.get('/export', async (req, res, next) => {
  try {
    const result = await serviceController.exportServices(req, res, next);
    
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
    console.error('Export error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'An error occurred during export'
    });
  }
});

/**
 * @route   POST /dashboard/services/:id/toggle-status
 * @desc    Toggle service status (active/inactive)
 */
router.post('/:id/toggle-status', async (req, res, next) => {
  try {
    const result = await serviceController.toggleServiceStatus(req, res, next);
    
    // If it's an API request, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(result);
    }
    
    // Otherwise set flash message and redirect
    req.flash('success', 'Dienstleistungsstatus erfolgreich geändert.');
    res.redirect(`/dashboard/services/${req.params.id}`);
  } catch (error) {
    if (error.statusCode === 400) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/services/${req.params.id}`);
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/services/:id
 * @desc    Display service details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const data = await serviceController.getServiceById(req, res, next);
    
    return res.json(data);
  } catch (error) {
    if (error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect('/dashboard/services');
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/services/:id/edit
 * @desc    Display form to edit a service
 */
router.get('/:id/edit', async (req, res, next) => {
  try {
    const data = await serviceController.getServiceById(req, res, next);
    
    res.render('dashboard/services/edit', {
      title: `Dienstleistung bearbeiten: ${data.service.name} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/services',
      service: data.service,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

/**
/**
 * @route   POST /dashboard/services/:id/edit
 * @desc    Update a service
 */
router.post('/:id/edit', serviceValidation.validateServiceUpdate, async (req, res, next) => {
  try {
    const result = await serviceController.updateService(req, res, next);
    
    return res.json(result);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 404) {
      req.flash('error', error.message);
      return res.redirect(`/dashboard/services/${req.params.id}/edit`);
    }
    next(error);
  }
});

/**
 * @route   GET /dashboard/services/:id/statistics
 * @desc    Display service statistics
 */
router.get('/:id/statistics', async (req, res, next) => {
  try {
    const data = await serviceController.getServiceStatistics(req, res, next);
    
    res.render('dashboard/services/statistics', {
      title: `Statistiken: ${data.statistics.name} - Rising BSM`,
      user: req.session.user,
      currentPath: '/dashboard/services',
      statistics: data.statistics,
      newRequestsCount: req.newRequestsCount,
      csrfToken: req.csrfToken(),
      messages: { success: req.flash('success'), error: req.flash('error') }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;