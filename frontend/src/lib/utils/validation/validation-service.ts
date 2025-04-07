import { IValidationService, ValidationOptions, ValidationResult } from '@/types/interfaces/IValidationService';
import { IErrorHandler } from '@/types/interfaces/IErrorHandler';
import { ILoggingService } from '@/types/interfaces/ILoggingService';

/**
 * Validation Service implementation
 * Provides validation capabilities for services
 */
export class ValidationService implements IValidationService {
  /**
   * Creates a new ValidationService instance
   * 
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {}

  /**
   * Validate data against schema
   * 
   * @param data - Data to validate
   * @param schema - Validation schema
   * @param options - Validation options
   * @returns Validation result
   */
  validate(data: any, schema: any, options?: ValidationOptions): ValidationResult {
    try {
      // If schema is falsy, return success
      if (!schema) {
        this.logger.debug('No schema provided for validation, skipping');
        return { isValid: true, errors: [] };
      }
      
      // Prepare default options
      const opts = {
        allowUnknown: true,
        stripUnknown: false,
        abortEarly: false,
        ...(options || {})
      };
      
      // Apply schema validation based on type
      if (typeof schema === 'function') {
        // Schema is a validation function
        return this.validateWithFunction(data, schema, opts);
      } else if (schema.validate) {
        // Schema is a Joi or similar schema
        return this.validateWithJoi(data, schema, opts);
      } else if (typeof schema === 'object') {
        // Schema is a validation object
        return this.validateWithObject(data, schema, opts);
      }
      
      // Unknown schema type
      this.logger.warn('Unknown schema type for validation', { schemaType: typeof schema });
      
      // Throw error or return invalid result
      if (opts.throwOnError) {
        throw this.errorHandler.createValidationError('Invalid schema type');
      }
      
      return { isValid: false, errors: ['Invalid schema type'] };
    } catch (error) {
      // Log validation error
      this.logger.error('Validation error', error instanceof Error ? error : String(error));
      
      // Prepare error info
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errors = ['validation_error' in error ? error.validation_error : errorMessage];
      
      // Throw or return error
      if (options?.throwOnError) {
        throw this.errorHandler.createValidationError('Validation failed', errors);
      }
      
      return { isValid: false, errors };
    }
  }

  /**
   * Validate data against schema and throw error on failure
   * 
   * @param data - Data to validate
   * @param schema - Validation schema
   * @returns Validation result
   */
  validateOrThrow(data: any, schema: any): ValidationResult {
    return this.validate(data, schema, { throwOnError: true });
  }

  /**
   * Validate with a function
   * 
   * @param data - Data to validate
   * @param validator - Validation function
   * @param options - Validation options
   * @returns Validation result
   */
  private validateWithFunction(data: any, validator: Function, options: ValidationOptions): ValidationResult {
    try {
      // Execute validation function
      const result = validator(data);
      
      // If result is boolean
      if (typeof result === 'boolean') {
        return { 
          isValid: result, 
          errors: result ? [] : ['Validation failed'] 
        };
      }
      
      // If result has isValid property
      if (result && typeof result === 'object' && 'isValid' in result) {
        return {
          isValid: !!result.isValid,
          errors: Array.isArray(result.errors) ? result.errors : [],
          value: result.value
        };
      }
      
      // Default to true
      return { isValid: true, errors: [] };
    } catch (error) {
      if (options.throwOnError) {
        throw error;
      }
      
      return { 
        isValid: false, 
        errors: [error instanceof Error ? error.message : String(error)] 
      };
    }
  }

  /**
   * Validate with a Joi schema
   * 
   * @param data - Data to validate
   * @param schema - Joi schema
   * @param options - Validation options
   * @returns Validation result
   */
  private validateWithJoi(data: any, schema: any, options: ValidationOptions): ValidationResult {
    try {
      // Prepare Joi options
      const joiOptions = {
        allowUnknown: options.allowUnknown,
        stripUnknown: options.stripUnknown,
        abortEarly: options.abortEarly
      };
      
      // Execute Joi validation
      const result = schema.validate(data, joiOptions);
      
      // Check for errors
      if (result.error) {
        const errors = result.error.details.map(detail => detail.message);
        
        if (options.throwOnError) {
          throw this.errorHandler.createValidationError('Validation failed', errors);
        }
        
        return { isValid: false, errors };
      }
      
      // Validation passed
      return { isValid: true, errors: [], value: result.value };
    } catch (error) {
      if (error.name === 'ValidationError' && options.throwOnError) {
        throw error;
      }
      
      if (options.throwOnError) {
        throw this.errorHandler.createValidationError(
          'Validation failed',
          [error instanceof Error ? error.message : String(error)]
        );
      }
      
      return { 
        isValid: false, 
        errors: [error instanceof Error ? error.message : String(error)] 
      };
    }
  }

  /**
   * Validate with an object schema
   * 
   * @param data - Data to validate
   * @param schema - Validation object
   * @param options - Validation options
   * @returns Validation result
   */
  private validateWithObject(data: any, schema: Record<string, any>, options: ValidationOptions): ValidationResult {
    // Collect validation errors
    const errors: string[] = [];
    
    // Validate each field
    for (const field in schema) {
      if (schema.hasOwnProperty(field)) {
        const fieldSchema = schema[field];
        const value = data?.[field];
        const fieldErrors = this.validateField(field, value, fieldSchema);
        
        // Add field errors to collection
        errors.push(...fieldErrors);
        
        // Abort early if needed
        if (options.abortEarly && errors.length > 0) {
          break;
        }
      }
    }
    
    // Check validation result
    if (errors.length > 0) {
      if (options.throwOnError) {
        throw this.errorHandler.createValidationError('Validation failed', errors);
      }
      
      return { isValid: false, errors };
    }
    
    // Validation passed
    return { isValid: true, errors: [] };
  }

  /**
   * Validate a single field
   * 
   * @param field - Field name
   * @param value - Field value
   * @param fieldSchema - Field validation schema
   * @returns Validation errors
   */
  private validateField(field: string, value: any, fieldSchema: any): string[] {
    const errors: string[] = [];
    
    // Required validation
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors.push(fieldSchema.messages?.required || `${field} is required`);
      return errors;
    }
    
    // If value is undefined/null and not required, skip further validation
    if (value === undefined || value === null) {
      return errors;
    }
    
    // Type validation
    if (fieldSchema.type) {
      // Check type
      switch (fieldSchema.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(fieldSchema.messages?.type || `${field} must be a string`);
          }
          break;
          
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(fieldSchema.messages?.type || `${field} must be a number`);
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(fieldSchema.messages?.type || `${field} must be a boolean`);
          }
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(fieldSchema.messages?.type || `${field} must be an array`);
          }
          break;
          
        case 'object':
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            errors.push(fieldSchema.messages?.type || `${field} must be an object`);
          }
          break;
          
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors.push(fieldSchema.messages?.type || `${field} must be a valid date`);
          }
          break;
          
        case 'email':
          if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(fieldSchema.messages?.type || `${field} must be a valid email`);
          }
          break;
      }
    }
    
    // String length validation
    if (typeof value === 'string') {
      if (fieldSchema.min && value.length < fieldSchema.min) {
        errors.push(fieldSchema.messages?.min || `${field} must be at least ${fieldSchema.min} characters`);
      }
      
      if (fieldSchema.max && value.length > fieldSchema.max) {
        errors.push(fieldSchema.messages?.max || `${field} cannot exceed ${fieldSchema.max} characters`);
      }
    }
    
    // Number range validation
    if (typeof value === 'number') {
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        errors.push(fieldSchema.messages?.min || `${field} must be at least ${fieldSchema.min}`);
      }
      
      if (fieldSchema.max !== undefined && value > fieldSchema.max) {
        errors.push(fieldSchema.messages?.max || `${field} cannot exceed ${fieldSchema.max}`);
      }
    }
    
    // Array length validation
    if (Array.isArray(value)) {
      if (fieldSchema.min !== undefined && value.length < fieldSchema.min) {
        errors.push(fieldSchema.messages?.min || `${field} must contain at least ${fieldSchema.min} items`);
      }
      
      if (fieldSchema.max !== undefined && value.length > fieldSchema.max) {
        errors.push(fieldSchema.messages?.max || `${field} cannot contain more than ${fieldSchema.max} items`);
      }
    }
    
    // Enum validation
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push(fieldSchema.messages?.enum || `${field} must be one of: ${fieldSchema.enum.join(', ')}`);
    }
    
    // Pattern validation
    if (fieldSchema.pattern && typeof value === 'string') {
      const pattern = fieldSchema.pattern instanceof RegExp 
        ? fieldSchema.pattern 
        : new RegExp(fieldSchema.pattern);
        
      if (!pattern.test(value)) {
        errors.push(fieldSchema.messages?.pattern || `${field} has an invalid format`);
      }
    }
    
    // Custom validation
    if (fieldSchema.validate && typeof fieldSchema.validate === 'function') {
      try {
        const result = fieldSchema.validate(value);
        
        if (result === false) {
          errors.push(fieldSchema.messages?.validate || `${field} is invalid`);
        } else if (typeof result === 'string') {
          errors.push(result);
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    
    return errors;
  }
}
