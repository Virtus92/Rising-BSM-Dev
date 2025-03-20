/**
 * Application Configuration
 * Centralizes all environment variables and configuration settings for the API
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

/**
 * Environment validation helper
 * @param key Environment variable key
 * @param defaultValue Default value if not provided
 * @param validator Optional validation function
 */
function env<T>(
  key: string, 
  defaultValue: T, 
  validator?: (value: any) => boolean
): T {
  const value = process.env[key];
  
  if (value === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Warning: ${key} is not set in environment variables, using default: ${defaultValue}`);
    }
    return defaultValue;
  }
  
  // Attempt to convert the string value to the correct type based on defaultValue
  let convertedValue: any;
  
  if (typeof defaultValue === 'number') {
    convertedValue = Number(value);
    if (isNaN(convertedValue)) {
      console.warn(`⚠️ Warning: ${key} value "${value}" is not a valid number, using default: ${defaultValue}`);
      return defaultValue;
    }
  } else if (typeof defaultValue === 'boolean') {
    convertedValue = value.toLowerCase() === 'true';
  } else {
    convertedValue = value;
  }
  
  // Apply validator if provided
  if (validator && !validator(convertedValue)) {
    console.warn(`⚠️ Warning: ${key} value "${value}" failed validation, using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return convertedValue as T;
}

// Node environment
export const NODE_ENV = env<string>('NODE_ENV', 'development');
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';

// Server settings
export const PORT = env<number>('PORT', 5000);
export const HOST = env<string>('HOST', 'localhost');
export const API_PREFIX = env<string>('API_PREFIX', '/api/v1');

// Security settings
export const CORS_ENABLED = env<boolean>('CORS_ENABLED', true);
export const CORS_ORIGINS = env<string>('CORS_ORIGINS', 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

// Authentication settings
export const JWT_SECRET = env<string>('JWT_SECRET', 'your-default-super-secret-key-change-in-production');
export const JWT_EXPIRES_IN = env<string>('JWT_EXPIRES_IN', '1h');
export const JWT_REFRESH_SECRET = env<string>('JWT_REFRESH_SECRET', 'your-refresh-default-key-change-in-production');
export const JWT_REFRESH_EXPIRES_IN = env<string>('JWT_REFRESH_EXPIRES_IN', '7d');
export const JWT_REFRESH_TOKEN_ROTATION = env<boolean>('JWT_REFRESH_TOKEN_ROTATION', true);
export const VERIFY_JWT_USER_IN_DB = env<boolean>('VERIFY_JWT_USER_IN_DB', true);

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = env<number>('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000); // 15 minutes
export const RATE_LIMIT_MAX = env<number>('RATE_LIMIT_MAX', 100);
export const RATE_LIMIT_STANDARDIZE = env<boolean>('RATE_LIMIT_STANDARDIZE', true);
 
// Database settings
export const DB_HOST = env<string>('DB_HOST', 'localhost');
export const DB_PORT = env<number>('DB_PORT', 5432);
export const DB_NAME = env<string>('DB_DATABASE', 'rising_bsm');
export const DB_USER = env<string>('DB_USER', 'postgres');
export const DB_PASSWORD = env<string>('DB_PASSWORD', 'postgres');
export const DB_SSL = env<boolean>('DB_SSL', false);
export const DATABASE_URL = env<string>(
  'DATABASE_URL', 
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
);

// Pagination defaults
export const DEFAULT_PAGE_SIZE = env<number>('DEFAULT_PAGE_SIZE', 20);
export const MAX_PAGE_SIZE = env<number>('MAX_PAGE_SIZE', 100);

// Cache settings
export const CACHE_ENABLED = env<boolean>('CACHE_ENABLED', true);
export const DEFAULT_CACHE_TTL = env<number>('DEFAULT_CACHE_TTL', 300); // 5 minutes
export const CACHE_CHECK_PERIOD = env<number>('CACHE_CHECK_PERIOD', 60 * 1000); // 1 minute

// Uploads
export const UPLOAD_DIR = env<string>('UPLOAD_DIR', 'uploads');
export const MAX_FILE_SIZE = env<number>('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// Error settings
export const SHOW_STACK_TRACES = env<boolean>('SHOW_STACK_TRACES', !IS_PRODUCTION);

// Log level
export const LOG_LEVEL = env<string>('LOG_LEVEL', IS_PRODUCTION ? 'info' : 'debug');
export const LOG_FORMAT = env<string>('LOG_FORMAT', 'combined');

// Export all configurations as a single object
export default {
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  PORT,
  HOST,
  API_PREFIX,
  CORS_ENABLED,
  CORS_ORIGINS,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  JWT_REFRESH_TOKEN_ROTATION,
  VERIFY_JWT_USER_IN_DB,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_STANDARDIZE,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL,
  DATABASE_URL,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  CACHE_ENABLED,
  DEFAULT_CACHE_TTL,
  CACHE_CHECK_PERIOD,
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  SHOW_STACK_TRACES,
  LOG_LEVEL,
  LOG_FORMAT
};