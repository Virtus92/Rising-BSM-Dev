import { ValidationRule, ValidationSchema } from './validators';

// Allow string literals for validation rule types
export interface ExtendedValidationRule extends Omit<ValidationRule, 'type'> {
  type: ValidationRule['type'] | string;
}

export interface ExtendedValidationSchema {
  [key: string]: ExtendedValidationRule;
}

// Helper function to convert extended schema to standard schema
export function convertValidationSchema(schema: ExtendedValidationSchema): ValidationSchema {
  const converted: ValidationSchema = {};
  
  for (const [key, rule] of Object.entries(schema)) {
    converted[key] = {
      ...rule,
      type: rule.type as ValidationRule['type']
    };
  }
  
  return converted;
}