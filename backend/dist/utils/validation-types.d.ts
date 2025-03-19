import { ValidationRule, ValidationSchema } from './validators';
export interface ExtendedValidationRule extends ValidationRule {
    type: ValidationRule['type'] | string;
}
export interface ExtendedValidationSchema {
    [key: string]: ExtendedValidationRule;
}

export declare function convertValidationSchema(schema: ExtendedValidationSchema): ValidationSchema;
