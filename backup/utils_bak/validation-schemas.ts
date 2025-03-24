/**
 * Validation Schemas
 * 
 * Common validation schemas for reuse across the application.
 * Provides consistent validation patterns and error messages.
 */
import { ValidationSchema } from '../types/validation.js';

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
 * Common schema fields
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
 * Merge multiple schemas
 * @param schemas Schemas to merge
 * @returns Merged schema
 */
export function mergeSchemas(...schemas: ValidationSchema[]): ValidationSchema {
  return schemas.reduce((result, schema) => {
    return { ...result, ...schema };
  }, {});
}

/**
 * Make schema fields optional
 * @param schema Schema to modify
 * @returns Schema with optional fields
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
 * @param schema Full schema
 * @param fields Fields to extract
 * @returns Extracted subschema
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