import { z } from 'zod';

/**
 * Schema-Definition für Umgebungsvariablen mit Validierung
 */
const envSchema = z.object({
  // Datenbank
  DATABASE_URL: z.string().url().nonempty(),
  
  // JWT
  JWT_SECRET: z.string().min(32).default('fallback-development-secret-only-use-in-development'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // CORS
  CORS_ORIGINS: z.string().default('*'),
  
  // App
  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_PORT: z.coerce.number().default(3000),
  
  // Rate-Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  
  // File Storage
  UPLOAD_DIRECTORY: z.string().default('uploads'),
  MAX_UPLOAD_SIZE: z.coerce.number().default(5 * 1024 * 1024), // 5MB
  
  // Cache
  DEFAULT_CACHE_TIME: z.coerce.number().default(60), // 60 Sekunden
  
  // Secure Cookies
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  
  // API
  API_RATE_LIMIT: z.coerce.number().default(100),
  
  // Maintenance
  MAINTENANCE_MODE: z.coerce.boolean().default(false),
});

// Funktionstyp für typisierte Umgebungsvariablen
export type EnvConfig = z.infer<typeof envSchema>;

// Konfiguration mit Validierung laden
function loadEnvConfig(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Fehlerhafte Umgebungsvariablen:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Exportiere validierte Konfiguration
export const env = loadEnvConfig();

/**
 * Umgebungsbezogene Konfiguration
 */
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
  },
  
  // API
  api: {
    rateLimit: {
      max: env.RATE_LIMIT_MAX,
      windowMs: env.RATE_LIMIT_WINDOW_MS
    },
    cors: {
      origins: env.CORS_ORIGINS
    }
  },
  
  // Cookies
  cookies: {
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: {
      session: 24 * 60 * 60, // 1 Tag
      persistent: 7 * 24 * 60 * 60 // 7 Tage
    }
  },
  
  // Cache
  cache: {
    defaultMaxAge: env.DEFAULT_CACHE_TIME,
  },
  
  // Upload
  upload: {
    directory: env.UPLOAD_DIRECTORY,
    maxSize: env.MAX_UPLOAD_SIZE,
    allowedTypes: {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }
  },
  
  // Feature-Flags
  features: {
    maintenanceMode: env.MAINTENANCE_MODE
  }
};
