/**
 * Utility for extending validation types to support string literals
 */
import { ValidationRule as BaseValidationRule, ValidationSchema as BaseValidationSchema } from './validators';

// Allow string literals for validation rule types
export interface ValidationRule extends Omit<BaseValidationRule, 'type'> {
  type: BaseValidationRule['type'] | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Helper function to convert extended schema to standard schema
export function convertValidationSchema(schema: ValidationSchema): BaseValidationSchema {
  const converted: BaseValidationSchema = {};
  
  for (const [key, rule] of Object.entries(schema)) {
    converted[key] = {
      ...rule,
      type: rule.type as BaseValidationRule['type']
    };
  }
  
  return converted;
}

// Type guard to ensure validation schema types are correct
export function isValidType(type: string): type is BaseValidationRule['type'] {
  return ['text', 'email', 'phone', 'date', 'numeric', 'password', 'time'].includes(type);
}