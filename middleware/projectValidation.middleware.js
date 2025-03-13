const { validationResult, body, param, query } = require('express-validator');

exports.validateProjectCreation = [
  body('titel').notEmpty().withMessage('Title is required'),
  body('start_datum').isDate().withMessage('Start date is required'),
  body('end_datum').optional().isDate().withMessage('End date must be a valid date'),
  body('betrag').optional().isNumeric().withMessage('Betrag must be a number'),
  body('status').optional().isIn(['neu', 'in_bearbeitung', 'abgeschlossen', 'storniert']).withMessage('Invalid status value'),

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

exports.validateProjectUpdate = [
  param('id').isInt().withMessage('ID must be an integer'),
  body('titel').notEmpty().withMessage('Title is required'),
  body('start_datum').isDate().withMessage('Start date is required'),
  body('end_datum').optional().isDate().withMessage('End date must be a valid date'),
  body('betrag').optional().isNumeric().withMessage('Betrag must be a number'),
  body('status').optional().isIn(['neu', 'in_bearbeitung', 'abgeschlossen', 'storniert']).withMessage('Invalid status value'),

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

exports.validateProjectStatusUpdate = [
  body('id').notEmpty().isInt().withMessage('Project ID is required and must be an integer'),
  body('status').notEmpty().isIn(['neu', 'in_bearbeitung', 'abgeschlossen', 'storniert']).withMessage('Status is required and must be a valid value'),

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

exports.validateProjectId = [
  param('id').isInt().withMessage('Project ID must be an integer'),
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
