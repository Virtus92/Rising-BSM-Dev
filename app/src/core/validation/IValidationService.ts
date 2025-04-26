/**
 * Validation Service Interface
 * This interface defines the contract for validation services
 */

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Schema definition interface
export interface SchemaDefinition {
  [key: string]: {
    type?: string;
    format?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string | RegExp;
    enum?: string[] | number[];
    items?: SchemaDefinition;
    properties?: SchemaDefinition;
    default?: any;
    [key: string]: any;
  }
}

/**
 * Validation service interface
 * Provides methods for validating data against schemas
 */
export interface IValidationService {
  /**
   * Validate data against a schema
   * 
   * @param data Data to validate
   * @param schema Schema to validate against
   * @returns Validation result with isValid flag and errors array
   */
  validate(data: any, schema: SchemaDefinition): ValidationResult;
  
  /**
   * Validate a specific field against a schema
   * 
   * @param field Field name
   * @param value Field value
   * @param schema Schema for the field
   * @returns Validation result with isValid flag and errors array
   */
  validateField(field: string, value: any, schema: SchemaDefinition[string]): ValidationResult;
  
  /**
   * Cast a value to the specified type
   * 
   * @param value Value to cast
   * @param type Target type
   * @returns Cast value
   */
  cast(value: any, type: string): any;
}
