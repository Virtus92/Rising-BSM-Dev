export interface BaseValidationOptions {
    required?: boolean;
}
export interface ValidationResult<T = any> {
    isValid: boolean;
    errors: string[];
    value: T;
}
export interface ValidationSchema {
    [key: string]: ValidationRule;
}
export interface ValidationRule extends BaseValidationOptions {
    type: 'text' | 'email' | 'phone' | 'date' | 'numeric' | 'password' | 'time';
    [key: string]: any;
}
export interface TextValidationOptions extends BaseValidationOptions {
    minLength?: number;
    maxLength?: number;
    trim?: boolean;
    escape?: boolean;
    pattern?: RegExp;
}
export interface DateValidationOptions extends BaseValidationOptions {
    pastAllowed?: boolean;
    futureAllowed?: boolean;
    beforeDate?: Date | string;
    afterDate?: Date | string;
}
export interface NumericValidationOptions extends BaseValidationOptions {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
    negative?: boolean;
}
export interface PasswordValidationOptions extends BaseValidationOptions {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
}
export interface TimeValidationOptions extends BaseValidationOptions {
    format?: '24h' | '12h';
}
export declare const validateText: (input: string | null | undefined, options?: TextValidationOptions) => ValidationResult<string>;
export declare const validateEmail: (email: string | null | undefined, options?: BaseValidationOptions) => ValidationResult<string>;
export declare const validatePhone: (phone: string | null | undefined, options?: BaseValidationOptions) => ValidationResult<string>;
export declare const validateDate: (date: string | Date | null | undefined, options?: DateValidationOptions) => ValidationResult<Date | null>;
export declare const validateTimeFormat: (time: string | null | undefined, options?: TimeValidationOptions) => ValidationResult<string>;
export declare const validateNumeric: (value: number | string | null | undefined, options?: NumericValidationOptions) => ValidationResult<number | null>;
export declare const validatePassword: (password: string | null | undefined, options?: PasswordValidationOptions) => ValidationResult<string>;
export declare const validateInput: <T extends Record<string, any>>(data: Record<string, any>, schema: ValidationSchema, options?: {
    throwOnError?: boolean;
}) => {
    isValid: boolean;
    errors: string[];
    validatedData: T;
};
