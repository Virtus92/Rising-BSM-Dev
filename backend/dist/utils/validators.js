"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = exports.validatePassword = exports.validateNumeric = exports.validateTimeFormat = exports.validateDate = exports.validatePhone = exports.validateEmail = exports.validateText = void 0;
const validator_1 = __importDefault(require("validator"));
const errors_1 = require("./errors");
/**
 * Validate and sanitize text input
 * @param input Input text to validate
 * @param options Validation options
 * @returns Validation result
 */
const validateText = (input, options = {}) => {
    const { required = false, minLength = 0, maxLength = 500, trim = true, escape = true, pattern } = options;
    const errors = [];
    // Handle null or undefined
    if (input === null || input === undefined) {
        if (required) {
            errors.push('Input is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    // Ensure input is a string
    const strInput = String(input);
    const value = trim ? strInput.trim() : strInput;
    // Check if empty
    if (value === '' && required) {
        errors.push('Input cannot be empty');
    }
    // Length validation
    if (value.length < minLength) {
        errors.push(`Input must be at least ${minLength} characters long`);
    }
    if (value.length > maxLength) {
        errors.push(`Input must not exceed ${maxLength} characters`);
    }
    // Pattern validation
    if (pattern && !pattern.test(value)) {
        errors.push(`Input does not match the required pattern`);
    }
    // Escape if requested
    let sanitizedValue = value;
    if (escape) {
        // Custom escaping without escaping forward slashes
        sanitizedValue = sanitizedValue
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    return {
        isValid: errors.length === 0,
        errors,
        value: sanitizedValue
    };
};
exports.validateText = validateText;
/**
 * Validate email address
 * @param email Email to validate
 * @param options Validation options
 * @returns Validation result
 */
const validateEmail = (email, options = {}) => {
    const { required = false } = options;
    const errors = [];
    // Handle null, undefined or empty
    if (!email) {
        if (required) {
            errors.push('Email address is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    // Check if email is valid
    if (!validator_1.default.isEmail(email)) {
        errors.push('Invalid email address format');
        return {
            isValid: false,
            errors,
            value: String(email) // Return original value for invalid emails
        };
    }
    // Normalize and sanitize email
    const sanitizedEmail = validator_1.default.normalizeEmail(email) || email.toLowerCase();
    return {
        isValid: true,
        errors,
        value: sanitizedEmail
    };
};
exports.validateEmail = validateEmail;
/**
 * Validate phone number
 * @param phone Phone number to validate
 * @param options Validation options
 * @returns Validation result
 */
const validatePhone = (phone, options = {}) => {
    const { required = false } = options;
    const errors = [];
    // Handle null, undefined or empty
    if (!phone) {
        if (required) {
            errors.push('Phone number is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    // Remove non-digit characters for validation
    const cleanedPhone = String(phone).replace(/\D/g, '');
    // Basic phone number validation
    if (cleanedPhone && !validator_1.default.isMobilePhone(cleanedPhone, 'any', { strictMode: false })) {
        errors.push('Invalid phone number format');
    }
    return {
        isValid: errors.length === 0,
        errors,
        value: cleanedPhone
    };
};
exports.validatePhone = validatePhone;
/**
 * Validate date
 * @param date Date to validate
 * @param options Validation options
 * @returns Validation result
 */
const validateDate = (date, options = {}) => {
    const { required = false, pastAllowed = true, futureAllowed = true, beforeDate, afterDate } = options;
    const errors = [];
    // Handle null or undefined
    if (date === null || date === undefined || (typeof date === 'string' && date.trim() === '')) {
        if (required) {
            errors.push('Date is required');
        }
        return { isValid: !required, errors, value: null };
    }
    let parsedDate;
    try {
        // Convert to Date object if string
        parsedDate = date instanceof Date ? date : new Date(date);
        // Check if date is valid
        if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
        }
    }
    catch (error) {
        errors.push('Invalid date format');
        return { isValid: false, errors, value: null };
    }
    const now = new Date();
    // Past date validation
    if (!pastAllowed && parsedDate < now) {
        errors.push('Date cannot be in the past');
    }
    // Future date validation
    if (!futureAllowed && parsedDate > now) {
        errors.push('Date cannot be in the future');
    }
    // Before date validation
    if (beforeDate) {
        const compareDate = beforeDate instanceof Date ? beforeDate : new Date(beforeDate);
        if (!isNaN(compareDate.getTime()) && parsedDate > compareDate) {
            errors.push(`Date must be before ${beforeDate instanceof Date ?
                beforeDate.toLocaleDateString() : beforeDate}`);
        }
    }
    // After date validation
    if (afterDate) {
        const compareDate = afterDate instanceof Date ? afterDate : new Date(afterDate);
        if (!isNaN(compareDate.getTime()) && parsedDate < compareDate) {
            errors.push(`Date must be after ${afterDate instanceof Date ?
                afterDate.toLocaleDateString() : afterDate}`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        value: parsedDate
    };
};
exports.validateDate = validateDate;
/**
 * Validate time format (24-hour format: HH:MM by default)
 * @param time Time string to validate
 * @param options Validation options
 * @returns Validation result
 */
const validateTimeFormat = (time, options = {}) => {
    const { required = false, format = '24h' } = options;
    const errors = [];
    // Handle null, undefined or empty
    if (!time) {
        if (required) {
            errors.push('Time is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    // Choose regex based on format
    const timeRegex = format === '24h'
        ? /^([01]\d|2[0-3]):([0-5]\d)$/ // 24-hour format (HH:MM)
        : /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/; // 12-hour format (HH:MM AM/PM)
    if (!timeRegex.test(String(time))) {
        errors.push(`Invalid time format. Use ${format === '24h' ? '24-hour format (HH:MM)' :
            '12-hour format (HH:MM AM/PM)'}`);
    }
    return {
        isValid: errors.length === 0,
        errors,
        value: String(time)
    };
};
exports.validateTimeFormat = validateTimeFormat;
/**
 * Validate numeric values
 * @param value Numeric value to validate
 * @param options Validation options
 * @returns Validation result
 */
const validateNumeric = (value, options = {}) => {
    const { required = false, min = -Infinity, max = Infinity, integer = false, positive = false, negative = false } = options;
    const errors = [];
    // Handle null, undefined or empty
    if (value === null || value === undefined || value === '') {
        if (required) {
            errors.push('Numeric value is required');
        }
        return { isValid: !required, errors, value: null };
    }
    // Convert to number
    const numericValue = typeof value === 'number' ? value : Number(value);
    // Check if numeric
    if (isNaN(numericValue)) {
        errors.push('Value must be a number');
        return { isValid: false, errors, value: null };
    }
    // Integer validation
    if (integer && !Number.isInteger(numericValue)) {
        errors.push('Value must be an integer');
    }
    // Min value validation
    if (numericValue < min) {
        errors.push(`Value must be at least ${min}`);
    }
    // Max value validation
    if (numericValue > max) {
        errors.push(`Value must not exceed ${max}`);
    }
    // Positive/negative validation
    if (positive && numericValue <= 0) {
        errors.push('Value must be positive');
    }
    if (negative && numericValue >= 0) {
        errors.push('Value must be negative');
    }
    return {
        isValid: errors.length === 0,
        errors,
        value: numericValue
    };
};
exports.validateNumeric = validateNumeric;
/**
 * Validate password strength
 * @param password Password to validate
 * @param options Validation options
 * @returns Validation result
 */
const validatePassword = (password, options = {}) => {
    const { required = true, minLength = 12, requireUppercase = true, requireLowercase = true, requireNumbers = true, requireSpecialChars = true } = options;
    const errors = [];
    // Handle null, undefined or empty
    if (!password) {
        if (required) {
            errors.push('Password is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    // Length validation
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    // Character type validations
    if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors,
        value: password
    };
};
exports.validatePassword = validatePassword;
/**
 * Comprehensive input validation
 * @param data Input data to validate
 * @param schema Validation schema
 * @param options Additional options for validation
 * @returns Validation result for the entire object
 */
const validateInput = (data, schema, options = {}) => {
    const { throwOnError = false } = options;
    const validationResults = {};
    const errors = [];
    const validatedData = {};
    Object.entries(schema).forEach(([field, rules]) => {
        const value = data[field];
        let result;
        switch (rules.type) {
            case 'text':
                result = (0, exports.validateText)(value, rules);
                break;
            case 'email':
                result = (0, exports.validateEmail)(value, rules);
                break;
            case 'phone':
                result = (0, exports.validatePhone)(value, rules);
                break;
            case 'date':
                result = (0, exports.validateDate)(value, rules);
                break;
            case 'numeric':
                result = (0, exports.validateNumeric)(value, rules);
                break;
            case 'password':
                result = (0, exports.validatePassword)(value, rules);
                break;
            case 'time':
                result = (0, exports.validateTimeFormat)(value, rules);
                break;
            default:
                result = { isValid: true, errors: [], value };
        }
        validationResults[field] = result;
        validatedData[field] = result.value;
        if (!result.isValid) {
            result.errors.forEach(err => errors.push(`${field}: ${err}`));
        }
    });
    const isValid = errors.length === 0;
    if (!isValid && throwOnError) {
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    return {
        isValid,
        errors,
        validatedData: validatedData
    };
};
exports.validateInput = validateInput;
//# sourceMappingURL=validators.js.map