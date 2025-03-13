const { validationResult, body, param, query } = require('express-validator');

exports.validateRequestStatusUpdate = [
  body('id').notEmpty().isInt().withMessage('Request ID is required and must be an integer'),
  body('status').notEmpty().isIn(['neu', 'in_bearbeitung', 'beantwortet', 'geschlossen']).withMessage('Status is required and must be a valid value'),

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

exports.validateRequestId = [
  param('id').isInt().withMessage('Request ID must be an integer'),
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
