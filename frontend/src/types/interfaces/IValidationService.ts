/**
 * Validation Service Interface
 * Provides validation capabilities for services
 */
export interface IValidationService {
  /**
   * Validate data against schema
   * 
   * @param data - Data to validate
   * @param schema - Validation schema
   * @param options - Validation options
   * @returns Validation result
   */
  validate(data: any, schema: any, options?: ValidationOptions): ValidationResult;
  
  /**
   * Validate data against schema and throw error on failure
   * 
   * @param data - Data to validate
   * @param schema - Validation schema
   * @returns Validation result
   */
  validateOrThrow(data: any, schema: any): ValidationResult;
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
}

/**
 * Validation result
 */
export interface ValidationResult {
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
  value?: any;
}
