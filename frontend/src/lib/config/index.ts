/**
 * Zentrale Konfiguration
 * 
 * Stellt Konfigurationswerte für die Anwendung bereit.
 */

// Umgebung
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';

// API-URLs
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000/api';

// Auth-Konfiguration
export const JWT_SECRET = process.env.JWT_SECRET || 'your-default-super-secret-key-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-default-key-change-in-production';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Datenbank-URL
export const DATABASE_URL = process.env.DATABASE_URL;

// Andere Konfigurationen
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Standardwerte für die Anwendung
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Konfiguration als Objekt exportieren
export default {
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
  API_URL,
  BACKEND_API_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  DATABASE_URL,
  LOG_LEVEL,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE
};
