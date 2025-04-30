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

// Allow DTO types to be used as SchemaDefinition
export type SchemaDefinitionInput = SchemaDefinition | Record<string, any>;

/**
 * Validation service interface
 * Provides methods for validating data against schemas
 */
export interface IValidationService {
  /**
   * Validate data against a schema or schema name
   * 
   * @param schemaNameOrData Schema name or data to validate
   * @param data Data to validate if first param is schema name, or schema if first param is data
   * @returns Validation result with isValid flag and errors array
   */
  validate(schemaNameOrData: string | any, data?: SchemaDefinitionInput | any): ValidationResult;
  
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

  /**
   * Validate user creation data
   * 
   * @param data User creation data
   * @returns Validation result
   */
  validateCreateUser(data: any): ValidationResult;

  /**
   * Validate user update data
   * 
   * @param data User update data
   * @returns Validation result
   */
  validateUpdateUser(data: any): ValidationResult;

  /**
   * Validate password against security requirements
   * 
   * @param password Password to validate
   * @returns Validation result
   */
  validatePassword(password: string): ValidationResult;
}
