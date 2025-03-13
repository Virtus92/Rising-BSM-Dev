const { validationResult, body, param, query } = require('express-validator');

exports.validateCustomerCreation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('telefon').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('kundentyp').optional().isIn(['privat', 'geschaeft']).withMessage('Invalid customer type'),
  body('status').optional().isIn(['aktiv', 'inaktiv', 'geloescht']).withMessage('Invalid status'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.validationErrors = errors.array();
      return next(error);
    }
    next();
  }
];

exports.validateCustomerUpdate = [
  param('id').isInt().withMessage('ID must be an integer'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('telefon').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('kundentyp').optional().isIn(['privat', 'geschaeft']).withMessage('Invalid customer type'),
  body('status').optional().isIn(['aktiv', 'inaktiv', 'geloescht']).withMessage('Invalid status'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.validationErrors = errors.array();
      return next(error);
    }
    next();
  }
];

exports.validateCustomerStatusUpdate = [
  body('id').notEmpty().isInt().withMessage('Customer ID is required and must be an integer'),
  body('status').notEmpty().isIn(['aktiv', 'inaktiv', 'geloescht']).withMessage('Status is required and must be a valid value'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.validationErrors = errors.array();
      return next(error);
    }
    next();
  }
];

exports.validateCustomerId = [
  param('id').isInt().withMessage('Customer ID must be an integer'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 400;
      error.validationErrors = errors.array();
      return next(error);
    }
    next();
  }
];
