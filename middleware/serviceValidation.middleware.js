const { validationResult, body, param, query } = require('express-validator');

exports.validateServiceCreation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('preis_basis').isNumeric().withMessage('Base price must be a number'),
  body('einheit').notEmpty().withMessage('Unit is required'),
  body('mwst_satz').optional().isNumeric().withMessage('MwSt-Satz must be a number'),
  body('aktiv').optional().isBoolean().withMessage('Aktiv must be a boolean'),

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

exports.validateServiceUpdate = [
  param('id').isInt().withMessage('ID must be an integer'),
  body('name').notEmpty().withMessage('Name is required'),
  body('preis_basis').isNumeric().withMessage('Base price must be a number'),
  body('einheit').notEmpty().withMessage('Unit is required'),
  body('mwst_satz').optional().isNumeric().withMessage('MwSt-Satz must be a number'),
  body('aktiv').optional().isBoolean().withMessage('Aktiv must be a boolean'),

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

exports.validateServiceId = [
  param('id').isInt().withMessage('Service ID must be an integer'),
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
