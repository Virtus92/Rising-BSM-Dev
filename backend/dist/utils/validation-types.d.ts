/**
 * Utility for extending validation types to support string literals
 */
import { ValidationRule as BaseValidationRule, ValidationSchema as BaseValidationSchema } from './validators';
export interface ValidationRule extends Omit<BaseValidationRule, 'type'> {
    type: BaseValidationRule['type'] | string;
}
export interface ValidationSchema {
    [key: string]: ValidationRule;
}
export declare function convertValidationSchema(schema: ValidationSchema): BaseValidationSchema;
export declare function isValidType(type: string): type is BaseValidationRule['type'];
