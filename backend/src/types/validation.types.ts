/**
 * Validation Types
 * 
 * Type definitions for validation rules, schemas, and validation results.
 */

/**
 * Field validation rule
 */
export interface ValidationRule {
  /**
   * Rule type
   */
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'object' | 'array' | 'enum' | 'custom';
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Default value if field is missing or null
   */
  default?: any;
  
  /**
   * Minimum string length or number value
   */
  min?: number;
  
  /**
   * Maximum string length or number value
   */
  max?: number;
  
  /**
   * Minimum string length (alias for min for backward compatibility)
   */
  minLength?: number;
  
  /**
   * Maximum string length (alias for max for backward compatibility)
   */
  maxLength?: number;
  
  /**
   * Regular expression pattern to match
   */
  pattern?: RegExp | string;
  
  /**
   * Whether the number must be an integer
   */
  integer?: boolean;
  
  /**
   * Custom validation function
   */
  validate?: (value: any, data?: any) => boolean | string | Promise<boolean | string>;
  
  /**
   * Custom error message
   */
  message?: string;
  
  /**
   * Error messages for specific validation failures
   */
  messages?: {
    required?: string;
    min?: string;
    max?: string;
    minLength?: string;
    maxLength?: string;
    pattern?: string;
    type?: string;
    enum?: string;
    integer?: string;
    [key: string]: string | undefined;
  };
  
  /**
   * Allowed values for enum type
   */
  enum?: any[];
  
  /**
   * Options for enum (alias for enum for backward compatibility)
   */
  options?: any[] | Record<string, any>;
  
  /**
   * Nested schema for object type
   */
  schema?: ValidationSchema;
  
  /**
   * Item validation for array type
   */
  items?: ValidationRule;
  
  /**
   * Additional type-specific options
   */
  [key: string]: any;
  
  /**
   * Array of transformation functions to apply before validation
   */
  transform?: Array<(value: any) => any>;
}

/**
 * Validation schema for multiple fields
 */
export interface ValidationSchema {
  [field: string]: ValidationRule;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Whether to abort on first error
   */
  abortEarly?: boolean;
  
  /**
   * Alias for abortEarly (backward compatibility)
   */
  stopOnFirstError?: boolean;
  
  /**
   * Whether to strip fields not in the schema
   */
  stripUnknown?: boolean;
  
  /**
   * Whether to convert types where possible
   */
  convert?: boolean;
  
  /**
   * Whether to throw an error instead of returning validation result
   */
  throwOnError?: boolean;
  
  /**
   * Custom validation messages
   */
  customMessages?: Record<string, string>;
  
  /**
   * Context data for custom validators
   */
  context?: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult<T = any> {
  /**
   * Whether validation was successful
   */
  isValid: boolean;
  
  /**
   * Array of error messages
   */
  errors: string[];
  
  /**
   * Validated and transformed data
   */
  data: T;
  
  /**
   * Validated data (alias for data for backward compatibility)
   */
  validatedData?: T;
  
  /**
   * Field names with validation errors
   */
  invalidFields: string[];
}

/**
 * Error information for a specific field
 */
export interface FieldError {
  /**
   * Field path
   */
  path: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error type
   */
  type: string;
  
  /**
   * Field value that caused the error
   */
  value?: any;
}

/**
 * Validator interface
 */
export interface IValidator {
  /**
   * Validate data against schema
   */
  validate<T>(data: any, schema: ValidationSchema, options?: ValidationOptions): ValidationResult<T>;
  
  /**
   * Validate a single value against a rule
   */
  validateField(value: any, rule: ValidationRule, field: string, data?: any): Promise<FieldError | null>;
}