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
const validateText = (input, options = {}) => {
  const {
    required = false,
    minLength = 0,
    maxLength = 500,
    trim = true,
    escape = true,
    pattern = null
  } = options;

  const errors = [];

  // Handle null or undefined
  if (input === null || input === undefined) {
    if (required) {
      errors.push('Input is required');
    }
    return { isValid: errors.length === 0, errors, value: '' };
  }

  // Ensure input is a string
  const strInput = String(input);
  const value = trim ? strInput.trim() : strInput;

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

  // Pattern validation
  if (pattern && !pattern.test(value)) {
    errors.push('Input format is invalid');
  }

  // Always escape HTML to prevent XSS
  const sanitizedValue = validator.escape(value);

  return {
    isValid: errors.length === 0,
    errors,
    value: sanitizedValue
  };
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @param {boolean} required - Whether the email is required
 * @returns {object} - Validation result
 */
const validateEmail = (email, required = false) => {
  const errors = [];

  // Handle null, undefined or empty
  if (!email) {
    if (required) {
      errors.push('Email is required');
    }
    return { isValid: !required, errors, value: '' };
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    errors.push('Invalid email address');
    return { isValid: false, errors, value: email };
  }

  // Normalize only valid emails
  const sanitizedEmail = validator.normalizeEmail(email);

  return {
    isValid: true,
    errors: [],
    value: sanitizedEmail
  };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @param {boolean} required - Whether the phone is required
 * @returns {object} - Validation result
 */
const validatePhone = (phone, required = false) => {
  const errors = [];
  
  // Handle null, undefined or empty
  if (!phone) {
    if (required) {
      errors.push('Phone number is required');
    }
    return { isValid: !required, errors, value: '' };
  }

  // Remove non-digit characters for validation
  const cleanedPhone = phone.replace(/\D/g, '');

  // Basic phone number validation
  if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
    errors.push('Phone number must be between 8 and 15 digits');
  }

  // Check if it's a valid phone number format for Germany
  if (!validator.isMobilePhone(cleanedPhone, ['de-DE', 'any'])) {
    errors.push('Invalid phone number format');
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
const validateDate = (date, options = {}) => {
  const {
    required = false,
    pastAllowed = true,
    futureAllowed = true,
    beforeDate,
    afterDate,
    format = 'YYYY-MM-DD'
  } = options;

  const errors = [];

  // Handle null, undefined or empty
  if (!date) {
    if (required) {
      errors.push('Date is required');
    }
    return { isValid: !required, errors, value: null };
  }

  let parsedDate;
  
  // Parse date based on format
  try {
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch (err) {
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
  if (beforeDate) {
    const beforeLimit = new Date(beforeDate);
    if (parsedDate > beforeLimit) {
      errors.push(`Date must be before ${beforeDate}`);
    }
  }

  // After date validation
  if (afterDate) {
    const afterLimit = new Date(afterDate);
    if (parsedDate < afterLimit) {
      errors.push(`Date must be after ${afterDate}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: parsedDate
  };
};

/**
 * Validate numeric values
 * @param {number|string} value - Numeric value to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
const validateNumeric = (value, options = {}) => {
  const {
    required = false,
    min = -Infinity,
    max = Infinity,
    integer = false,
    positive = false
  } = options;

  const errors = [];

  // Handle null, undefined or empty
  if (value === null || value === undefined || value === '') {
    if (required) {
      errors.push('Value is required');
    }
    return { isValid: !required, errors, value: null };
  }

  // Convert to number
  const numericValue = Number(value);

  // Check if numeric
  if (isNaN(numericValue)) {
    errors.push('Value must be a number');
    return { isValid: false, errors, value };
  }

  // Integer validation
  if (integer && !Number.isInteger(numericValue)) {
    errors.push('Value must be an integer');
  }

  // Positive number validation
  if (positive && numericValue <= 0) {
    errors.push('Value must be positive');
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
 * Validate boolean values
 * @param {boolean|string} value - Boolean value to validate
 * @param {boolean} required - Whether the value is required
 * @returns {object} - Validation result
 */
const validateBoolean = (value, required = false) => {
  const errors = [];

  // Handle null, undefined or empty
  if (value === null || value === undefined || value === '') {
    if (required) {
      errors.push('Value is required');
    }
    return { isValid: !required, errors, value: null };
  }

  // Convert string to boolean
  let boolValue;
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (['true', '1', 'yes'].includes(lowered)) {
      boolValue = true;
    } else if (['false', '0', 'no'].includes(lowered)) {
      boolValue = false;
    } else {
      errors.push('Value must be a boolean');
      return { isValid: false, errors, value };
    }
  } else {
    boolValue = Boolean(value);
  }

  return {
    isValid: true,
    errors: [],
    value: boolValue
  };
};

/**
 * Validates input data against a schema
 * @param {Object} data - Input data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
const validateInput = (data = {}, schema = {}) => {
  const errors = {};
  const validatedData = {};

  // Validate each field according to schema
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors = [];

    // Type validation
    switch (rules.type) {
      case 'text':
        const textResult = validateText(value, rules);
        if (!textResult.isValid) {
          fieldErrors.push(...textResult.errors);
        }
        validatedData[field] = textResult.value;
        break;

      case 'email':
        const emailResult = validateEmail(value, rules.required);
        if (!emailResult.isValid) {
          fieldErrors.push(...emailResult.errors);
        }
        validatedData[field] = emailResult.value;
        break;

      case 'phone':
        const phoneResult = validatePhone(value, rules.required);
        if (!phoneResult.isValid) {
          fieldErrors.push(...phoneResult.errors);
        }
        validatedData[field] = phoneResult.value;
        break;

      case 'date':
        const dateResult = validateDate(value, rules);
        if (!dateResult.isValid) {
          fieldErrors.push(...dateResult.errors);
        }
        validatedData[field] = dateResult.value;
        break;

      case 'numeric':
        const numericResult = validateNumeric(value, rules);
        if (!numericResult.isValid) {
          fieldErrors.push(...numericResult.errors);
        }
        validatedData[field] = numericResult.value;
        break;

      case 'boolean':
        const booleanResult = validateBoolean(value, rules.required);
        if (!booleanResult.isValid) {
          fieldErrors.push(...booleanResult.errors);
        }
        validatedData[field] = booleanResult.value;
        break;

      default:
        fieldErrors.push('Invalid field type');
    }

    // Add field errors if any
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: validatedData
  };
};

// Export all validation functions
module.exports = {
  validateInput,
  validateText,
  validateEmail,
  validatePhone,
  validateDate,
  validateNumeric,
  validateBoolean
};