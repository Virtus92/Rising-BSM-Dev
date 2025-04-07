/**
 * Validation Service Interface
 * Provides validation capabilities for services
 */

/**
 * Validation rule
 */
export interface ValidationRule {
  /**
   * Field type
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
   * Minimum value/length
   */
  min?: number;
  
  /**
   * Maximum value/length
   */
  max?: number;
  
  /**
   * Pattern to match (for strings)
   */
  pattern?: string | RegExp;
  
  /**
   * Enum values
   */
  enum?: any[];
  
  /**
   * Transform functions
   */
  transform?: ((value: any) => any)[];
  
  /**
   * Custom validation function
   */
  validate?: (value: any, data: any) => boolean | string;
  
  /**
   * Error messages
   */
  messages?: Record<string, string>;
  
  /**
   * Generic error message
   */
  message?: string;
  
  /**
   * Nested schema (for objects)
   */
  schema?: ValidationSchema;
  
  /**
   * Array item validation (for arrays)
   */
  items?: ValidationRule;
  
  /**
   * Custom properties for extended validation types
   */
  [key: string]: any;
}

/**
 * Validation schema
 */
export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Validation result
 */
export interface ValidationResult<T = any> {
  /**
   * Whether validation passed
   */
  isValid: boolean;
  
  /**
   * Validation errors
   */
  errors: string[];
  
  /**
   * Validated data (may include transformations)
   */
  validatedData: T;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Whether to throw error on validation failure
   */
  throwOnError?: boolean;
  
  /**
   * Whether to allow unknown properties
   */
  allowUnknown?: boolean;
  
  /**
   * Whether to strip unknown properties
   */
  stripUnknown?: boolean;
  
  /**
   * Whether to abort early on first error
   */
  abortEarly?: boolean;
  
  /**
   * Whether to convert types when possible
   */
  convert?: boolean;
}

/**
 * Validator function type
 */
export type ValidatorFunction = (value: any, rule: ValidationRule) => boolean | string;

/**
 * Validation Service Interface
 */
export interface IValidationService {
  /**
   * Validate data against a schema
   * 
   * @param data - Data to validate
   * @param schema - Validation schema
   * @param options - Validation options
   * @returns Validation result
   */
  validate<T = any>(data: any, schema: ValidationSchema, options?: ValidationOptions): ValidationResult<T>;
  
  /**
   * Validate data against schema and throw error on failure
   * 
   * @param data - Data to validate
   * @param schema - Validation schema
   * @returns Validation result
   */
  validateOrThrow<T = any>(data: any, schema: ValidationSchema): ValidationResult<T>;
  
  /**
   * Validate a specific field
   * 
   * @param value - Value to validate
   * @param rule - Validation rule
   * @param field - Field name
   * @param options - Validation options
   * @returns Validation result
   */
  validateField(value: any, rule: ValidationRule, field: string, options?: ValidationOptions): ValidationResult<any>;
  
  /**
   * Register a custom validation type
   * 
   * @param type - Type name
   * @param validator - Validator function
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
