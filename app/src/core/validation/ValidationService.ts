/**
 * Validation Service
 * Provides centralized validation functionality
 */
import { 
  IValidationService, 
  ValidationResult, 
  SchemaDefinition, 
  SchemaDefinitionInput 
} from './IValidationService';
import { 
  ValidationResultDto, 
  ValidationErrorDto,
  createErrorValidation,
  createSuccessValidation 
} from '@/domain/dtos/ValidationDto';
import { ValidationResult as ValidationResultEnum, ValidationErrorType } from '@/domain/enums/ValidationResults';
import { getLogger } from '../logging';

export class ValidationService implements IValidationService {
  private readonly logger = getLogger();
  
  /**
   * Validates data against a schema
   */
  validate(schemaNameOrData: string | any, data?: SchemaDefinitionInput | any): ValidationResult {
    let actualData: any;
    let actualSchema: any;
    
    // Handle overloaded parameters
    if (typeof schemaNameOrData === 'string') {
      // First param is schema name, second is data
      actualSchema = this.getSchemaByName(schemaNameOrData);
      actualData = data;
    } else {
      // First param is data, second is schema
      actualData = schemaNameOrData;
      actualSchema = data;
    }
    
    const errors: string[] = [];
    
    // Basic validation implementation
    if (actualSchema && actualSchema.required) {
      for (const field of actualSchema.required) {
        if (!actualData || actualData[field] === undefined || actualData[field] === null || actualData[field] === '') {
          errors.push(`${field} is required`);
        }
      }
    }
    
    if (actualSchema && actualSchema.properties) {
      for (const [field, fieldRule] of Object.entries(actualSchema.properties)) {
        const value = actualData ? actualData[field] : undefined;
        
        if (value !== undefined && value !== null) {
          // Type validation
          if (fieldRule && typeof fieldRule === 'object' && 'type' in fieldRule) {
            const type = fieldRule.type as string;
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== type) {
              errors.push(`${field} must be of type ${type}`);
            }
          }
          
          // String length validation
          if (fieldRule && typeof fieldRule === 'object' && 'type' in fieldRule && fieldRule.type === 'string' && typeof value === 'string') {
            if ('minLength' in fieldRule && typeof fieldRule.minLength === 'number' && value.length < fieldRule.minLength) {
              errors.push(`${field} must be at least ${fieldRule.minLength} characters`);
            }
            if ('maxLength' in fieldRule && typeof fieldRule.maxLength === 'number' && value.length > fieldRule.maxLength) {
              errors.push(`${field} must not exceed ${fieldRule.maxLength} characters`);
            }
          }
          
          // Number range validation
          if (fieldRule && typeof fieldRule === 'object' && 'type' in fieldRule && fieldRule.type === 'number' && typeof value === 'number') {
            if ('minimum' in fieldRule && typeof fieldRule.minimum === 'number' && value < fieldRule.minimum) {
              errors.push(`${field} must be at least ${fieldRule.minimum}`);
            }
            if ('maximum' in fieldRule && typeof fieldRule.maximum === 'number' && value > fieldRule.maximum) {
              errors.push(`${field} must not exceed ${fieldRule.maximum}`);
            }
          }
          
          // Enum validation
          if (fieldRule && typeof fieldRule === 'object' && 'enum' in fieldRule && Array.isArray(fieldRule.enum) && !fieldRule.enum.includes(value)) {
            errors.push(`${field} must be one of: ${fieldRule.enum.join(', ')}`);
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate a specific field
   */
  validateField(field: string, value: any, schema: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    
    // Ensure schema is an object
    if (!schema || typeof schema !== 'object') {
      errors.push(`Invalid schema for field ${field}`);
      return { isValid: false, errors };
    }
    
    // Required check
    const isRequired = 'required' in schema && schema.required === true;
    if (isRequired && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return { isValid: false, errors };
    }
    
    // Type validation
    const schemaType = 'type' in schema ? schema.type as string : undefined;
    if (schemaType && value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schemaType) {
        errors.push(`${field} must be of type ${schemaType}`);
      }
    }
    
    // Additional validations based on type
    if (schemaType === 'string' && typeof value === 'string') {
      const minLength = 'minLength' in schema ? schema.minLength as number : undefined;
      const maxLength = 'maxLength' in schema ? schema.maxLength as number : undefined;
      const pattern = 'pattern' in schema ? schema.pattern as string : undefined;
      
      if (minLength !== undefined && value.length < minLength) {
        errors.push(`${field} must be at least ${minLength} characters`);
      }
      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(`${field} must not exceed ${maxLength} characters`);
      }
      if (pattern && !new RegExp(pattern).test(value)) {
        errors.push(`${field} has invalid format`);
      }
    }
    
    if (schemaType === 'number' && typeof value === 'number') {
      const min = 'min' in schema ? schema.min as number : undefined;
      const max = 'max' in schema ? schema.max as number : undefined;
      
      if (min !== undefined && value < min) {
        errors.push(`${field} must be at least ${min}`);
      }
      if (max !== undefined && value > max) {
        errors.push(`${field} must not exceed ${max}`);
      }
    }
    
    // Enum validation
    if ('enum' in schema && Array.isArray(schema.enum)) {
      if (!schema.enum.includes(value)) {
        errors.push(`${field} must be one of: ${schema.enum.join(', ')}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Cast a value to the specified type
   */
  cast(value: any, type: string): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      default:
        return value;
    }
  }
  
  /**
   * Validate user creation data
   */
  validateCreateUser(data: any): ValidationResult {
    const schema: SchemaDefinition = {
      name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
      email: { type: 'string', required: true, format: 'email' },
      password: { type: 'string', required: true, minLength: 8 },
      role: { type: 'string', enum: ['admin', 'manager', 'employee', 'user'] },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended', 'deleted'] }
    };
    
    const result = this.validate(data, { properties: schema, required: ['name', 'email', 'password'] });
    
    // Additional email validation
    if (data.email && !this.validateEmail(data.email)) {
      result.errors.push('Invalid email format');
      result.isValid = false;
    }
    
    // Additional password validation
    if (data.password) {
      const passwordResult = this.validatePassword(data.password);
      result.errors.push(...passwordResult.errors);
      result.isValid = result.isValid && passwordResult.isValid;
    }
    
    return result;
  }
  
  /**
   * Validate user update data
   */
  validateUpdateUser(data: any): ValidationResult {
    const schema: SchemaDefinition = {
      name: { type: 'string', minLength: 1, maxLength: 255 },
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['admin', 'manager', 'employee', 'user'] },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended', 'deleted'] }
    };
    
    const result = this.validate(data, { properties: schema });
    
    // Additional email validation if email is provided
    if (data.email && !this.validateEmail(data.email)) {
      result.errors.push('Invalid email format');
      result.isValid = false;
    }
    
    return result;
  }
  
  /**
   * Validates an email address
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validates a phone number
   */
  validatePhoneNumber(phone: string): boolean {
    // Basic phone validation (can be customized for specific formats)
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  }
  
  /**
   * Validates a password
   */
  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Sanitizes HTML input
   */
  sanitizeHtml(html: string): string {
    // Basic HTML sanitization (in production, use a library like DOMPurify)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  }
  
  /**
   * Validates a date
   */
  validateDate(date: string | Date): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }
  
  /**
   * Validates if a value is empty
   */
  isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (typeof value === 'string') {
      return value.trim().length === 0;
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false;
  }
  
  /**
   * Get schema by name
   */
  private getSchemaByName(schemaName: string): any {
    // This could be extended to load schemas from files or a registry
    switch (schemaName) {
      case 'createUser':
        return this.getUserCreateSchema();
      case 'updateUser':
        return this.getUserUpdateSchema();
      case 'createCustomer':
        return this.getCustomerCreateSchema();
      case 'updateCustomer':
        return this.getCustomerUpdateSchema();
      default:
        return {};
    }
  }
  
  private getUserCreateSchema(): any {
    return {
      properties: {
        name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
        email: { type: 'string', required: true, format: 'email' },
        password: { type: 'string', required: true, minLength: 8 },
        role: { type: 'string', enum: ['admin', 'manager', 'employee', 'user'] },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended', 'deleted'] }
      },
      required: ['name', 'email', 'password']
    };
  }
  
  private getUserUpdateSchema(): any {
    return {
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['admin', 'manager', 'employee', 'user'] },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended', 'deleted'] }
      }
    };
  }
  
  private getCustomerCreateSchema(): any {
    return {
      properties: {
        name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' },
        company: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'deleted'] }
      },
      required: ['name']
    };
  }
  
  private getCustomerUpdateSchema(): any {
    return {
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        country: { type: 'string' },
        postalCode: { type: 'string' },
        company: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'deleted'] }
      }
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();

// Also export the class for dependency injection
export default ValidationService;
