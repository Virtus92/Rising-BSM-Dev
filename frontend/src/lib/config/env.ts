/**
 * Zentrale Konfiguration für Umgebungsvariablen
 * 
 * Diese Datei stellt eine einheitliche Schnittstelle für den Zugriff auf
 * Umgebungsvariablen bereit und lädt die Werte aus der .env-Datei im Root-Verzeichnis.
 */

// Definiere die Typen für die Konfiguration
interface EnvConfig {
  // Datenbank
  database: {
    url: string;
  };
  
  // Auth
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
  };
  
  // API Endpoints
  api: {
    url: string;
    backendUrl: string;
  };
  
  // Allgemeine Konfiguration
  app: {
    environment: 'development' | 'production' | 'test';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Funktion zum Abrufen von Umgebungsvariablen mit Fallback-Werten
function getEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

// Lade Umgebungsvariablen
export const env: EnvConfig = {
  database: {
    url: getEnvVar('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/rising_bsm'),
  },
  
  auth: {
    jwtSecret: getEnvVar('JWT_SECRET', 'your-default-super-secret-key-change-in-production'),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '15m'),
    jwtRefreshSecret: getEnvVar('JWT_REFRESH_SECRET', 'your-refresh-default-key-change-in-production'),
    jwtRefreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  
  api: {
    url: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'),
    backendUrl: getEnvVar('BACKEND_API_URL', 'http://localhost:3000/api'),
  },
  
  app: {
    environment: getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
    logLevel: getEnvVar('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
  },
};

// Exportiere einzelne Konfigurationswerte für einfacheren Zugriff
export const {
  database,
  auth,
  api,
  app,
} = env;

// Exportiere eine Funktion, um zu prüfen, ob die Umgebung Produktion ist
export const isProduction = (): boolean => app.environment === 'production';

// Exportiere eine Funktion, um zu prüfen, ob die Umgebung Entwicklung ist
export const isDevelopment = (): boolean => app.environment === 'development';

// Exportiere eine Funktion, um zu prüfen, ob die Umgebung Test ist
export const isTest = (): boolean => app.environment === 'test';
