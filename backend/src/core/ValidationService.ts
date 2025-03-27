import { 
    IValidationService, 
    ValidationSchema, 
    ValidationRule, 
    ValidationOptions,
    ValidationResult,
    ValidatorFunction
  } from '../interfaces/IValidationService.js';
  import { ILoggingService } from '../interfaces/ILoggingService.js';
  
  /**
   * ValidationService
   * 
   * Implementation of IValidationService that provides data validation functionality.
   * Validates data against schemas and rules using built-in and custom validators.
   */
  export class ValidationService implements IValidationService {
    // Map of custom validation types
    private customTypes: Map<string, ValidatorFunction> = new Map();
    
    // Map of custom validation rules
    private customRules: Map<string, ValidatorFunction> = new Map();
  
    /**
     * Creates a new ValidationService instance
     * 
     * @param logger - Logging service
     */
    constructor(private readonly logger: ILoggingService) {
      // Register built-in types
      this.registerBuiltInTypes();
      
      // Register built-in rules
      this.registerBuiltInRules();
    }
  
    /**
     * Validate data against a schema
     * 
     * @param data - Data to validate
     * @param schema - Validation schema
     * @param options - Validation options
     * @returns Validation result
     */
    public validate<T>(
      data: any, 
      schema: ValidationSchema, 
      options: ValidationOptions = {}
    ): ValidationResult<T> {
      const errors: string[] = [];
      const validatedData: any = {};
      
      const { throwOnError = false, abortEarly = false, stripUnknown = false, convert = true } = options;
      
      try {
        // Process each field in the schema
        for (const [field, rule] of Object.entries(schema)) {
          if (errors.length > 0 && abortEarly) {
            break;
          }
          
          // Get field value from data
          let value = data[field];
          const fieldErrors: string[] = [];
          
          // Apply default value if field is undefined and default is specified
          if ((value === undefined || value === null || value === '') && rule.default !== undefined) {
            value = rule.default;
          }
          
          // Required field validation
          if (rule.required && (value === undefined || value === null || value === '')) {
            const errorMsg = rule.messages?.required || `${field} is required`;
            fieldErrors.push(errorMsg);
          }
          
          // Skip further validation if field is not required and empty
          if ((value === undefined || value === null || value === '') && !rule.required) {
            validatedData[field] = rule.default !== undefined ? rule.default : null;
            continue;
          }
          
          // Apply transformations if provided
          if (value !== undefined && value !== null && rule.transform && Array.isArray(rule.transform)) {
            for (const transformFn of rule.transform) {
              if (typeof transformFn === 'function') {
                value = transformFn(value);
              }
            }
          }
          
          // Validate value if it exists
          if (value !== undefined && value !== null && value !== '') {
            // Type-specific validation
            const typeError = this.validateType(value, rule.type, rule, convert);
            if (typeError) {
              fieldErrors.push(typeError);
            } else {
              // Apply rule-specific validations if type validation passed
              this.applyRuleValidations(value, rule, field, fieldErrors);
              
              // Apply custom validation function if provided
              if (rule.validate && typeof rule.validate === 'function') {
                try {
                  const validateResult = rule.validate(value, data);
                  if (validateResult === false || typeof validateResult === 'string') {
                    fieldErrors.push(
                      typeof validateResult === 'string' 
                        ? validateResult 
                        : (rule.message || `Invalid ${field}`)
                    );
                  }
                } catch (error) {
                  fieldErrors.push(`Validation function error: ${(error as Error).message}`);
                }
              }
            }
          }
          
          // Add field errors to the global errors list
          if (fieldErrors.length > 0) {
            errors.push(...fieldErrors.map(err => `${field}: ${err}`));
          } else {
            // Add valid value to the resulting object
            validatedData[field] = value;
          }
        }
        
        // Add non-schema fields if not stripping unknown
        if (!stripUnknown && data) {
          for (const field in data) {
            if (!schema[field] && data[field] !== undefined) {
              validatedData[field] = data[field];
            }
          }
        }
        
        const isValid = errors.length === 0;
        
        // Throw error if validation failed and throwOnError is true
        if (!isValid && throwOnError) {
          const error = new Error('Validation failed');
          (error as any).errors = errors;
          throw error;
        }
        
        return {
          isValid,
          errors,
          validatedData: validatedData as T
        };
      } catch (error) {
        this.logger.error('Validation error', error instanceof Error ? error : String(error));
        
        // If error is from our own validation, rethrow it
        if ((error as any).errors) {
          throw error;
        }
        
        // For other errors, return validation failure
        return {
          isValid: false,
          errors: [(error as Error).message],
          validatedData: {} as T
        };
      }
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
    public validateField(
      value: any, 
      rule: ValidationRule, 
      field: string, 
      options: ValidationOptions = {}
    ): ValidationResult<any> {
      const errors: string[] = [];
      let validatedValue = value;
      
      const { convert = true } = options;
      
      try {
        // Apply transformations if provided
        if (value !== undefined && value !== null && rule.transform && Array.isArray(rule.transform)) {
          for (const transformFn of rule.transform) {
            if (typeof transformFn === 'function') {
              validatedValue = transformFn(validatedValue);
            }
          }
        }
        
        // Required validation
        if (rule.required && (validatedValue === undefined || validatedValue === null || validatedValue === '')) {
          const errorMsg = rule.messages?.required || `${field} is required`;
          errors.push(errorMsg);
        }
        
        // Skip further validation if field is not required and empty
        if ((validatedValue === undefined || validatedValue === null || validatedValue === '') && !rule.required) {
          validatedValue = rule.default !== undefined ? rule.default : null;
        } else if (validatedValue !== undefined && validatedValue !== null && validatedValue !== '') {
          // Type-specific validation
          const typeError = this.validateType(validatedValue, rule.type, rule, convert);
          if (typeError) {
            errors.push(typeError);
          } else {
            // Apply rule-specific validations if type validation passed
            this.applyRuleValidations(validatedValue, rule, field, errors);
            
            // Apply custom validation function if provided
            if (rule.validate && typeof rule.validate === 'function') {
              try {
                const validateResult = rule.validate(validatedValue);
                if (validateResult === false || typeof validateResult === 'string') {
                  errors.push(
                    typeof validateResult === 'string' 
                      ? validateResult 
                      : (rule.message || `Invalid ${field}`)
                  );
                }
              } catch (error) {
                errors.push(`Validation function error: ${(error as Error).message}`);
              }
            }
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          validatedData: validatedValue
        };
      } catch (error) {
        this.logger.error('Field validation error', error instanceof Error ? error : String(error));
        
        return {
          isValid: false,
          errors: [(error as Error).message],
          validatedData: value
        };
      }
    }
  
    /**
     * Register a custom validation type
     * 
     * @param type - Type name
     * @param validator - Validator function
     */
    public registerType(type: string, validator: ValidatorFunction): void {
      this.customTypes.set(type, validator);
      this.logger.debug(`Registered custom validation type: ${type}`);
    }
  
    /**
     * Register a custom validation rule
     * 
     * @param name - Rule name
     * @param validator - Validator function
     */
    public registerRule(name: string, validator: ValidatorFunction): void {
      this.customRules.set(name, validator);
      this.logger.debug(`Registered custom validation rule: ${name}`);
    }
  
    /**
     * Create a validation schema from a class or object
     * 
     * @param target - Class constructor or object
     * @returns Validation schema
     */
    public createSchema(target: any): ValidationSchema {
      // Simple implementation that extracts properties and infers types
      const schema: ValidationSchema = {};
      
      // If target is a class constructor, create an instance
      const instance = typeof target === 'function' ? new target() : target;
      
      // Extract properties and infer types
      for (const key in instance) {
        const value = instance[key];
        const valueType = typeof value;
        
        // Skip functions and symbols
        if (valueType === 'function' || valueType === 'symbol') {
          continue;
        }
        
        // Create rule based on value type
        const rule: ValidationRule = {
          type: this.inferTypeFromValue(value)
        };
        
        // Add rule to schema
        schema[key] = rule;
      }
      
      return schema;
    }
  
    /**
     * Sanitize data against a schema
     * 
     * @param data - Data to sanitize
     * @param schema - Validation schema
     * @returns Sanitized data
     */
    public sanitize<T>(data: any, schema: ValidationSchema): T {
      const result: any = {};
      
      // Only include fields defined in the schema
      for (const key in schema) {
        if (data && data[key] !== undefined) {
          result[key] = data[key];
        }
      }
      
      return result as T;
    }
  
    /**
     * Register built-in validation types
     */
    private registerBuiltInTypes(): void {
      // Register string type validator
      this.registerType('string', (value: any): boolean => {
        return typeof value === 'string';
      });
      
      // Register number type validator
      this.registerType('number', (value: any): boolean => {
        return typeof value === 'number' && !isNaN(value);
      });
      
      // Register boolean type validator
      this.registerType('boolean', (value: any): boolean => {
        return typeof value === 'boolean';
      });
      
      // Register date type validator
      this.registerType('date', (value: any): boolean => {
        return value instanceof Date && !isNaN(value.getTime());
      });
      
      // Register email type validator
      this.registerType('email', (value: any): boolean => {
        if (typeof value !== 'string') return false;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(value);
      });
      
      // Register array type validator
      this.registerType('array', (value: any): boolean => {
        return Array.isArray(value);
      });
      
      // Register object type validator
      this.registerType('object', (value: any): boolean => {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      });
      
      // Register enum type validator
      this.registerType('enum', (value: any, options?: any): boolean => {
        const enumValues = options?.enum || [];
        return enumValues.includes(value);
      });
    }
  
    /**
     * Register built-in validation rules
     */
    private registerBuiltInRules(): void {
      // Register min rule (min value for numbers, min length for strings/arrays)
      this.registerRule('min', (value: any, options?: any): boolean => {
        const min = options?.min;
        if (min === undefined) return true;
        
        if (typeof value === 'number') {
          return value >= min;
        }
        
        if (typeof value === 'string' || Array.isArray(value)) {
          return value.length >= min;
        }
        
        return true;
      });
      
      // Register max rule (max value for numbers, max length for strings/arrays)
      this.registerRule('max', (value: any, options?: any): boolean => {
        const max = options?.max;
        if (max === undefined) return true;
        
        if (typeof value === 'number') {
          return value <= max;
        }
        
        if (typeof value === 'string' || Array.isArray(value)) {
          return value.length <= max;
        }
        
        return true;
      });
      
      // Register pattern rule (regexp for strings)
      this.registerRule('pattern', (value: any, options?: any): boolean => {
        const pattern = options?.pattern;
        if (!pattern || typeof value !== 'string') return true;
        
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        return regex.test(value);
      });
      
      // Register integer rule
      this.registerRule('integer', (value: any): boolean => {
        if (typeof value !== 'number') return true;
        return Number.isInteger(value);
      });
    }
  
    /**
     * Validate a value against a type
     * 
     * @param value - Value to validate
     * @param type - Type to validate against
     * @param rule - Full validation rule
     * @param convert - Whether to convert types
     * @returns Error message or undefined if valid
     */
    private validateType(value: any, type: string, rule: ValidationRule, convert: boolean): string  {
      // Try to convert value if needed
      if (convert) {
        value = this.convertValueToType(value, type);
      }
      
      // Check custom type validators first
      if (this.customTypes.has(type)) {
        const validator = this.customTypes.get(type)!;
        if (!validator(value, rule)) {
          return rule.messages?.type || `Value must be a valid ${type}`;
        }
        return '';
      }
      
      // Built-in type checking
      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            return rule.messages?.type || 'Value must be a string';
          }
          break;
          
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            return rule.messages?.type || 'Value must be a number';
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            return rule.messages?.type || 'Value must be a boolean';
          }
          break;
          
        case 'date':
          if (!(value instanceof Date) || isNaN(value.getTime())) {
            return rule.messages?.type || 'Value must be a valid date';
          }
          break;
          
        case 'email':
          if (typeof value !== 'string') {
            return rule.messages?.type || 'Email must be a string';
          }
          
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(value)) {
            return rule.messages?.type || 'Invalid email format';
          }
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            return rule.messages?.type || 'Value must be an array';
          }
          break;
          
        case 'object':
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return rule.messages?.type || 'Value must be an object';
          }
          break;
          
        case 'enum':
          const enumValues = rule.enum || [];
          if (!enumValues.includes(value)) {
            return rule.messages?.enum || `Value must be one of: ${enumValues.join(', ')}`;
          }
          break;
          
        default:
          // If type is unknown, consider it valid
          this.logger.warn(`Unknown validation type: ${type}`);
          break;
      }
      
      return '';
    }
  
    /**
     * Apply rule-specific validations
     * 
     * @param value - Value to validate
     * @param rule - Validation rule
     * @param field - Field name
     * @param errors - Array to collect errors
     */
    private applyRuleValidations(value: any, rule: ValidationRule, field: string, errors: string[]): void {
      // Apply min/max validations for strings, arrays, numbers
      if (rule.min !== undefined) {
        if (
          (typeof value === 'number' && value < rule.min) ||
          ((typeof value === 'string' || Array.isArray(value)) && value.length < rule.min)
        ) {
          errors.push(rule.messages?.min || `Minimum ${typeof value === 'number' ? 'value' : 'length'} for ${field} is ${rule.min}`);
        }
      }
      
      if (rule.max !== undefined) {
        if (
          (typeof value === 'number' && value > rule.max) ||
          ((typeof value === 'string' || Array.isArray(value)) && value.length > rule.max)
        ) {
          errors.push(rule.messages?.max || `Maximum ${typeof value === 'number' ? 'value' : 'length'} for ${field} is ${rule.max}`);
        }
      }
      
      // Apply pattern validation for strings
      if (rule.pattern && typeof value === 'string') {
        const pattern = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
        if (!pattern.test(value)) {
          errors.push(rule.messages?.pattern || `${field} does not match the required pattern`);
        }
      }
      
      // Apply integer validation for numbers
      if (rule.integer === true && typeof value === 'number' && !Number.isInteger(value)) {
        errors.push(rule.messages?.integer || `${field} must be an integer`);
      }
      
      // Check custom rules
      for (const [ruleName, validator] of this.customRules.entries()) {
        // Only apply rule if it exists in the rule object
        if (rule[ruleName] !== undefined) {
          if (!validator(value, rule)) {
            errors.push(rule.messages?.[ruleName] || `${field} failed validation rule: ${ruleName}`);
          }
        }
      }
    }
  
    /**
     * Convert value to the specified type if possible
     * 
     * @param value - Value to convert
     * @param type - Target type
     * @returns Converted value
     */
    private convertValueToType(value: any, type: string): any {
      if (value === undefined || value === null) {
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
            return isNaN(num) ? value : num;
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            if (value === 'true') return true;
            if (value === 'false') return false;
          }
          break;
          
        case 'date':
          if (!(value instanceof Date)) {
            try {
              return new Date(value);
            } catch {
              // If conversion fails, return original value
              return value;
            }
          }
          break;
      }
      
      return value;
    }
  
    /**
     * Infer type from a value
     * 
     * @param value - Value to infer type from
     * @returns Inferred type name
     */
    private inferTypeFromValue(value: any): string {
      if (value === null || value === undefined) {
        return 'string'; // Default to string for null/undefined
      }
      
      if (value instanceof Date) {
        return 'date';
      }
      
      if (Array.isArray(value)) {
        return 'array';
      }
      
      if (typeof value === 'object') {
        return 'object';
      }
      
      return typeof value;
    }
  }