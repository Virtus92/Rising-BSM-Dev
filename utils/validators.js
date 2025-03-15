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
  
  if (!phone) return {
    isValid: true,
    errors: [],
    value: ''
  };

  // Remove non-digit characters for validation
  const cleanedPhone = phone.replace(/\D/g, '');

  // More strict validation to match test expectations
  if (cleanedPhone && !validator.isMobilePhone(cleanedPhone, 'any', { strictMode: false })) {
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
  const errors = {};
  let errorCount = 0;

  // Handle nested schemas
  const validateNestedField = (fieldData, fieldSchema, fieldPath = '') => {
    if (fieldSchema.type === 'object' && typeof fieldData === 'object') {
      const nestedResults = {};
      
      Object.keys(fieldSchema.properties || {}).forEach(nestedField => {
        const nestedPath = fieldPath ? `${fieldPath}.${nestedField}` : nestedField;
        const result = validateNestedField(
          fieldData[nestedField], 
          fieldSchema.properties[nestedField],
          nestedPath
        );
        
        nestedResults[nestedField] = result;
        
        if (!result.isValid) {
          if (!errors[fieldPath]) errors[fieldPath] = [];
          errors[fieldPath].push(...result.errors.map(err => `${nestedField}: ${err}`));
          errorCount += result.errors.length;
        }
      });
      
      return {
        isValid: !errors[fieldPath] || errors[fieldPath].length === 0,
        value: fieldData,
        nested: nestedResults
      };
    }
    
    // Handle field from dot notation in schema
    if (fieldPath.includes('.')) {
      const pathParts = fieldPath.split('.');
      let currentData = data;
      
      // Navigate through the nested structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!currentData || typeof currentData !== 'object') {
          errorCount++;
          return { isValid: false, errors: ['Invalid nested path'] };
        }
        currentData = currentData[pathParts[i]];
      }
      
      // Get the actual value
      const actualFieldName = pathParts[pathParts.length - 1];
      fieldData = currentData ? currentData[actualFieldName] : undefined;
    }
    
    // Skip conditional validation if condition not met
    if (fieldSchema.required && typeof fieldSchema.required === 'function') {
      if (!fieldSchema.required(data)) {
        return { isValid: true, value: fieldData };
      }
    }
    
    // Custom validation
    if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
      const customErrors = fieldSchema.validate(fieldData, data);
      if (customErrors && customErrors.length) {
        if (!errors[fieldPath]) errors[fieldPath] = [];
        errors[fieldPath].push(...customErrors);
        errorCount += customErrors.length;
        return { isValid: false, errors: customErrors, value: fieldData };
      }
    }
    
    // Regular field validation
    let result;
    switch (fieldSchema.type) {
      case 'text':
        result = this.validateText(fieldData, fieldSchema);
        break;
      case 'email':
        result = this.validateEmail(fieldData);
        break;
      case 'phone':
        result = this.validatePhone(fieldData);
        break;
      case 'date':
        result = this.validateDate(fieldData, fieldSchema);
        break;
      case 'numeric':
        result = this.validateNumeric(fieldData, fieldSchema);
        break;
      case 'array':
        result = { isValid: Array.isArray(fieldData), value: fieldData };
        if (!result.isValid) {
          result.errors = ['Value must be an array'];
        } else {
          result.errors = [];
        }
        break;
      default:
        result = { isValid: true, value: fieldData, errors: [] };
    }
    
    if (!result.isValid && result.errors) {
      if (!errors[fieldPath]) errors[fieldPath] = [];
      errors[fieldPath].push(...result.errors);
      errorCount += result.errors.length;
    }
    
    return result;
  };

  // Process all fields
  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    validationResults[field] = validateNestedField(
      field.includes('.') ? undefined : data[field], 
      rules, 
      field
    );
  });

  const flatErrors = [];
  Object.entries(errors).forEach(([field, fieldErrors]) => {
    fieldErrors.forEach(err => {
      flatErrors.push(`${field}: ${err}`);
    });
  });

  return {
    isValid: flatErrors.length === 0,
    errors: errors,
    errorCount: errorCount,
    validatedData: Object.keys(validationResults).reduce((acc, key) => {
      const path = key.split('.');
      let current = acc;
      
      // Create nested objects for dot notation paths
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = validationResults[key].value;
      return acc;
    }, {})
  };
};