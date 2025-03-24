/**
 * Validation Utilities
 * Comprehensive validation utilities for data validation and sanitization.
 */
import validator from 'validator';
import { ValidationError } from './errors.js';

/**
 * Validation related types
 */

/**
 * Base validation options interface
 */
export interface BaseValidationOptions {
  required?: boolean;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: string[];
  value: T;
}

/**
 * Validation schema for comprehensive input validation
 */
export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Generic validation rule interface
 */
export interface ValidationRule extends BaseValidationOptions {
  type: 'text' | 'email' | 'phone' | 'date' | 'numeric' | 'password' | 'time' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum' | 'custom';
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
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
  [key: string]: any; // Allow additional properties based on type
}

/**
 * Text validation options
 */
export interface TextValidationOptions extends BaseValidationOptions {
  minLength?: number;
  maxLength?: number;
  trim?: boolean;
  escape?: boolean;
  pattern?: RegExp;
}

/**
 * Date validation options
 */
export interface DateValidationOptions extends BaseValidationOptions {
  pastAllowed?: boolean;
  futureAllowed?: boolean;
  beforeDate?: Date | string;
  afterDate?: Date | string;
}

/**
 * Numeric validation options
 */
export interface NumericValidationOptions extends BaseValidationOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
  negative?: boolean;
}

/**
 * Password validation options
 */
export interface PasswordValidationOptions extends BaseValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

/**
 * Time validation options
 */
export interface TimeValidationOptions extends BaseValidationOptions {
  format?: '24h' | '12h';
}

/**
 * Validation options for validateInput
 */
export interface ValidationOptions {
  throwOnError?: boolean;
  stopOnFirstError?: boolean;
  customMessages?: Record<string, string>;
}

/**
 * Field error information
 */
export interface FieldError {
  path: string;
  message: string;
  type: string;
  value?: any;
}

/**
 * Validate and sanitize text input
 * @param input Input text to validate
 * @param options Validation options
 * @returns Validation result
 */
export const validateText = (
  input: string | null | undefined, 
  options: TextValidationOptions = {}
): ValidationResult<string> => {
  const {
    required = false,
    minLength = 0,
    maxLength = 500,
    trim = true,
    escape = true,
    pattern
  } = options;

  const errors: string[] = [];

  // Handle null or undefined
  if (input === null || input === undefined) {
    if (required) {
      errors.push('Input is required');
    }
    return { isValid: !required, errors, value: '' };
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
    errors.push(`Input does not match the required pattern`);
  }

  // Escape if requested
  let sanitizedValue = value;
  if (escape) {
    // Custom escaping without escaping forward slashes
    sanitizedValue = sanitizedValue
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: sanitizedValue
  };
};

/**
 * Validate email address
 * @param email Email to validate
 * @param options Validation options
 * @returns Validation result
 */
export const validateEmail = (
  email: string | null | undefined,
  options: BaseValidationOptions = {}
): ValidationResult<string> => {
  const { required = false } = options;
  const errors: string[] = [];

  // Handle null, undefined or empty
  if (!email) {
    if (required) {
      errors.push('Email address is required');
    }
    return { isValid: !required, errors, value: '' };
  }

  // Check if email is valid
  if (!validator.isEmail(email)) {
    errors.push('Invalid email address format');
    return {
      isValid: false,
      errors,
      value: String(email) // Return original value for invalid emails
    };
  }

  // Normalize and sanitize email
  const sanitizedEmail = validator.normalizeEmail(email) || email.toLowerCase();

  return {
    isValid: true,
    errors,
    value: sanitizedEmail
  };
};

/**
 * Validate phone number
 * @param phone Phone number to validate
 * @param options Validation options
 * @returns Validation result
 */
export const validatePhone = (
  phone: string | null | undefined,
  options: BaseValidationOptions = {}
): ValidationResult<string> => {
  const { required = false } = options;
  const errors: string[] = [];

  // Handle null, undefined or empty
  if (!phone) {
    if (required) {
      errors.push('Phone number is required');
    }
    return { isValid: !required, errors, value: '' };
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
    value: cleanedPhone
  };
};

/**
 * Validate date
 * @param date Date to validate
 * @param options Validation options
 * @returns Validation result
 */
export const validateDate = (
  date: string | Date | null | undefined,
  options: DateValidationOptions = {}
): ValidationResult<Date | null> => {
  const {
    required = false,
    pastAllowed = true,
    futureAllowed = true,
    beforeDate,
    afterDate
  } = options;

  const errors: string[] = [];

  // Handle null or undefined
  if (date === null || date === undefined || (typeof date === 'string' && date.trim() === '')) {
    if (required) {
      errors.push('Date is required');
    }
    return { isValid: !required, errors, value: null };
  }

  let parsedDate: Date;
  
  try {
    // Convert to Date object if string
    parsedDate = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }
  } catch (error) {
    errors.push('Invalid date format');
    return { isValid: false, errors, value: null };
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
    const compareDate = beforeDate instanceof Date ? beforeDate : new Date(beforeDate);
    if (!isNaN(compareDate.getTime()) && parsedDate > compareDate) {
      errors.push(`Date must be before ${beforeDate instanceof Date ? 
        beforeDate.toLocaleDateString() : beforeDate}`);
    }
  }

  // After date validation
  if (afterDate) {
    const compareDate = afterDate instanceof Date ? afterDate : new Date(afterDate);
    if (!isNaN(compareDate.getTime()) && parsedDate < compareDate) {
      errors.push(`Date must be after ${afterDate instanceof Date ? 
        afterDate.toLocaleDateString() : afterDate}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: parsedDate
  };
};

/**
 * Validate time format (24-hour format: HH:MM by default)
 * @param time Time string to validate
 * @param options Validation options
 * @returns Validation result
 */
export const validateTimeFormat = (
  time: string | null | undefined,
  options: TimeValidationOptions = {}
): ValidationResult<string> => {
  const {
    required = false,
    format = '24h'
  } = options;

  const errors: string[] = [];

  // Handle null, undefined or empty
  if (!time) {
    if (required) {
      errors.push('Time is required');
    }
    return { isValid: !required, errors, value: '' };
  }

  // Choose regex based on format
  const timeRegex = format === '24h' 
    ? /^([01]\d|2[0-3]):([0-5]\d)$/ // 24-hour format (HH:MM)
    : /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/; // 12-hour format (HH:MM AM/PM)
  
  if (!timeRegex.test(String(time))) {
    errors.push(`Invalid time format. Use ${format === '24h' ? '24-hour format (HH:MM)' : 
      '12-hour format (HH:MM AM/PM)'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: String(time)
  };
};

/**
 * Validate numeric values
 * @param value Numeric value to validate
 * @param options Validation options
 * @returns Validation result
 */
export const validateNumeric = (
  value: number | string | null | undefined,
  options: NumericValidationOptions = {}
): ValidationResult<number | null> => {
  const {
    required = false,
    min = -Infinity,
    max = Infinity,
    integer = false,
    positive = false,
    negative = false
  } = options;

  const errors: string[] = [];

  // Handle null, undefined or empty
  if (value === null || value === undefined || value === '') {
    if (required) {
      errors.push('Numeric value is required');
    }
    return { isValid: !required, errors, value: null };
  }

  // Convert to number
  const numericValue = typeof value === 'number' ? value : Number(value);

  // Check if numeric
  if (isNaN(numericValue)) {
    errors.push('Value must be a number');
    return { isValid: false, errors, value: null };
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

  // Positive/negative validation
  if (positive && numericValue <= 0) {
    errors.push('Value must be positive');
  }

  if (negative && numericValue >= 0) {
    errors.push('Value must be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: numericValue
  };
};

/**
 * Validate password strength
 * @param password Password to validate
 * @param options Validation options
 * @returns Validation result
 */
export const validatePassword = (
  password: string | null | undefined,
  options: PasswordValidationOptions = {}
): ValidationResult<string> => {
  const {
    required = true,
    minLength = 12,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options;

  const errors: string[] = [];

  // Handle null, undefined or empty
  if (!password) {
    if (required) {
      errors.push('Password is required');
    }
    return { isValid: !required, errors, value: '' };
  }

  // Length validation
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  // Character type validations
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: password
  };
};

/**
 * Validate enum values
 * @param value Value to validate
 * @param options Validation options with allowed values
 * @returns Validation result
 */
export const validateEnum = (
  value: any,
  options: BaseValidationOptions & { values: any[] }
): ValidationResult<any> => {
  const { required = false, values } = options;
  const errors: string[] = [];

  if ((value === null || value === undefined) && required) {
    errors.push('Value is required');
    return { isValid: false, errors, value: null };
  }

  if (value !== null && value !== undefined && !values.includes(value)) {
    errors.push(`Value must be one of: ${values.join(', ')}`);
    return { isValid: false, errors, value };
  }

  return {
    isValid: true,
    errors: [],
    value
  };
};

/**
 * Comprehensive input validation
 * @param data Input data to validate
 * @param schema Validation schema
 * @param options Additional options for validation
 * @returns Validation result for the entire object
 */
export const validateInput = <T extends Record<string, any>>(
  data: Record<string, any>,
  schema: ValidationSchema,
  options: ValidationOptions = {}
): { isValid: boolean; errors: string[]; validatedData: T } => {
  const { throwOnError = false, stopOnFirstError = false } = options;
  const errors: string[] = [];
  const validatedData: Record<string, any> = {};

  Object.entries(schema).forEach(([field, rule]) => {
    if (errors.length > 0 && stopOnFirstError) {
      return;
    }

    const value = data[field];
    let result: ValidationResult<any>;

    // Apply appropriate validation based on type
    switch (rule.type) {
      case 'text':
      case 'string':
        result = validateText(value, rule);
        break;
      case 'email':
        result = validateEmail(value, rule);
        break;
      case 'phone':
        result = validatePhone(value, rule);
        break;
      case 'date':
        result = validateDate(value, rule);
        break;
      case 'numeric':
      case 'number':
        result = validateNumeric(value, rule);
        break;
      case 'password':
        result = validatePassword(value, rule);
        break;
      case 'time':
        result = validateTimeFormat(value, rule);
        break;
      case 'enum':
        if (!rule.values && rule.enum) {
          rule.values = rule.enum;
        }
        result = validateEnum(value, rule as BaseValidationOptions & { values: any[] });
        break;
      default:
        // Default pass-through for types we don't explicitly handle
        result = {
          isValid: true,
          errors: [],
          value: value
        };
    }

    // Save validated value
    validatedData[field] = result.value;

    // Collect errors
    if (!result.isValid) {
      result.errors.forEach(err => errors.push(`${field}: ${err}`));
    }
  });

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

// Extension for allowing string literals in validation rule types
export interface ExtendedValidationRule extends Omit<ValidationRule, 'type'> {
  type: ValidationRule['type'] | string;
}

export interface ExtendedValidationSchema {
  [key: string]: ExtendedValidationRule;
}

// Helper function to convert extended schema to standard schema
export function convertValidationSchema(schema: ExtendedValidationSchema): ValidationSchema {
  const converted: ValidationSchema = {};
  
  for (const [key, rule] of Object.entries(schema)) {
    converted[key] = {
      ...rule,
      type: rule.type as ValidationRule['type']
    };
  }
  
  return converted;
}

/**
 * Type guard to ensure validation schema types are correct
 */
export function isValidType(type: string): type is ValidationRule['type'] {
  return [
    'text', 'email', 'phone', 'date', 'numeric', 'password', 'time',
    'string', 'number', 'boolean', 'array', 'object', 'enum', 'custom'
  ].includes(type);
}

/**
 * Environment validation helper
 * @param key Environment variable key
 * @param defaultValue Default value if not provided
 * @param validator Optional validation function
 */
export function env<T>(
  key: string, 
  defaultValue: T, 
  validator?: (value: any) => boolean
): T {
  const value = process.env[key];
  
  if (value === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Warning: ${key} is not set in environment variables, using default: ${defaultValue}`);
    }
    return defaultValue;
  }
  
  // Attempt to convert the string value to the correct type based on defaultValue
  let convertedValue: any;
  
  if (typeof defaultValue === 'number') {
    convertedValue = Number(value);
    if (isNaN(convertedValue)) {
      console.warn(`⚠️ Warning: ${key} value "${value}" is not a valid number, using default: ${defaultValue}`);
      return defaultValue;
    }
  } else if (typeof defaultValue === 'boolean') {
    convertedValue = value.toLowerCase() === 'true';
  } else {
    convertedValue = value;
  }
  
  // Apply validator if provided
  if (validator && !validator(convertedValue)) {
    console.warn(`⚠️ Warning: ${key} value "${value}" failed validation, using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return convertedValue as T;
}