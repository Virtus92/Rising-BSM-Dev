/**
 * Validator
 * 
 * Provides data validation utilities for validating request data against schemas.
 * Implements consistent validation patterns across the application.
 */
import {
    ValidationRule,
    ValidationSchema,
    ValidationOptions,
    ValidationResult,
    FieldError,
    IValidator
  } from '../types/validation.types.js';
  
  /**
   * Validator class implementing IValidator interface
   */
  class Validator implements IValidator {
    /**
     * Validate data against a schema
     * @param data - Data to validate
     * @param schema - Validation schema
     * @param options - Validation options
     * @returns Validation result
     */
    public async validate<T>(
      data: any,
      schema: ValidationSchema,
      options: ValidationOptions = {}
    ): Promise<ValidationResult<T>> {
      const {
        abortEarly = false,
        stripUnknown = true,
        convert = true,
        context = {}
      } = options;
      
      const errors: string[] = [];
      const invalidFields: string[] = [];
      const validatedData: Record<string, any> = {};
      
      // Ensure data is an object
      const objData = typeof data === 'object' && data !== null ? data : {};
      
      // Process each field in the schema
      for (const [field, rule] of Object.entries(schema)) {
        try {
          // Get field value, applying default if necessary
          let value = objData[field];
          if ((value === undefined || value === null) && rule.default !== undefined) {
            value = rule.default;
          }
          
          // Apply transform functions if available
          if (rule.transform && Array.isArray(rule.transform)) {
            for (const transform of rule.transform) {
              value = transform(value);
            }
          }
          
          // Validate the field
          const fieldError = await this.validateField(value, rule, field, objData);
          
          if (fieldError) {
            errors.push(fieldError.message);
            invalidFields.push(field);
            
            if (abortEarly) {
              break;
            }
          } else {
            // Store validated value in result
            validatedData[field] = value;
          }
        } catch (error) {
          // Handle unexpected errors during validation
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`${field}: ${errorMessage}`);
          invalidFields.push(field);
          
          if (abortEarly) {
            break;
          }
        }
      }
      
      // Include non-schema fields if not stripping unknown
      if (!stripUnknown) {
        for (const [key, value] of Object.entries(objData)) {
          if (!(key in schema) && value !== undefined) {
            validatedData[key] = value;
          }
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        data: validatedData as T,
        invalidFields
      };
    }
    
    /**
     * Validate a single field against a rule
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @param data - Complete data object
     * @returns Field error or null if valid
     */
    public async validateField(
      value: any,
      rule: ValidationRule,
      field: string,
      data?: any
    ): Promise<FieldError | null> {
      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        return {
          path: field,
          type: 'required',
          message: this.getErrorMessage('required', rule, field),
          value
        };
      }
      
      // Allow undefined or null for non-required fields
      if (value === undefined || value === null) {
        return null;
      }
      
      // Type validation
      if (!this.validateType(value, rule.type)) {
        return {
          path: field,
          type: 'type',
          message: this.getErrorMessage('type', rule, field),
          value
        };
      }
      
      // Type-specific validations
      switch (rule.type) {
        case 'string':
          return this.validateString(value, rule, field);
          
        case 'number':
          return this.validateNumber(value, rule, field);
          
        case 'date':
          return this.validateDate(value, rule, field);
          
        case 'email':
          return this.validateEmail(value, rule, field);
          
        case 'phone':
          return this.validatePhone(value, rule, field);
          
        case 'enum':
          return this.validateEnum(value, rule, field);
          
        case 'array':
          return this.validateArray(value, rule, field);
          
        case 'object':
          return this.validateObject(value, rule, field);
          
        case 'custom':
          return this.validateCustom(value, rule, field, data);
      }
      
      return null;
    }
    
    /**
     * Validate string type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Field error or null if valid
     */
    private validateString(
      value: any,
      rule: ValidationRule,
      field: string
    ): FieldError | null {
      const stringValue = String(value);
      
      // Min length validation
      if (rule.min !== undefined && stringValue.length < rule.min) {
        return {
          path: field,
          type: 'min',
          message: this.getErrorMessage('min', rule, field),
          value
        };
      }
      
      // Max length validation
      if (rule.max !== undefined && stringValue.length > rule.max) {
        return {
          path: field,
          type: 'max',
          message: this.getErrorMessage('max', rule, field),
          value
        };
      }
      
      // Pattern validation
      if (rule.pattern) {
        const pattern = rule.pattern instanceof RegExp 
          ? rule.pattern 
          : new RegExp(rule.pattern);
          
        if (!pattern.test(stringValue)) {
          return {
            path: field,
            type: 'pattern',
            message: this.getErrorMessage('pattern', rule, field),
            value
          };
        }
      }
      
      return null;
    }
    
    /**
     * Validate number type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Field error or null if valid
     */
    private validateNumber(
      value: any,
      rule: ValidationRule,
      field: string
    ): FieldError | null {
      const numValue = Number(value);
      
      // Check for NaN
      if (isNaN(numValue)) {
        return {
          path: field,
          type: 'type',
          message: this.getErrorMessage('type', rule, field),
          value
        };
      }
      
      // Min value validation
      if (rule.min !== undefined && numValue < rule.min) {
        return {
          path: field,
          type: 'min',
          message: this.getErrorMessage('min', rule, field),
          value
        };
      }
      
      // Max value validation
      if (rule.max !== undefined && numValue > rule.max) {
        return {
          path: field,
          type: 'max',
          message: this.getErrorMessage('max', rule, field),
          value
        };
      }
      
      return null;
    }
    
    /**
     * Validate date type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Field error or null if valid
     */
    private validateDate(
      value: any,
      rule: ValidationRule,
      field: string
    ): FieldError | null {
      let dateValue: Date;
      
      // Convert to Date object if necessary
      if (!(value instanceof Date)) {
        dateValue = new Date(value);
        
        // Check if date is valid
        if (isNaN(dateValue.getTime())) {
          return {
            path: field,
            type: 'type',
            message: this.getErrorMessage('type', rule, field),
            value
          };
        }
      } else {
        dateValue = value;
      }
      
      // Min date validation
      if (rule.min !== undefined) {
        const minDate = rule.min instanceof Date ? rule.min : new Date(rule.min);
        if (dateValue < minDate) {
          return {
            path: field,
            type: 'min',
            message: this.getErrorMessage('min', rule, field),
            value
          };
        }
      }
      
      // Max date validation
      if (rule.max !== undefined) {
        const maxDate = rule.max instanceof Date ? rule.max : new Date(rule.max);
        if (dateValue > maxDate) {
          return {
            path: field,
            type: 'max',
            message: this.getErrorMessage('max', rule, field),
            value
          };
        }
      }
      
      return null;
    }
    
    /**
     * Validate email type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Field error or null if valid
     */
    private validateEmail(
      value: any,
      rule: ValidationRule,
      field: string
    ): FieldError | null {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(String(value))) {
        return {
          path: field,
          type: 'email',
          message: this.getErrorMessage('email', rule, field),
          value
        };
      }
      
      return null;
    }
    
    /**
     * Validate phone type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Field error or null if valid
     */
    private validatePhone(
      value: any,
      rule: ValidationRule,
      field: string
    ): FieldError | null {
      // Basic phone validation, can be enhanced with libraries like libphonenumber
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      
      if (!phoneRegex.test(String(value))) {
        return {
          path: field,
          type: 'phone',
          message: this.getErrorMessage('phone', rule, field),
          value
        };
      }
      
      return null;
    }
    
    /**
     * Validate enum type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Field error or null if valid
     */
    private validateEnum(
      value: any,
      rule: ValidationRule,
      field: string
    ): FieldError | null {
      if (!rule.enum || !Array.isArray(rule.enum) || !rule.enum.includes(value)) {
        return {
          path: field,
          type: 'enum',
          message: this.getErrorMessage('enum', rule, field),
          value
        };
      }
      
      return null;
    }
    
    /**
     * Validate array type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Field error or null if valid
     */
    private async validateArray(
      value: any,
      rule: ValidationRule,
      field: string
    ): Promise<FieldError | null> {
      if (!Array.isArray(value)) {
        return {
          path: field,
          type: 'type',
          message: this.getErrorMessage('type', rule, field),
          value
        };
      }
      
      // Min length validation
      if (rule.min !== undefined && value.length < rule.min) {
        return {
          path: field,
          type: 'min',
          message: this.getErrorMessage('min', rule, field),
          value
        };
      }
      
      // Max length validation
      if (rule.max !== undefined && value.length > rule.max) {
        return {
          path: field,
          type: 'max',
          message: this.getErrorMessage('max', rule, field),
          value
        };
      }
      
      // Validate array items if rule.items is defined
      if (rule.items) {
        for (let i = 0; i < value.length; i++) {
          const itemField = `${field}[${i}]`;
          const error = await this.validateField(value[i], rule.items, itemField);
          
          if (error) {
            return {
              path: error.path,
              type: error.type,
              message: error.message,
              value: error.value
            };
          }
        }
      }
      
      return null;
    }
    
    /**
     * Validate object type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Field error or null if valid
     */
    private async validateObject(
      value: any,
      rule: ValidationRule,
      field: string
    ): Promise<FieldError | null> {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return {
          path: field,
          type: 'type',
          message: this.getErrorMessage('type', rule, field),
          value
        };
      }
      
      // Validate nested schema if provided
      if (rule.schema) {
        for (const [key, nestedRule] of Object.entries(rule.schema)) {
          const nestedField = `${field}.${key}`;
          const error = await this.validateField(value[key], nestedRule, nestedField);
          
          if (error) {
            return {
              path: error.path,
              type: error.type,
              message: error.message,
              value: error.value
            };
          }
        }
      }
      
      return null;
    }
    
    /**
     * Validate custom type field
     * @param value - Field value
     * @param rule - Validation rule
     * @param field - Field name
     * @param data - Complete data object
     * @returns Field error or null if valid
     */
    private async validateCustom(
      value: any,
      rule: ValidationRule,
      field: string,
      data?: any
    ): Promise<FieldError | null> {
      if (typeof rule.validate !== 'function') {
        return null;
      }
      
      try {
        const result = await rule.validate(value, data);
        
        if (result === false) {
          return {
            path: field,
            type: 'custom',
            message: this.getErrorMessage('custom', rule, field),
            value
          };
        } else if (typeof result === 'string' && result) {
          return {
            path: field,
            type: 'custom',
            message: result,
            value
          };
        }
      } catch (error) {
        return {
          path: field,
          type: 'custom',
          message: error instanceof Error ? error.message : String(error),
          value
        };
      }
      
      return null;
    }
    
    /**
     * Validate value against specified type
     * @param value - Value to validate
     * @param type - Type to validate against
     * @returns Whether the value matches the type
     */
    private validateType(value: any, type: string): boolean {
      switch (type) {
        case 'string':
          return typeof value === 'string' || value instanceof String || (value !== null && typeof value !== 'undefined');
          
        case 'number':
          return typeof value === 'number' || !isNaN(Number(value));
          
        case 'boolean':
          return typeof value === 'boolean' || value === 'true' || value === 'false' || value === 1 || value === 0;
          
        case 'date':
          return value instanceof Date || (!isNaN(Date.parse(value)));
          
        case 'object':
          return typeof value === 'object' && value !== null && !Array.isArray(value);
          
        case 'array':
          return Array.isArray(value);
          
        // For other types, basic existence check
        default:
          return value !== undefined && value !== null;
      }
    }
    
    /**
     * Get error message for a validation failure
     * @param type - Error type
     * @param rule - Validation rule
     * @param field - Field name
     * @returns Error message
     */
    private getErrorMessage(type: string, rule: ValidationRule, field: string): string {
      // First check type-specific message in messages object
      if (rule.messages && rule.messages[type]) {
        return rule.messages[type]!;
      }
      
      // Check global message
      if (rule.message) {
        return rule.message;
      }
      
      // Default messages
      switch (type) {
        case 'required':
          return `${field} is required`;
          
        case 'type':
          return `${field} must be a valid ${rule.type}`;
          
        case 'min':
          return rule.type === 'string' 
            ? `${field} must be at least ${rule.min} characters long` 
            : `${field} must be at least ${rule.min}`;
            
        case 'max':
          return rule.type === 'string' 
            ? `${field} must be at most ${rule.max} characters long` 
            : `${field} must be at most ${rule.max}`;
            
        case 'pattern':
          return `${field} has an invalid format`;
          
        case 'email':
          return `${field} must be a valid email address`;
          
        case 'phone':
          return `${field} must be a valid phone number`;
          
        case 'enum':
          return `${field} must be one of: ${rule.enum?.join(', ')}`;
          
        case 'custom':
          return `${field} is invalid`;
          
        default:
          return `${field} validation failed`;
      }
    }
  }
  
  // Create singleton instance
  const validator = new Validator();
  
  export default validator;