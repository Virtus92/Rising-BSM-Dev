/**
 * Zentrale Konfiguration für Umgebungsvariablen
 */

interface EnvironmentConfig {
  // Server-Konfiguration
  NODE_ENV: string;
  PORT: number;
  
  // Datenbank-Konfiguration
  DATABASE_URL: string;
  
  // Auth-Konfiguration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // Logging-Konfiguration
  LOG_LEVEL: string;
  
  // API-Konfiguration
  API_BASE_URL: string;
  
  // Anwendungs-Konfiguration
  APP_URL: string;
  
  // CORS-Konfiguration
  CORS_ORIGIN: string;
  
  // Datei-Upload-Konfiguration
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
}

/**
 * Fallback-Werte für Umgebungsvariablen, die nicht gesetzt sind
 */
const defaults: EnvironmentConfig = {
  NODE_ENV: 'development',
  PORT: 3000,
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/rising_bsm',
  JWT_SECRET: 'your-default-secret-change-this-in-production',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  LOG_LEVEL: 'info',
  API_BASE_URL: '/api',
  APP_URL: 'http://localhost:3000',
  CORS_ORIGIN: '*',
  UPLOAD_DIR: './uploads',
  MAX_FILE_SIZE: 5 * 1024 * 1024 // 5MB
};

/**
 * Liest eine Umgebungsvariable und konvertiert sie in den entsprechenden Typ
 */
function getEnv<T>(key: keyof EnvironmentConfig, defaultValue: T): T {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  // Typkonvertierung basierend auf dem Typ des Standardwerts
  switch (typeof defaultValue) {
    case 'number':
      return Number(value) as unknown as T;
    case 'boolean':
      return (value.toLowerCase() === 'true') as unknown as T;
    default:
      return value as unknown as T;
  }
}

/**
 * Konfiguration für die aktuelle Umgebung
 */
export const env: EnvironmentConfig = {
  NODE_ENV: getEnv('NODE_ENV', defaults.NODE_ENV),
  PORT: getEnv('PORT', defaults.PORT),
  DATABASE_URL: getEnv('DATABASE_URL', defaults.DATABASE_URL),
  JWT_SECRET: getEnv('JWT_SECRET', defaults.JWT_SECRET),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', defaults.JWT_EXPIRES_IN),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', defaults.JWT_REFRESH_EXPIRES_IN),
  LOG_LEVEL: getEnv('LOG_LEVEL', defaults.LOG_LEVEL),
  API_BASE_URL: getEnv('API_BASE_URL', defaults.API_BASE_URL),
  APP_URL: getEnv('APP_URL', defaults.APP_URL),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', defaults.CORS_ORIGIN),
  UPLOAD_DIR: getEnv('UPLOAD_DIR', defaults.UPLOAD_DIR),
  MAX_FILE_SIZE: getEnv('MAX_FILE_SIZE', defaults.MAX_FILE_SIZE)
};

/**
 * Prüft, ob die Umgebung Produktion ist
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Prüft, ob die Umgebung Entwicklung ist
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Prüft, ob die Umgebung Test ist
 */
export const isTest = env.NODE_ENV === 'test';

export default env;
