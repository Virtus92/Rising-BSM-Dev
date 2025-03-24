/**
 * Validation Utilities
 * 
 * Comprehensive validation utilities for data validation and sanitization.
 * Provides schema-based validation, common validation rules, and validation middleware.
 */
import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { ValidationError } from './error.utils.js';
import { logger } from './common.utils.js';

/**
 * Validation related types
 */

/**
 * Validation rule interface
 */
export interface ValidationRule {
  type: 'text' | 'email' | 'phone' | 'date' | 'numeric' | 'password' | 'time' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum' | 'custom';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp | string;
  validate?: (value: any, data?: any) => boolean | string | Promise<boolean | string>;
  message?: string;
  messages?: {
    required?: string;
    min?: string;
    max?: string;
    pattern?: string;
    type?: string;
    enum?: string;
    [key: string]: string | undefined;
  };
  enum?: any[];
  schema?: ValidationSchema;
  items?: ValidationRule;
  options?: Record<string, any>;
  transform?: Array<(value: any) => any>;
  integer?: boolean;
  [key: string]: any;
}

/**
 * Validation schema for multiple fields
 */
export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  throwOnError?: boolean;
  stopOnFirstError?: boolean;
  customMessages?: Record<string, string>;
}

/**
 * Validation result
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: string[];
  validatedData: T;
}

/**
 * Common validation patterns
 */
export const validationPatterns = {
  /**
   * Email regular expression
   */
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  /**
   * Phone number regular expression (international format)
   */
  phone: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
  
  /**
   * Date format (YYYY-MM-DD)
   */
  date: /^\d{4}-\d{2}-\d{2}$/,
  
  /**
   * Time format (HH:MM)
   */
  time: /^([01]\d|2[0-3]):([0-5]\d)$/,
  
  /**
   * Password requirement (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
   */
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  
  /**
   * URL format
   */
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
  
  /**
   * Postal code (general format)
   */
  postalCode: /^\d{4,10}$/,
  
  /**
   * Currency amount
   */
  currency: /^\d+(\.\d{1,2})?$/
};

/**
 * Common error messages
 */
export const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  date: 'Please enter a valid date in YYYY-MM-DD format',
  time: 'Please enter a valid time in HH:MM format',
  password: 'Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one number',
  url: 'Please enter a valid URL',
  postalCode: 'Please enter a valid postal code',
  currency: 'Please enter a valid amount',
  min: (min: number) => `Value must be at least ${min}`,
  max: (max: number) => `Value must not exceed ${max}`,
  minLength: (min: number) => `Must be at least ${min} characters long`,
  maxLength: (max: number) => `Must not exceed ${max} characters`,
  pattern: 'Value does not match the required pattern',
  enum: (values: any[]) => `Value must be one of: ${values.join(', ')}`,
  integer: 'Value must be an integer',
  positive: 'Value must be positive',
  negative: 'Value must be negative',
  passwordMatch: 'Passwords do not match'
};

/**
 * Common schema fields for reuse
 */
export const schemaFields = {
  /**
   * ID field schema
   */
  id: {
    type: 'number',
    required: true,
    messages: {
      required: 'ID is required',
      type: 'ID must be a number'
    }
  },
  
  /**
   * Name field schema
   */
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 100,
    messages: {
      required: 'Name is required',
      min: 'Name must be at least 2 characters long',
      max: 'Name must not exceed 100 characters'
    }
  },
  
  /**
   * Email field schema
   */
  email: {
    type: 'email',
    required: true,
    messages: {
      required: 'Email is required',
      email: 'Invalid email format'
    }
  },
  
  /**
   * Phone field schema
   */
  phone: {
    type: 'phone',
    required: false,
    messages: {
      phone: 'Invalid phone number format'
    }
  },
  
  /**
   * Password field schema
   */
  password: {
    type: 'password',
    required: true,
    min: 8,
    messages: {
      required: 'Password is required',
      min: 'Password must be at least 8 characters long'
    }
  },
  
  /**
   * Date field schema
   */
  date: {
    type: 'date',
    required: true,
    messages: {
      required: 'Date is required',
      date: 'Invalid date format'
    }
  },
  
  /**
   * Time field schema
   */
  time: {
    type: 'time',
    required: true,
    messages: {
      required: 'Time is required',
      time: 'Invalid time format'
    }
  },
  
  /**
   * Numeric field schema
   */
  numeric: {
    type: 'numeric',
    required: true,
    messages: {
      required: 'This field is required',
      type: 'Value must be a number'
    }
  },
  
  /**
   * Money field schema
   */
  money: {
    type: 'numeric',
    required: true,
    min: 0,
    messages: {
      required: 'Amount is required',
      type: 'Amount must be a number',
      min: 'Amount must be a non-negative number'
    }
  },
  
  /**
   * Text field schema
   */
  text: {
    type: 'text',
    required: false,
    max: 2000,
    messages: {
      max: 'Text must not exceed 2000 characters'
    }
  }
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /**
   * Pagination query schema
   */
  pagination: {
    page: {
      type: 'numeric',
      required: false,
      min: 1,
      integer: true,
      messages: {
        min: 'Page must be at least 1',
        type: 'Page must be a number'
      }
    },
    limit: {
      type: 'numeric',
      required: false,
      min: 1,
      max: 100,
      integer: true,
      messages: {
        min: 'Limit must be at least 1',
        max: 'Limit must not exceed 100',
        type: 'Limit must be a number'
      }
    },
    sortBy: {
      type: 'string',
      required: false
    },
    sortDirection: {
      type: 'enum',
      required: false,
      enum: ['asc', 'desc']
    }
  },
  
  /**
   * Date range schema
   */
  dateRange: {
    startDate: {
      type: 'date',
      required: false,
      messages: {
        date: 'Invalid start date format'
      }
    },
    endDate: {
      type: 'date',
      required: false,
      messages: {
        date: 'Invalid end date format'
      }
    }
  },
  
  /**
   * ID parameter schema
   */
  idParam: {
    id: schemaFields.id
  },
  
  /**
   * Search query schema
   */
  search: {
    search: {
      type: 'string',
      required: false,
      min: 1,
      max: 100,
      messages: {
        min: 'Search term must not be empty',
        max: 'Search term must not exceed 100 characters'
      }
    }
  },
  
  /**
   * Status query schema
   */
  status: {
    status: {
      type: 'string',
      required: false
    }
  },
  
  /**
   * Note creation schema
   */
  note: {
    note: {
      type: 'string',
      required: true,
      min: 1,
      max: 1000,
      messages: {
        required: 'Note text is required',
        min: 'Note text cannot be empty',
        max: 'Note text must not exceed 1000 characters'
      }
    }
  }
};

/**
 * Validates email address
 */
export const validateEmail = (
  email: string | null | undefined,
  options: { required?: boolean } = {}
): ValidationResult<string> => {
  const { required = false } = options;
  const errors: string[] = [];

  // Handle null, undefined or empty
  if (!email) {
    if (required) {
      errors.push('Email address is required');
    }
    return { isValid: !required, errors, validatedData: '' };
  }

  // Check if email is valid
  if (!validator.isEmail(email)) {
    errors.push('Invalid email address format');
    return {
      isValid: false,
      errors,
      validatedData: String(email) // Return original value for invalid emails
    };
  }

  // Normalize and sanitize email
  const sanitizedEmail = validator.normalizeEmail(email) || email.toLowerCase();

  return {
    isValid: true,
    errors,
    validatedData: sanitizedEmail
  };
};

/**
 * Validates a phone number
 */
export const validatePhone = (
  phone: string | null | undefined,
  required: boolean = false
): ValidationResult<string> => {
  const errors: string[] = [];

  // Handle null, undefined or empty
  if (!phone) {
    if (required) {
      errors.push('Phone number is required');
    }
    return { isValid: !required, errors, validatedData: '' };
  }

  // Remove non-digit characters for validation
  const cleanedPhone = String(phone).replace(/\D/g, '');

  // Basic phone number validation
  if (cleanedPhone && !validator.isMobilePhone(cleanedPhone, 'any', { strictMode: false })) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedData: cleanedPhone
  };
};

/**
 * Comprehensive input validation
 */
export const validateInput = <T extends Record<string, any>>(
  data: Record<string, any>,
  schema: ValidationSchema,
  options: ValidationOptions = {}
): ValidationResult<T> => {
  const { throwOnError = false, stopOnFirstError = false } = options;
  const errors: string[] = [];
  const validatedData: Record<string, any> = {};

  // Process each field in the schema
  for (const [field, rule] of Object.entries(schema)) {
    if (errors.length > 0 && stopOnFirstError) {
      break;
    }

    let value = data[field];
    const fieldErrors: string[] = [];

    // Apply default value if field is undefined and default is specified
    if ((value === undefined || value === null || value === '') && rule.default !== undefined) {
      value = rule.default;
    }

    // Required field validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      const errorMsg = rule.messages?.required || `${field} is required`;
      fieldErrors.push(errorMsg);
    }

    // Skip further validation if field is not required and empty
    if ((value === undefined || value === null || value === '') && !rule.required) {
      validatedData[field] = rule.default !== undefined ? rule.default : null;
      continue;
    }

    // Apply type-specific validation if value exists
    if (value !== undefined && value !== null && value !== '') {
      switch (rule.type) {
        case 'email':
          if (typeof value === 'string' && !validator.isEmail(value)) {
            fieldErrors.push(rule.messages?.type || 'Invalid email format');
          }
          break;

        case 'phone':
          if (typeof value === 'string' && value.trim() !== '') {
            const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
            if (!phoneRegex.test(value)) {
              fieldErrors.push(rule.messages?.type || 'Invalid phone number format');
            }
          }
          break;

        case 'date':
          if (typeof value === 'string' && !isValidDate(value)) {
            fieldErrors.push(rule.messages?.type || 'Invalid date format');
          }
          break;

        case 'numeric':
        case 'number':
          const numValue = typeof value === 'number' ? value : Number(value);
          if (isNaN(numValue)) {
            fieldErrors.push(rule.messages?.type || 'Value must be a number');
          } else {
            // Min/max validation for numbers
            if (rule.min !== undefined && numValue < rule.min) {
              fieldErrors.push(rule.messages?.min || `Value must be at least ${rule.min}`);
            }
            if (rule.max !== undefined && numValue > rule.max) {
              fieldErrors.push(rule.messages?.max || `Value must not exceed ${rule.max}`);
            }
            if (rule.integer && !Number.isInteger(numValue)) {
              fieldErrors.push(rule.messages?.integer || 'Value must be an integer');
            }
          }
          break;

        case 'text':
        case 'string':
          if (typeof value !== 'string') {
            value = String(value);
          }
          // Min/max length validation for strings
          if (rule.minLength !== undefined && value.length < rule.minLength) {
            fieldErrors.push(rule.messages?.minLength || `Value must be at least ${rule.minLength} characters long`);
          }
          if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            fieldErrors.push(rule.messages?.maxLength || `Value must not exceed ${rule.maxLength} characters`);
          }
          // Pattern validation
          if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
            fieldErrors.push(rule.messages?.pattern || 'Value does not match the required pattern');
          }
          break;

        case 'enum':
          const enumValues = rule.enum || [];
          if (!enumValues.includes(value)) {
            fieldErrors.push(rule.messages?.enum || `Value must be one of: ${enumValues.join(', ')}`);
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            // Convert string 'true'/'false' to boolean
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else fieldErrors.push(rule.messages?.type || 'Value must be a boolean');
          }
          break;

        case 'password':
          if (typeof value === 'string') {
            if (rule.minLength !== undefined && value.length < rule.minLength) {
              fieldErrors.push(rule.messages?.minLength || `Password must be at least ${rule.minLength} characters long`);
            }
            // Custom password validation can be added here
          }
          break;

        case 'time':
          if (typeof value === 'string') {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(value)) {
              fieldErrors.push(rule.messages?.type || 'Invalid time format (use HH:MM)');
            }
          }
          break;
      }

      // Custom validation function
      if (rule.validate && typeof rule.validate === 'function') {
        try {
          const validateResult = rule.validate(value, data);
          if (validateResult === false || typeof validateResult === 'string') {
            fieldErrors.push(typeof validateResult === 'string' ? validateResult : (rule.message || `Invalid ${field}`));
          }
        } catch (error) {
          fieldErrors.push(`Validation error: ${(error as Error).message}`);
        }
      }
    }

    // Add field errors to the global errors list
    if (fieldErrors.length > 0) {
      errors.push(...fieldErrors.map(err => `${field}: ${err}`));
    } else {
      // Add valid value to the resulting object
      validatedData[field] = value;
    }
  }

  const isValid = errors.length === 0;

  // Throw error if validation failed and throwOnError is true
  if (!isValid && throwOnError) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    isValid,
    errors,
    validatedData: validatedData as T
  };
};

/**
 * Helper function to check if a string is a valid date
 */
function isValidDate(dateString: string): boolean {
  // First check for the pattern
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  // Parse the date parts to integers
  const parts = dateString.split("-").map(part => parseInt(part, 10));
  
  // Make a date object
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  
  // Check if the date is valid
  return date.getFullYear() === parts[0] &&
         date.getMonth() === parts[1] - 1 &&
         date.getDate() === parts[2];
}

/**
 * Merge multiple schemas
 */
export function mergeSchemas(...schemas: ValidationSchema[]): ValidationSchema {
  return schemas.reduce((result, schema) => {
    return { ...result, ...schema };
  }, {});
}

/**
 * Make schema fields optional
 */
export function makeOptional(schema: ValidationSchema): ValidationSchema {
  const result: ValidationSchema = {};
  
  for (const [key, rule] of Object.entries(schema)) {
    result[key] = {
      ...rule,
      required: false
    };
  }
  
  return result;
}

/**
 * Extract subschema from schema
 */
export function extractSchema(schema: ValidationSchema, fields: string[]): ValidationSchema {
  const result: ValidationSchema = {};
  
  for (const field of fields) {
    if (schema[field]) {
      result[field] = schema[field];
    }
  }
  
  return result;
}

/**
 * Validation middleware
 */

/**
 * Validates request body against a schema
 */
export const validateBody = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { validatedData, isValid, errors } = validateInput(
        req.body, 
        schema,
        { throwOnError: false }
      );
      
      if (!isValid) {
        logger.debug('Validation failed', { errors, body: req.body });
        throw new ValidationError('Validation failed', errors);
      }
      
      // Attach validated data to request for use in controller
      (req as any).validatedData = validatedData;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates request query parameters against a schema
 */
export const validateQuery = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationResult = validateInput(req.query, schema, { throwOnError: false });

      if (!validationResult.isValid) {
        logger.debug('Query validation failed', { errors: validationResult.errors, query: req.query });
        throw new ValidationError(
          'Query validation failed', 
          validationResult.errors
        );
      }

      // Attach validated query to request for use in controller
      (req as any).validatedQuery = validationResult.validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validates request parameters against a schema
 */
export const validateParams = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationResult = validateInput(req.params, schema, { throwOnError: false });

      if (!validationResult.isValid) {
        logger.debug('Params validation failed', { errors: validationResult.errors, params: req.params });
        throw new ValidationError(
          'Params validation failed', 
          validationResult.errors
        );
      }

      // Attach validated parameters to request for use in controller
      (req as any).validatedParams = validationResult.validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Creates a combined validation middleware for multiple request parts
 */
export const validateRequest = (
  bodySchema?: ValidationSchema,
  querySchema?: ValidationSchema,
  paramsSchema?: ValidationSchema
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationErrors: string[] = [];

      // Validate body if schema provided
      if (bodySchema) {
        const bodyResult = validateInput(req.body, bodySchema, { throwOnError: false });
        if (!bodyResult.isValid) {
          validationErrors.push(...bodyResult.errors.map(err => `Body: ${err}`));
        } else {
          (req as any).validatedData = bodyResult.validatedData;
        }
      }

      // Validate query if schema provided
      if (querySchema) {
        const queryResult = validateInput(req.query, querySchema, { throwOnError: false });
        if (!queryResult.isValid) {
          validationErrors.push(...queryResult.errors.map(err => `Query: ${err}`));
        } else {
          (req as any).validatedQuery = queryResult.validatedData;
        }
      }

      // Validate params if schema provided
      if (paramsSchema) {
        const paramsResult = validateInput(req.params, paramsSchema, { throwOnError: false });
        if (!paramsResult.isValid) {
          validationErrors.push(...paramsResult.errors.map(err => `Params: ${err}`));
        } else {
          (req as any).validatedParams = paramsResult.validatedData;
        }
      }

      // If any validation errors occurred, throw ValidationError
      if (validationErrors.length > 0) {
        logger.debug('Request validation failed', { errors: validationErrors });
        throw new ValidationError(
          'Request validation failed',
          validationErrors
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};