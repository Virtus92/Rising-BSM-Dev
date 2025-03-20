"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = exports.validatePassword = exports.validateNumeric = exports.validateTimeFormat = exports.validateDate = exports.validatePhone = exports.validateEmail = exports.validateText = void 0;
const validator_1 = __importDefault(require("validator"));
const errors_1 = require("./errors");
const validateText = (input, options = {}) => {
    const { required = false, minLength = 0, maxLength = 500, trim = true, escape = true, pattern } = options;
    const errors = [];
    if (input === null || input === undefined) {
        if (required) {
            errors.push('Input is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    const strInput = String(input);
    const value = trim ? strInput.trim() : strInput;
    if (value === '' && required) {
        errors.push('Input cannot be empty');
    }
    if (value.length < minLength) {
        errors.push(`Input must be at least ${minLength} characters long`);
    }
    if (value.length > maxLength) {
        errors.push(`Input must not exceed ${maxLength} characters`);
    }
    if (pattern && !pattern.test(value)) {
        errors.push(`Input does not match the required pattern`);
    }
    let sanitizedValue = value;
    if (escape) {
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
const validateEmail = (email, options = {}) => {
    const { required = false } = options;
    const errors = [];
    if (!email) {
        if (required) {
            errors.push('Email address is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    if (!validator_1.default.isEmail(email)) {
        errors.push('Invalid email address format');
        return {
            isValid: false,
            errors,
            value: String(email)
        };
    }
    const sanitizedEmail = validator_1.default.normalizeEmail(email) || email.toLowerCase();
    return {
        isValid: true,
        errors,
        value: sanitizedEmail
    };
};
exports.validateEmail = validateEmail;
const validatePhone = (phone, options = {}) => {
    const { required = false } = options;
    const errors = [];
    if (!phone) {
        if (required) {
            errors.push('Phone number is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    const cleanedPhone = String(phone).replace(/\D/g, '');
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
const validateDate = (date, options = {}) => {
    const { required = false, pastAllowed = true, futureAllowed = true, beforeDate, afterDate } = options;
    const errors = [];
    if (date === null || date === undefined || (typeof date === 'string' && date.trim() === '')) {
        if (required) {
            errors.push('Date is required');
        }
        return { isValid: !required, errors, value: null };
    }
    let parsedDate;
    try {
        parsedDate = date instanceof Date ? date : new Date(date);
        if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
        }
    }
    catch (error) {
        errors.push('Invalid date format');
        return { isValid: false, errors, value: null };
    }
    const now = new Date();
    if (!pastAllowed && parsedDate < now) {
        errors.push('Date cannot be in the past');
    }
    if (!futureAllowed && parsedDate > now) {
        errors.push('Date cannot be in the future');
    }
    if (beforeDate) {
        const compareDate = beforeDate instanceof Date ? beforeDate : new Date(beforeDate);
        if (!isNaN(compareDate.getTime()) && parsedDate > compareDate) {
            errors.push(`Date must be before ${beforeDate instanceof Date ?
                beforeDate.toLocaleDateString() : beforeDate}`);
        }
    }
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
const validateTimeFormat = (time, options = {}) => {
    const { required = false, format = '24h' } = options;
    const errors = [];
    if (!time) {
        if (required) {
            errors.push('Time is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    const timeRegex = format === '24h'
        ? /^([01]\d|2[0-3]):([0-5]\d)$/
        : /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/;
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
const validateNumeric = (value, options = {}) => {
    const { required = false, min = -Infinity, max = Infinity, integer = false, positive = false, negative = false } = options;
    const errors = [];
    if (value === null || value === undefined || value === '') {
        if (required) {
            errors.push('Numeric value is required');
        }
        return { isValid: !required, errors, value: null };
    }
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (isNaN(numericValue)) {
        errors.push('Value must be a number');
        return { isValid: false, errors, value: null };
    }
    if (integer && !Number.isInteger(numericValue)) {
        errors.push('Value must be an integer');
    }
    if (numericValue < min) {
        errors.push(`Value must be at least ${min}`);
    }
    if (numericValue > max) {
        errors.push(`Value must not exceed ${max}`);
    }
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
const validatePassword = (password, options = {}) => {
    const { required = true, minLength = 12, requireUppercase = true, requireLowercase = true, requireNumbers = true, requireSpecialChars = true } = options;
    const errors = [];
    if (!password) {
        if (required) {
            errors.push('Password is required');
        }
        return { isValid: !required, errors, value: '' };
    }
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
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
function env(key, defaultValue, validator) {
    const value = process.env[key];
    if (value === undefined) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Warning: ${key} is not set in environment variables, using default: ${defaultValue}`);
        }
        return defaultValue;
    }
    let convertedValue;
    if (typeof defaultValue === 'number') {
        convertedValue = Number(value);
        if (isNaN(convertedValue)) {
            console.warn(`⚠️ Warning: ${key} value "${value}" is not a valid number, using default: ${defaultValue}`);
            return defaultValue;
        }
    }
    else if (typeof defaultValue === 'boolean') {
        convertedValue = value.toLowerCase() === 'true';
    }
    else {
        convertedValue = value;
    }
    if (validator && !validator(convertedValue)) {
        console.warn(`⚠️ Warning: ${key} value "${value}" failed validation, using default: ${defaultValue}`);
        return defaultValue;
    }
    return convertedValue;
}
//# sourceMappingURL=validators.js.map