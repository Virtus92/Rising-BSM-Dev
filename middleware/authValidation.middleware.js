const { validationResult, body } = require('express-validator');

exports.validateLogin = [
  body('email').notEmpty().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),

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
