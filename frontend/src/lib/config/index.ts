/**
 * Zentrale Konfiguration für Next.js
 */

// Umgebung
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';

// API-URLs (in Next.js)
export const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Auth-Konfiguration
export const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-key-in-production';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Datenbank-URL
export const DATABASE_URL = process.env.DATABASE_URL;

// Logger
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Standardwerte
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Konfiguration als Objekt
export default {
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  NEXT_PUBLIC_API_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  DATABASE_URL,
  LOG_LEVEL,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE
};
