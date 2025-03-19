/**
 * Types for validation schemas used throughout the application
 */

export interface ValidationRule {
  type: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  options?: string[];
  messages?: Record<string, string>;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationOptions {
  throwOnError?: boolean;
  stopOnFirstError?: boolean;
  customMessages?: Record<string, string>;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  validatedData: T;
}
