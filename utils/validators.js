/**
 * Validation Utilities
 * Provides validation functions for various input types
 */
const validator = require('validator');

/**
 * Validate and sanitize text input
 * @param {string} input - Input text to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
exports.validateText = (input, options = {}) => {
  const {
    required = false,
    minLength = 0,
    maxLength = 500,
    trim = true,
    escape = true
  } = options;

  const errors = [];

  // Handle null or undefined
  if (input === null || input === undefined) {
    if (required) {
      errors.push('Input is required');
    }
    return { isValid: errors.length === 0, errors, value: input };
  }

  // Ensure input is a string
  const value = trim ? input.trim() : input;

  // Check if empty
  if (value === '' && required) {
    errors.push('Input cannot be empty');
  }

  // Length validation
  if (value.length < minLength) {
    errors.push(`Input must be at least ${minLength} characters long`);
  }

  if (value.length > maxLength) {
    errors.push(`Input must not exceed ${maxLength} characters`);
  }

  // Escape if requested
  const sanitizedValue = escape ? validator.escape(value) : value;

  return {
    isValid: errors.length === 0,
    errors,
    value: sanitizedValue
  };
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {object} - Validation result
 */
exports.validateEmail = (email) => {
  const errors = [];

  // Check if email is provided and valid
  if (!email || !validator.isEmail(email)) {
    errors.push('Invalid email address');
  }

  const sanitizedEmail = validator.normalizeEmail(email);

  return {
    isValid: errors.length === 0,
    errors,
    value: sanitizedEmail
  };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} - Validation result
 */
exports.validatePhone = (phone) => {
  const errors = [];

  // Remove non-digit characters for validation
  const cleanedPhone = phone ? phone.replace(/\D/g, '') : '';

  // Basic phone number validation
  if (cleanedPhone && !validator.isMobilePhone(cleanedPhone, 'any')) {
    errors.push('Invalid phone number');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: cleanedPhone
  };
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
exports.validateDate = (date, options = {}) => {
  const {
    required = false,
    pastAllowed = true,
    futureAllowed = true,
    beforeDate,
    afterDate
  } = options;

  const errors = [];

  // Handle null or undefined
  if (date === null || date === undefined) {
    if (required) {
      errors.push('Date is required');
    }
    return { isValid: errors.length === 0, errors, value: date };
  }

  const parsedDate = new Date(date);

  // Check if date is valid
  if (isNaN(parsedDate.getTime())) {
    errors.push('Invalid date format');
    return { isValid: false, errors, value: date };
  }

  const now = new Date();

  // Past date validation
  if (!pastAllowed && parsedDate < now) {
    errors.push('Date cannot be in the past');
  }

  // Future date validation
  if (!futureAllowed && parsedDate > now) {
    errors.push('Date cannot be in the future');
  }

  // Before date validation
  if (beforeDate && parsedDate > new Date(beforeDate)) {
    errors.push(`Date must be before ${beforeDate}`);
  }

  // After date validation
  if (afterDate && parsedDate < new Date(afterDate)) {
    errors.push(`Date must be after ${afterDate}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: parsedDate
  };
};

/**
 * Validate time format (24-hour format: HH:MM)
 * @param {string} time - Time string to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
exports.validateTimeFormat = (time, options = {}) => {
  const {
    required = false,
  } = options;

  const errors = [];

  // Handle null or undefined
  if (time === null || time === undefined) {
    if (required) {
      errors.push('Time is required');
    }
    return { isValid: errors.length === 0, errors, value: time };
  }

  // Regular expression for 24-hour format (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  
  if (!timeRegex.test(time)) {
    errors.push('Invalid time format. Use 24-hour format (HH:MM)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: time
  };
};

/**
 * Validate numeric values
 * @param {number} value - Numeric value to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
exports.validateNumeric = (value, options = {}) => {
  const {
    required = false,
    min = -Infinity,
    max = Infinity,
    integer = false
  } = options;

  const errors = [];

  // Handle null or undefined
  if (value === null || value === undefined) {
    if (required) {
      errors.push('Value is required');
    }
    return { isValid: errors.length === 0, errors, value };
  }

  // Convert to number
  const numericValue = Number(value);

  // Check if numeric
  if (isNaN(numericValue)) {
    errors.push('Value must be a number');
  }

  // Integer validation
  if (integer && !Number.isInteger(numericValue)) {
    errors.push('Value must be an integer');
  }

  // Min value validation
  if (numericValue < min) {
    errors.push(`Value must be at least ${min}`);
  }

  // Max value validation
  if (numericValue > max) {
    errors.push(`Value must not exceed ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: numericValue
  };
};

/**
 * Comprehensive input validation
 * @param {object} data - Input data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - Validation result
 */
exports.validateInput = (data, schema) => {
  const validationResults = {};
  const errors = [];

  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = data[field];

    let result;
    switch (rules.type) {
      case 'text':
        result = this.validateText(value, rules);
        break;
      case 'email':
        result = this.validateEmail(value);
        break;
      case 'phone':
        result = this.validatePhone(value);
        break;
      case 'date':
        result = this.validateDate(value, rules);
        break;
      case 'numeric':
        result = this.validateNumeric(value, rules);
        break;
      default:
        result = { isValid: true, value };
    }

    validationResults[field] = result;

    if (!result.isValid) {
      errors.push(...result.errors.map(err => `${field}: ${err}`));
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validatedData: Object.keys(validationResults).reduce((acc, key) => {
      acc[key] = validationResults[key].value;
      return acc;
    }, {})
  };
};