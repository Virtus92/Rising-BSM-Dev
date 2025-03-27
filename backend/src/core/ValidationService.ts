/**
 * ValidationService
 * 
 * Implementation of IValidationService.
 * Provides validation functionality for DTOs and other data structures.
 */
import { 
    IValidationService, 
    ValidationSchema, 
    ValidationRule, 
    ValidationResult, 
    ValidationOptions,
    ValidatorFunction
  } from '../interfaces/IValidationService.js';
  import { ILoggingService } from '../interfaces/ILoggingService.js';
  
  export class ValidationService implements IValidationService {
    // Built-in validators
    private validators: Record<string, ValidatorFunction> = {
      // Basic type validators
      string: (value) => typeof value === 'string' || 'Value must be a string',
      number: (value) => typeof value === 'number' || 'Value must be a number',
      boolean: (value) => typeof value === 'boolean' || 'Value must be a boolean',
      object: (value) => typeof value === 'object' && value !== null || 'Value must be an object',
      array: (value) => Array.isArray(value) || 'Value must be an array',
      enum: (value, options) => {
        if (!options.enum) return 'Enum values not provided';
        return options.enum.includes(value) || `Value must be one of: ${options.enum.join(', ')}`;
      },
      
      // String validators
      email: (value) => {
        if (typeof value !== 'string') return 'Email must be a string';
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) || 'Invalid email format';
      },
      url: (value) => {
        if (typeof value !== 'string') return 'URL must be a string';
        try {
          new URL(value);
          return true;
        } catch {
          return 'Invalid URL format';
        }
      },
      uuid: (value) => {
        if (typeof value !== 'string') return 'UUID must be a string';
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value) || 'Invalid UUID format';
      },
      
      // Number validators
      integer: (value) => {
        if (typeof value !== 'number') return 'Value must be a number';
        return Number.isInteger(value) || 'Value must be an integer';
      },
      positive: (value) => {
        if (typeof value !== 'number') return 'Value must be a number';
        return value > 0 || 'Value must be positive';
      },
      negative: (value) => {
        if (typeof value !== 'number') return 'Value must be a number';
        return value < 0 || 'Value must be negative';
      },
      
      // Date validator
      date: (value) => {
        if (value instanceof Date) return true;
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value);
          return !isNaN(date.getTime()) || 'Invalid date format';
        }
        return 'Value must be a date or a valid date string';
      }
    };
    
    // Custom validation rules
    private customRules: Record<string, ValidatorFunction> = {};
  
    /**
     * Creates a new ValidationService instance
     * 
     * @param logger - Logging service
     */
    constructor(private readonly logger: ILoggingService) {
      this.logger.debug('Initialized ValidationService');
    }
  
    /**
     * Validate data against a schema
     * 
     * @param data - Data to validate
     * @param schema - Validation schema
     * @param options - Validation options
     * @returns Validation result
     */
    validate<T>(data: any, schema: ValidationSchema, options?: ValidationOptions): ValidationResult<T> {
      // Default options
      const opts = {
        throwOnError: false,
        abortEarly: false,
        stripUnknown: true,
        convert: true,
        ...options
      };
      
      // Initialize validation result
      const result: ValidationResult<T> = {
        isValid: true,
        errors: [],
        validatedData: {} as T
      };
      
      // Handle null or undefined data
      if (data === null || data === undefined) {
        result.isValid = false;
        result.errors.push('Data is null or undefined');
        
        if (opts.throwOnError) {
          throw new Error('Validation failed: Data is null or undefined');
        }
        
        return result;
      }
      
      // Validate each field according to schema
      for (const [field, rule] of Object.entries(schema)) {
        try {
          // Skip fields not present in data unless required
          if (!(field in data)) {
            if (rule.required) {
              result.isValid = false;
              const errorMessage = this.getErrorMessage(rule, 'required', `${field} is required`);
              result.errors.push(errorMessage);
              
              if (opts.abortEarly) break;
            } else if (rule.default !== undefined) {
              // Use default value if field is missing
              (result.validatedData as any)[field] = rule.default;
            }
            continue;
          }
          
          // Get field value
          let value = data[field];
          
          // Apply transforms if any
          if (rule.transform && Array.isArray(rule.transform)) {
            for (const transform of rule.transform) {
              value = transform(value);
            }
          }
          
          // Check if field is required but null or undefined
          if ((value === null || value === undefined) && rule.required) {
            result.isValid = false;
            const errorMessage = this.getErrorMessage(rule, 'required', `${field} is required`);
            result.errors.push(errorMessage);
            
            if (opts.abortEarly) break;
            continue;
          }
          
          // Skip further validation if field is null or undefined and not required
          if (value === null || value === undefined) {
            if (rule.default !== undefined) {
              (result.validatedData as any)[field] = rule.default;
            } else {
              (result.validatedData as any)[field] = value;
            }
            continue;
          }
          
          // Type conversion if enabled
          if (opts.convert) {
            value = this.convertValue(value, rule.type);
          }
          
          // Validate type
          const typeValidation = this.validateType(value, rule);
          
          if (typeValidation !== true) {
            result.isValid = false;
            const errorMessage = this.getErrorMessage(rule, 'type', typeValidation);
            result.errors.push(errorMessage);
            
            if (opts.abortEarly) break;
            continue;
          }
          
          // Validate additional constraints
          const constraintErrors = this.validateConstraints(value, rule);
          
          if (constraintErrors.length > 0) {
            result.isValid = false;
            result.errors.push(...constraintErrors.map(err => `${field}: ${err}`));
            
            if (opts.abortEarly) break;
            continue;
          }
          
          // Validate with custom validator if provided
          if (rule.validate) {
            const validateResult = rule.validate(value, data);
            
            if (validateResult !== true) {
              result.isValid = false;
              const errorMessage = typeof validateResult === 'string' 
                ? `${field}: ${validateResult}` 
                : `${field}: Invalid value`;
              result.errors.push(errorMessage);
              
              if (opts.abortEarly) break;
              continue;
            }
          }
          
          // Validation passed, add to validated data
          (result.validatedData as any)[field] = value;
        } catch (error) {
          result.isValid = false;
          result.errors.push(`${field}: ${error instanceof Error ? error.message : String(error)}`);
          
          if (opts.abortEarly) break;
        }
      }
      
      // If stripUnknown is false, add unknown fields to validatedData
      if (!opts.stripUnknown && typeof data === 'object' && data !== null) {
        for (const field in data) {
          if (!(field in schema) && data[field] !== undefined) {
            (result.validatedData as any)[field] = data[field];
          }
        }
      }
      
      // Throw error if requested and validation failed
      if (!result.isValid && opts.throwOnError) {
        throw new Error(`Validation failed: ${result.errors.join(', ')}`);
      }
      
      return result;
    }
  
    /**
     * Validate a specific field
     * 
     * @param value - Value to validate
     * @param rule - Validation rule
     * @param field - Field name
     * @param options - Validation options
     * @returns Validation result
     */
    validateField(value: any, rule: ValidationRule, field: string, options?: ValidationOptions): ValidationResult<any> {
      // Create a schema with just this field
      const schema: ValidationSchema = {
        [field]: rule
      };
      
      // Validate the field using the schema
      return this.validate({ [field]: value }, schema, options);
    }
  
    /**
     * Register a custom validation type
     * 
     * @param type - Type name
     * @param validator - Validator function
     */
    registerType(type: string, validator: ValidatorFunction): void {
      if (this.validators[type]) {
        this.logger.warn(`Overriding existing validator for type: ${type}`);
      }
      
      this.validators[type] = validator;
      this.logger.debug(`Registered validator for type: ${type}`);
    }
  
    /**
     * Register a custom validation rule
     * 
     * @param name - Rule name
     * @param validator - Validator function
     */
    registerRule(name: string, validator: ValidatorFunction): void {
      if (this.customRules[name]) {
        this.logger.warn(`Overriding existing custom rule: ${name}`);
      }
      
      this.customRules[name] = validator;
      this.logger.debug(`Registered custom rule: ${name}`);
    }
  
    /**
     * Create a validation schema from a class/interface
     * 
     * @param target - Class constructor or object with shape of interface
     * @returns Validation schema
     */
    createSchema(target: any): ValidationSchema {
      // If target is a constructor, create an instance
      const instance = typeof target === 'function' ? new target() : target;
      const schema: ValidationSchema = {};
      
      // Extract properties and their types
      for (const key in instance) {
        const value = instance[key];
        let rule: ValidationRule;
        
        if (value === undefined) {
          // Property exists but no value to infer type
          rule = { type: 'any', required: false };
        } else {
          // Infer type from value
          const type = this.inferType(value);
          rule = { type, required: false };
          
          // Add constraints based on value type
          if (type === 'string' && typeof value === 'string') {
            rule.min = 0;
            rule.max = value.length > 0 ? value.length : undefined;
          } else if (type === 'number' && typeof value === 'number') {
            rule.min = value;
            rule.max = value;
          } else if (type === 'array' && Array.isArray(value)) {
            rule.min = 0;
            rule.max = value.length > 0 ? value.length : undefined;
            
            // Infer item type if array is not empty
            if (value.length > 0) {
              rule.items = { type: this.inferType(value[0]) };
            }
          }
        }
        
        schema[key] = rule;
      }
      
      return schema;
    }
  
    /**
     * Sanitize data against a schema (strip unknown properties)
     * 
     * @param data - Data to sanitize
     * @param schema - Schema to sanitize against
     * @returns Sanitized data
     */
    sanitize<T>(data: any, schema: ValidationSchema): T {
      if (typeof data !== 'object' || data === null) {
        return data as T;
      }
      
      const sanitized: any = {};
      
      for (const key in schema) {
        if (key in data) {
          sanitized[key] = data[key];
        }
      }
      
      return sanitized as T;
    }
  
    /**
     * Infer type from a value
     * 
     * @param value - Value to infer type from
     * @returns Inferred type
     */
    private inferType(value: any): string {
      if (value === null || value === undefined) return 'any';
      if (typeof value === 'string') return 'string';
      if (typeof value === 'number') return 'number';
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'object') {
        if (Array.isArray(value)) return 'array';
        if (value instanceof Date) return 'date';
        return 'object';
      }
      return 'any';
    }
  
    /**
     * Validate value against type
     * 
     * @param value - Value to validate
     * @param rule - Validation rule
     * @returns Validation result
     */
    private validateType(value: any, rule: ValidationRule): true | string {
      const type = rule.type;
      
      // Skip type validation for 'any' type
      if (type === 'any') return true;
      
      // Get validator for type
      const validator = this.validators[type];
      
      if (!validator) {
        this.logger.warn(`No validator found for type: ${type}`);
        return true; // Skip validation for unknown types
      }
      
      // Run validator
      const result = validator(value, rule);
      
      return result === true ? true : (typeof result === 'string' ? result : `Value must be of type ${type}`);
    }
  
    /**
     * Validate value against constraints
     * 
     * @param value - Value to validate
     * @param rule - Validation rule
     * @returns Array of constraint errors
     */
    private validateConstraints(value: any, rule: ValidationRule): string[] {
      const errors: string[] = [];
      
      // Validate string constraints
      if (typeof value === 'string' && (rule.type === 'string' || rule.type === 'email' || rule.type === 'url')) {
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push(this.getErrorMessage(rule, 'min', `Value must be at least ${rule.min} characters`));
        }
        
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push(this.getErrorMessage(rule, 'max', `Value cannot exceed ${rule.max} characters`));
        }
        
        if (rule.pattern) {
          const pattern = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
          if (!pattern.test(value)) {
            errors.push(this.getErrorMessage(rule, 'pattern', 'Value does not match required pattern'));
          }
        }
      }
      
      // Validate number constraints
      if (typeof value === 'number' && rule.type === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(this.getErrorMessage(rule, 'min', `Value must be at least ${rule.min}`));
        }
        
        if (rule.max !== undefined && value > rule.max) {
          errors.push(this.getErrorMessage(rule, 'max', `Value cannot exceed ${rule.max}`));
        }
      }
      
      // Validate array constraints
      if (Array.isArray(value) && rule.type === 'array') {
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push(this.getErrorMessage(rule, 'min', `Array must contain at least ${rule.min} items`));
        }
        
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push(this.getErrorMessage(rule, 'max', `Array cannot exceed ${rule.max} items`));
        }
        
        // Validate array items if item rule is provided
        if (rule.items && value.length > 0) {
          for (let i = 0; i < value.length; i++) {
            const itemResult = this.validateType(value[i], rule.items);
            if (itemResult !== true) {
              errors.push(`Item at index ${i}: ${itemResult}`);
            }
            
            const itemConstraintErrors = this.validateConstraints(value[i], rule.items);
            if (itemConstraintErrors.length > 0) {
              errors.push(...itemConstraintErrors.map(err => `Item at index ${i}: ${err}`));
            }
          }
        }
      }
      
      // Validate object constraints
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && rule.type === 'object' && rule.schema) {
        const nestedResult = this.validate(value, rule.schema);
        if (!nestedResult.isValid) {
          errors.push(...nestedResult.errors);
        }
      }
      
      // Validate custom rules
      for (const [ruleName, validator] of Object.entries(this.customRules)) {
        if (ruleName in rule && ruleName !== 'type' && ruleName !== 'required') {
          const ruleValue = (rule as any)[ruleName];
          const validationResult = validator(value, { ...rule, [ruleName]: ruleValue });
          
          if (validationResult !== true) {
            errors.push(typeof validationResult === 'string' ? validationResult : `Failed ${ruleName} validation`);
          }
        }
      }
      
      return errors;
    }
  
    /**
     * Get error message for a validation error
     * 
     * @param rule - Validation rule
     * @param errorType - Type of error
     * @param defaultMessage - Default error message
     * @returns Error message
     */
    private getErrorMessage(rule: ValidationRule, errorType: string, defaultMessage: string): string {
      // Check for message in rule.messages
      if (rule.messages && errorType in rule.messages) {
        return rule.messages[errorType] as string;
      }
      
      // Check for generic message
      if (rule.message) {
        return rule.message;
      }
      
      return defaultMessage;
    }
  
    /**
     * Convert value to specified type
     * 
     * @param value - Value to convert
     * @param type - Target type
     * @returns Converted value
     */
    private convertValue(value: any, type: string): any {
      if (value === null || value === undefined) {
        return value;
      }
      
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            return String(value);
          }
          break;
          
        case 'number':
          if (typeof value !== 'number') {
            const num = Number(value);
            if (!isNaN(num)) {
              return num;
            }
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            if (value === 'true' || value === '1' || value === 1) {
              return true;
            } else if (value === 'false' || value === '0' || value === 0) {
              return false;
            }
          }
          break;
          
        case 'date':
          if (!(value instanceof Date)) {
            try {
              return new Date(value);
            } catch {
              // Failed to convert to date
            }
          }
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                  return parsed;
                }
              } catch {
                // Failed to parse JSON
              }
            }
          }
          break;
      }
      
      return value;
    }
  }
  
  export default ValidationService;