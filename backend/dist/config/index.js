"use strict";
/**
 * Application Configuration
 * Centralizes all environment variables and configuration settings
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHOW_STACK_TRACES = exports.CACHE_CHECK_PERIOD = exports.DEFAULT_CACHE_TTL = exports.CACHE_ENABLED = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.DATABASE_URL = exports.DB_SSL = exports.DB_PASSWORD = exports.DB_USER = exports.DB_NAME = exports.DB_PORT = exports.DB_HOST = exports.SESSION_MAX_AGE = exports.SESSION_SECRET = exports.VERIFY_JWT_USER_IN_DB = exports.JWT_REFRESH_TOKEN_ROTATION = exports.JWT_REFRESH_EXPIRES_IN = exports.JWT_REFRESH_SECRET = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = exports.AUTH_MODE = exports.CORS_ORIGINS = exports.CORS_ENABLED = exports.FRONTEND_URL = exports.API_PREFIX = exports.HOST = exports.PORT = exports.IS_TEST = exports.IS_DEVELOPMENT = exports.IS_PRODUCTION = exports.NODE_ENV = void 0;
// Load environment variables
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Environment validation helper
 * @param key Environment variable key
 * @param defaultValue Default value if not provided
 * @param validator Optional validation function
 */
function env(key, defaultValue, validator) {
    const value = process.env[key];
    if (value === undefined) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Warning: ${key} is not set in environment variables, using default: ${defaultValue}`);
        }
        return defaultValue;
    }
    // Attempt to convert the string value to the correct type based on defaultValue
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
    // Apply validator if provided
    if (validator && !validator(convertedValue)) {
        console.warn(`⚠️ Warning: ${key} value "${value}" failed validation, using default: ${defaultValue}`);
        return defaultValue;
    }
    return convertedValue;
}
// Node environment
exports.NODE_ENV = env('NODE_ENV', 'development');
exports.IS_PRODUCTION = exports.NODE_ENV === 'production';
exports.IS_DEVELOPMENT = exports.NODE_ENV === 'development';
exports.IS_TEST = exports.NODE_ENV === 'test';
// Server settings
exports.PORT = env('PORT', 5000);
exports.HOST = env('HOST', 'localhost');
exports.API_PREFIX = env('API_PREFIX', '/api');
exports.FRONTEND_URL = env('FRONTEND_URL', 'http://localhost:3000');
// Security settings
exports.CORS_ENABLED = env('CORS_ENABLED', true);
exports.CORS_ORIGINS = env('CORS_ORIGINS', exports.FRONTEND_URL)
    .split(',')
    .map(origin => origin.trim());
// Authentication settings
exports.AUTH_MODE = env('AUTH_MODE', 'jwt');
exports.JWT_SECRET = env('JWT_SECRET', 'your-default-super-secret-key-change-in-production');
exports.JWT_EXPIRES_IN = env('JWT_EXPIRES_IN', '1h');
exports.JWT_REFRESH_SECRET = env('JWT_REFRESH_SECRET', 'your-refresh-default-key-change-in-production');
exports.JWT_REFRESH_EXPIRES_IN = env('JWT_REFRESH_EXPIRES_IN', '7d');
exports.JWT_REFRESH_TOKEN_ROTATION = env('JWT_REFRESH_TOKEN_ROTATION', true);
exports.VERIFY_JWT_USER_IN_DB = env('VERIFY_JWT_USER_IN_DB', true);
exports.SESSION_SECRET = env('SESSION_SECRET', 'session-secret-change-in-production');
exports.SESSION_MAX_AGE = env('SESSION_MAX_AGE', 24 * 60 * 60 * 1000); // 1 day in ms
// Database settings
exports.DB_HOST = env('DB_HOST', 'localhost');
exports.DB_PORT = env('DB_PORT', 5432);
exports.DB_NAME = env('DB_DATABASE', 'rising_bsm');
exports.DB_USER = env('DB_USER', 'postgres');
exports.DB_PASSWORD = env('DB_PASSWORD', 'postgres');
exports.DB_SSL = env('DB_SSL', false);
exports.DATABASE_URL = env('DATABASE_URL', `postgresql://${exports.DB_USER}:${exports.DB_PASSWORD}@${exports.DB_HOST}:${exports.DB_PORT}/${exports.DB_NAME}`);
// Pagination defaults
exports.DEFAULT_PAGE_SIZE = env('DEFAULT_PAGE_SIZE', 20);
exports.MAX_PAGE_SIZE = env('MAX_PAGE_SIZE', 100);
// Cache settings
exports.CACHE_ENABLED = env('CACHE_ENABLED', true);
exports.DEFAULT_CACHE_TTL = env('DEFAULT_CACHE_TTL', 300); // 5 minutes
exports.CACHE_CHECK_PERIOD = env('CACHE_CHECK_PERIOD', 60 * 1000); // 1 minute
// Error settings
exports.SHOW_STACK_TRACES = env('SHOW_STACK_TRACES', !exports.IS_PRODUCTION);
// Export all configurations as a single object
exports.default = {
    NODE_ENV: exports.NODE_ENV,
    IS_PRODUCTION: exports.IS_PRODUCTION,
    IS_DEVELOPMENT: exports.IS_DEVELOPMENT,
    IS_TEST: exports.IS_TEST,
    PORT: exports.PORT,
    HOST: exports.HOST,
    API_PREFIX: exports.API_PREFIX,
    FRONTEND_URL: exports.FRONTEND_URL,
    CORS_ENABLED: exports.CORS_ENABLED,
    CORS_ORIGINS: exports.CORS_ORIGINS,
    AUTH_MODE: exports.AUTH_MODE,
    JWT_SECRET: exports.JWT_SECRET,
    JWT_EXPIRES_IN: exports.JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET: exports.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: exports.JWT_REFRESH_EXPIRES_IN,
    JWT_REFRESH_TOKEN_ROTATION: exports.JWT_REFRESH_TOKEN_ROTATION,
    VERIFY_JWT_USER_IN_DB: exports.VERIFY_JWT_USER_IN_DB,
    SESSION_SECRET: exports.SESSION_SECRET,
    SESSION_MAX_AGE: exports.SESSION_MAX_AGE,
    DB_HOST: exports.DB_HOST,
    DB_PORT: exports.DB_PORT,
    DB_NAME: exports.DB_NAME,
    DB_USER: exports.DB_USER,
    DB_PASSWORD: exports.DB_PASSWORD,
    DB_SSL: exports.DB_SSL,
    DATABASE_URL: exports.DATABASE_URL,
    DEFAULT_PAGE_SIZE: exports.DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE: exports.MAX_PAGE_SIZE,
    CACHE_ENABLED: exports.CACHE_ENABLED,
    DEFAULT_CACHE_TTL: exports.DEFAULT_CACHE_TTL,
    CACHE_CHECK_PERIOD: exports.CACHE_CHECK_PERIOD,
    SHOW_STACK_TRACES: exports.SHOW_STACK_TRACES
};
//# sourceMappingURL=index.js.map