/**
 * Validation Service Implementation
 * Provides data validation against schemas
 */

import { IValidationService, ValidationResult, SchemaDefinition } from './IValidationService';
import { ILoggingService } from '../logging';

/**
 * ValidationService class
 * Implements IValidationService interface
 */
export class ValidationService implements IValidationService {
  /**
   * Constructor
   * 
   * @param logger Optional logger service
   */
  constructor(private readonly logger?: ILoggingService) {
    if (this.logger) {
      this.logger.debug('ValidationService initialized');
    } else {
      // Create a simple console logger if none provided
      this.logger = {
        debug: (message: string, ...args: any[]) => console.debug(message, ...args),
        info: (message: string, ...args: any[]) => console.info(message, ...args),
        warn: (message: string, ...args: any[]) => console.warn(message, ...args),
        error: (message: string, ...args: any[]) => console.error(message, ...args)
      } as ILoggingService;
      
      this.logger.debug('ValidationService initialized with default console logger');
    }
  }
  
  /**
   * Validate data against a schema
   * 
   * @param data Data to validate
   * @param schema Schema to validate against
   * @returns Validation result with isValid flag and errors array
   */
  validate(data: any, schema: SchemaDefinition): ValidationResult {
    const errors: string[] = [];
    
    // Validate each field in the schema
    Object.entries(schema).forEach(([field, fieldSchema]) => {
      // Check if the field is required
      if (fieldSchema.required && (data[field] === undefined || data[field] === null)) {
        errors.push(`${field} is required`);
        return;
      }
      
      // Skip validation if field is not present and not required
      if (data[field] === undefined || data[field] === null) {
        return;
      }
      
      // Type validation
      if (fieldSchema.type) {
        const typeResult = this.validateType(data[field], fieldSchema.type, field);
        if (!typeResult.isValid) {
          errors.push(...typeResult.errors);
        }
      }
      
      // Format validation
      if (fieldSchema.format) {
        const formatResult = this.validateFormat(data[field], fieldSchema.format, field);
        if (!formatResult.isValid) {
          errors.push(...formatResult.errors);
        }
      }
      
      // Length validation for strings
      if (typeof data[field] === 'string') {
        const lengthResult = this.validateLength(data[field], fieldSchema, field);
        if (!lengthResult.isValid) {
          errors.push(...lengthResult.errors);
        }
      }
      
      // Range validation for numbers
      if (typeof data[field] === 'number') {
        const rangeResult = this.validateRange(data[field], fieldSchema, field);
        if (!rangeResult.isValid) {
          errors.push(...rangeResult.errors);
        }
      }
      
      // Pattern validation for strings
      if (typeof data[field] === 'string' && fieldSchema.pattern) {
        const patternResult = this.validatePattern(data[field], fieldSchema.pattern, field);
        if (!patternResult.isValid) {
          errors.push(...patternResult.errors);
        }
      }
      
      // Enum validation
      if (fieldSchema.enum) {
        const enumResult = this.validateEnum(data[field], fieldSchema.enum, field);
        if (!enumResult.isValid) {
          errors.push(...enumResult.errors);
        }
      }
      
      // Array validation
      if (Array.isArray(data[field]) && fieldSchema.items) {
        const arrayResult = this.validateArray(data[field], fieldSchema.items, field);
        if (!arrayResult.isValid) {
          errors.push(...arrayResult.errors);
        }
      }
      
      // Object validation
      if (typeof data[field] === 'object' && data[field] !== null && !Array.isArray(data[field]) && fieldSchema.properties) {
        const objectResult = this.validate(data[field], fieldSchema.properties);
        if (!objectResult.isValid) {
          errors.push(...objectResult.errors.map(error => `${field}.${error}`));
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate a specific field against a schema
   * 
   * @param field Field name
   * @param value Field value
   * @param schema Schema for the field
   * @returns Validation result with isValid flag and errors array
   */
  validateField(field: string, value: any, schema: SchemaDefinition[string]): ValidationResult {
    const data = { [field]: value };
    const fieldSchema = { [field]: schema };
    return this.validate(data, fieldSchema);
  }
  
  /**
   * Cast a value to the specified type
   * 
   * @param value Value to cast
   * @param type Target type
   * @returns Cast value
   */
  cast(value: any, type: string): any {
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'integer':
        return parseInt(value, 10);
      case 'float':
        return parseFloat(value);
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }
  
  /**
   * Validate type of a value
   * 
   * @param value Value to validate
   * @param type Expected type
   * @param field Field name
   * @returns Validation result
   */
  private validateType(value: any, type: string, field: string): ValidationResult {
    const errors: string[] = [];
    
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
        break;
      case 'number':
      case 'integer':
      case 'float':
        if (typeof value !== 'number') {
          errors.push(`${field} must be a number`);
        }
        if (type === 'integer' && !Number.isInteger(value)) {
          errors.push(`${field} must be an integer`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`${field} must be an object`);
        }
        break;
      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          errors.push(`${field} must be a valid date`);
        }
        break;
      default:
        errors.push(`Unknown type: ${type}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate format of a value
   * 
   * @param value Value to validate
   * @param format Expected format
   * @param field Field name
   * @returns Validation result
   */
  private validateFormat(value: any, format: string, field: string): ValidationResult {
    const errors: string[] = [];
    
    switch (format) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${field} must be a valid email address`);
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`${field} must be a valid URL`);
        }
        break;
      case 'date-time':
        if (isNaN(Date.parse(value))) {
          errors.push(`${field} must be a valid date-time`);
        }
        break;
      case 'uuid':
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
          errors.push(`${field} must be a valid UUID`);
        }
        break;
      case 'phone':
        if (!/^\+?[0-9\-\(\)\s]+$/.test(value)) {
          errors.push(`${field} must be a valid phone number`);
        }
        break;
      default:
        errors.push(`Unknown format: ${format}`);
        this.logger?.warn(`Unknown format: ${format}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate length of a string
   * 
   * @param value String to validate
   * @param schema Schema for the field
   * @param field Field name
   * @returns Validation result
   */
  private validateLength(value: string, schema: SchemaDefinition[string], field: string): ValidationResult {
    const errors: string[] = [];
    
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${field} must be at least ${schema.minLength} characters long`);
    }
    
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${field} must be at most ${schema.maxLength} characters long`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate range of a number
   * 
   * @param value Number to validate
   * @param schema Schema for the field
   * @param field Field name
   * @returns Validation result
   */
  private validateRange(value: number, schema: SchemaDefinition[string], field: string): ValidationResult {
    const errors: string[] = [];
    
    if (schema.min !== undefined && value < schema.min) {
      errors.push(`${field} must be at least ${schema.min}`);
    }
    
    if (schema.max !== undefined && value > schema.max) {
      errors.push(`${field} must be at most ${schema.max}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate pattern of a string
   * 
   * @param value String to validate
   * @param pattern Pattern to match
   * @param field Field name
   * @returns Validation result
   */
  private validatePattern(value: string, pattern: string | RegExp, field: string): ValidationResult {
    const errors: string[] = [];
    
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    if (!regex.test(value)) {
      errors.push(`${field} does not match the required pattern`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate enum value
   * 
   * @param value Value to validate
   * @param enumValues Allowed values
   * @param field Field name
   * @returns Validation result
   */
  private validateEnum(value: any, enumValues: (string | number)[], field: string): ValidationResult {
    const errors: string[] = [];
    
    if (!enumValues.includes(value as string | number)) {
      errors.push(`${field} must be one of: ${enumValues.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate array items
   * 
   * @param value Array to validate
   * @param itemSchema Schema for array items
   * @param field Field name
   * @returns Validation result
   */
  private validateArray(value: any[], itemSchema: SchemaDefinition, field: string): ValidationResult {
    const errors: string[] = [];
    
    value.forEach((item, index) => {
      const itemData = { item };
      const itemFieldSchema = { item: itemSchema };
      const itemResult = this.validate(itemData, itemFieldSchema);
      
      if (!itemResult.isValid) {
        itemResult.errors.forEach(error => {
          errors.push(`${field}[${index}] ${error.replace('item ', '')}`);
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
