/**
 * Validation-related types
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
  [key: string]: {
    type: string;
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    integer?: boolean;
    messages?: {
      [key: string]: string;
    };
    [key: string]: any;
  };
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
