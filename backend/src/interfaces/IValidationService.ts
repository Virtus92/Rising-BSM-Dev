/**
 * IValidationService
 * 
 * Interface for validating data against schemas or rules.
 * Provides methods for standardized validation across the application.
 */
export interface IValidationService {
  /**
   * Validate data against a schema
   * 
   * @param data - Data to validate
   * @param schema - Validation schema
   * @param options - Optional validation options
   * @returns Validation result containing success status, errors, and validated data
   */
  validate<T>(data: any, schema: ValidationSchema, options?: ValidationOptions): ValidationResult<T>;
  
  /**
   * Validate a specific field
   * 
   * @param value - Value to validate
   * @param rule - Validation rule
   * @param field - Field name (for error messages)
   * @param options - Optional validation options
   * @returns Validation result for the specific field
   */
  validateField(
    value: any, 
    rule: ValidationRule, 
    field: string, 
    options?: ValidationOptions
  ): ValidationResult<any>;
  
  /**
   * Register a custom validation type
   * 
   * @param type - Custom type name
   * @param validator - Validator function for the custom type
   */
  registerType(type: string, validator: ValidatorFunction): void;
  
  /**
   * Register a custom validation rule
   * 
   * @param name - Rule name
   * @param validator - Validator function
   */
  registerRule(name: string, validator: ValidatorFunction): void;
  
  /**
   * Create a validation schema from a class/interface
   * 
   * @param target - Class constructor or object with shape of interface
   * @returns Validation schema
   */
  createSchema(target: any): ValidationSchema;
  
  /**
   * Sanitize data against a schema (strip unknown properties)
   * 
   * @param data - Data to sanitize
   * @param schema - Schema to sanitize against
   * @returns Sanitized data
   */
  sanitize<T>(data: any, schema: ValidationSchema): T;
}

/**
 * Validator function type
 */
export type ValidatorFunction = (value: any, options?: any) => boolean | string;

/**
 * Validation rule
 */
export interface ValidationRule {
  /**
   * Data type
   */
  type: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Default value
   */
  default?: any;
  
  /**
   * Minimum value (for numbers) or length (for strings/arrays)
   */
  min?: number;
  
  /**
   * Maximum value (for numbers) or length (for strings/arrays)
   */
  max?: number;
  
  /**
   * Regular expression pattern (for strings)
   */
  pattern?: RegExp | string;
  
  /**
   * Custom validation function
   */
  validate?: (value: any, data?: any) => boolean | string | Promise<boolean | string>;
  
  /**
   * Error message
   */
  message?: string;
  
  /**
   * Error messages for specific validation errors
   */
  messages?: Record<string, string>;
  
  /**
   * Enum values (for enum type)
   */
  enum?: any[];
  
  /**
   * Nested schema (for object type)
   */
  schema?: ValidationSchema;
  
  /**
   * Item validation (for array type)
   */
  items?: ValidationRule;
  
  /**
   * Whether to transform the value before validation
   */
  transform?: Array<(value: any) => any>;
  
  /**
   * Additional rule options
   */
  [key: string]: any;
}

/**
 * Validation schema
 */
export interface ValidationSchema {
  [field: string]: ValidationRule;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Whether to throw on error instead of returning validation result
   */
  throwOnError?: boolean;
  
  /**
   * Whether to abort validation on first error
   */
  abortEarly?: boolean;
  
  /**
   * Whether to strip unknown properties
   */
  stripUnknown?: boolean;
  
  /**
   * Custom validation context
   */
  context?: Record<string, any>;
  
  /**
   * Custom error messages
   */
  messages?: Record<string, string>;
  
  /**
   * Whether to convert types where possible
   */
  convert?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult<T> {
  /**
   * Whether validation was successful
   */
  isValid: boolean;
  
  /**
   * Validation errors
   */
  errors: string[];
  
  /**
   * Validated data (with type conversions, defaults applied, etc.)
   */
  validatedData: T;
}