/**
 * Base validation options interface
 */
export interface BaseValidationOptions {
    required?: boolean;
}
/**
 * Result of a validation operation
 */
export interface ValidationResult<T = any> {
    isValid: boolean;
    errors: string[];
    value: T;
}
/**
 * Validation schema for comprehensive input validation
 */
export interface ValidationSchema {
    [key: string]: ValidationRule;
}
/**
 * Generic validation rule interface
 */
export interface ValidationRule extends BaseValidationOptions {
    type: 'text' | 'email' | 'phone' | 'date' | 'numeric' | 'password' | 'time';
    [key: string]: any;
}
/**
 * Text validation options
 */
export interface TextValidationOptions extends BaseValidationOptions {
    minLength?: number;
    maxLength?: number;
    trim?: boolean;
    escape?: boolean;
    pattern?: RegExp;
}
/**
 * Date validation options
 */
export interface DateValidationOptions extends BaseValidationOptions {
    pastAllowed?: boolean;
    futureAllowed?: boolean;
    beforeDate?: Date | string;
    afterDate?: Date | string;
}
/**
 * Numeric validation options
 */
export interface NumericValidationOptions extends BaseValidationOptions {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
    negative?: boolean;
}
/**
 * Password validation options
 */
export interface PasswordValidationOptions extends BaseValidationOptions {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
}
/**
 * Time validation options
 */
export interface TimeValidationOptions extends BaseValidationOptions {
    format?: '24h' | '12h';
}
/**
 * Validate and sanitize text input
 * @param input Input text to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare const validateText: (input: string | null | undefined, options?: TextValidationOptions) => ValidationResult<string>;
/**
 * Validate email address
 * @param email Email to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare const validateEmail: (email: string | null | undefined, options?: BaseValidationOptions) => ValidationResult<string>;
/**
 * Validate phone number
 * @param phone Phone number to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare const validatePhone: (phone: string | null | undefined, options?: BaseValidationOptions) => ValidationResult<string>;
/**
 * Validate date
 * @param date Date to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare const validateDate: (date: string | Date | null | undefined, options?: DateValidationOptions) => ValidationResult<Date | null>;
/**
 * Validate time format (24-hour format: HH:MM by default)
 * @param time Time string to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare const validateTimeFormat: (time: string | null | undefined, options?: TimeValidationOptions) => ValidationResult<string>;
/**
 * Validate numeric values
 * @param value Numeric value to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare const validateNumeric: (value: number | string | null | undefined, options?: NumericValidationOptions) => ValidationResult<number | null>;
/**
 * Validate password strength
 * @param password Password to validate
 * @param options Validation options
 * @returns Validation result
 */
export declare const validatePassword: (password: string | null | undefined, options?: PasswordValidationOptions) => ValidationResult<string>;
/**
 * Comprehensive input validation
 * @param data Input data to validate
 * @param schema Validation schema
 * @param options Additional options for validation
 * @returns Validation result for the entire object
 */
export declare const validateInput: <T extends Record<string, any>>(data: Record<string, any>, schema: ValidationSchema, options?: {
    throwOnError?: boolean;
}) => {
    isValid: boolean;
    errors: string[];
    validatedData: T;
};
