const { validationResult, body, param, query } = require('express-validator');

exports.validateAppointmentCreation = [
  body('titel').notEmpty().withMessage('Title is required'),
  body('termin_datum').isDate().withMessage('Valid date is required'),
  body('termin_zeit').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time format (HH:MM) is required'),
  body('dauer').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('status').optional().isIn(['geplant', 'bestaetigt', 'abgeschlossen', 'storniert']).withMessage('Invalid status value'),
  
  // Validation handler
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

exports.validateAppointmentUpdate = [
  param('id').isInt().withMessage('ID must be an integer'),
  body('titel').notEmpty().withMessage('Title is required'),
  body('termin_datum').isDate().withMessage('Valid date is required'),
  body('termin_zeit').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time format (HH:MM) is required'),
  body('dauer').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('status').optional().isIn(['geplant', 'bestaetigt', 'abgeschlossen', 'storniert']).withMessage('Invalid status value'),
  
  // Validation handler
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

exports.validateAppointmentStatusUpdate = [
  body('id').notEmpty().isInt().withMessage('Appointment ID is required and must be an integer'),
  body('status').notEmpty().isIn(['geplant', 'bestaetigt', 'abgeschlossen', 'storniert']).withMessage('Status is required and must be a valid value'),

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
