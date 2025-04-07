/**
 * Validation utilities
 */
import { getValidationService } from '@/lib/core/bootstrap';
import { ValidationSchema, ValidationRule } from '@/types/interfaces/IValidationService';

/**
 * ValidationUtils
 * 
 * Extended utility functions for validation integrated with ValidationService
 */
export class ValidationUtils {
  /**
   * Validate and sanitize filter parameters
   */
  static sanitizeFilters<T extends Record<string, any>>(
    filters: Partial<T>,
    allowedFilters: string[],
    defaults: Partial<T> = {}
  ): Partial<T> {
    const sanitized: Partial<T> = { ...defaults };
    
    for (const key of allowedFilters) {
      if (filters[key] !== undefined) {
        sanitized[key] = filters[key];
      }
    }
    
    return sanitized;
  }

  /**
   * Parse numeric parameter safely
   */
  static parseNumericParam(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse date parameter safely
   */
  static parseDateParam(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate phone number format (basic validation)
   */
  static isValidPhone(phone: string): boolean {
    // This is a simple validation, a more comprehensive one might be needed
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  }
  
  /**
   * Validate if a string is within min and max length
   */
  static isValidLength(str: string, min: number, max: number): boolean {
    return str.length >= min && str.length <= max;
  }
  
  /**
   * Validate data against a schema using ValidationService
   * 
   * @param data - Data to validate
   * @param schema - Validation schema
   * @param throwOnError - Whether to throw on validation errors
   * @returns Validation result
   */
  static validate<T>(data: any, schema: ValidationSchema, throwOnError = false): { isValid: boolean; data?: T; errors: string[] } {
    const validationService = getValidationService();
    
    const result = throwOnError 
      ? validationService.validateOrThrow<T>(data, schema)
      : validationService.validate<T>(data, schema);
    
    return {
      isValid: result.isValid,
      data: result.isValid ? result.validatedData : undefined,
      errors: result.errors
    };
  }
  
  /**
   * Create common validation rule for string fields
   * 
   * @param required - Whether field is required
   * @param min - Minimum length
   * @param max - Maximum length
   * @param pattern - Regex pattern
   * @returns Validation rule
   */
  static stringRule(required = false, min = 0, max = 255, pattern?: RegExp): ValidationRule {
    return {
      type: 'string',
      required,
      min,
      max,
      pattern,
      transform: [s => s?.trim()]
    };
  }
  
  /**
   * Create common validation rule for email fields
   * 
   * @param required - Whether field is required
   * @returns Validation rule
   */
  static emailRule(required = false): ValidationRule {
    return {
      type: 'email',
      required,
      transform: [s => s?.trim().toLowerCase()]
    };
  }
  
  /**
   * Create common validation rule for number fields
   * 
   * @param required - Whether field is required
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Validation rule
   */
  static numberRule(required = false, min?: number, max?: number): ValidationRule {
    return {
      type: 'number',
      required,
      min,
      max
    };
  }
  
  /**
   * Create common validation rule for integer fields
   * 
   * @param required - Whether field is required
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Validation rule
   */
  static integerRule(required = false, min?: number, max?: number): ValidationRule {
    return {
      type: 'integer',
      required,
      min,
      max
    };
  }
  
  /**
   * Create common validation rule for enum fields
   * 
   * @param values - Allowed values
   * @param required - Whether field is required
   * @returns Validation rule
   */
  static enumRule(values: any[], required = false): ValidationRule {
    return {
      type: 'enum',
      required,
      enum: values
    };
  }
  
  /**
   * Create common validation rule for date fields
   * 
   * @param required - Whether field is required
   * @returns Validation rule
   */
  static dateRule(required = false): ValidationRule {
    return {
      type: 'date',
      required
    };
  }
}