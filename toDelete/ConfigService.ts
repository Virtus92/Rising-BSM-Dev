/**
 * Service for managing environment-based configuration
 * Centralizes access to environment variables and configuration
 */
export interface JwtConfig {
  jwtSecret: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
  useTokenRotation: boolean;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
}

export interface AppConfig {
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  frontendUrl: string;
  api: ApiConfig;
  jwt: JwtConfig;
  database: DatabaseConfig;
  logging: LoggingConfig;
}

/**
 * Configuration service class
 * Provides centralized access to environment variables and configuration settings
 */
export class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    const environment = process.env.NODE_ENV || 'development';
    const isDevelopment = environment === 'development';
    const isProduction = environment === 'production';
    const isTest = environment === 'test';

    this.config = {
      environment,
      isDevelopment,
      isProduction,
      isTest,
      frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
        timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
        retries: parseInt(process.env.API_RETRIES || '3', 10)
      },
      jwt: {
        jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-please-change-in-production',
        accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '900', 10), // 15 minutes
        refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800', 10), // 7 days
        useTokenRotation: process.env.USE_TOKEN_ROTATION !== 'false'
      },
      database: {
        url: process.env.DATABASE_URL || '',
        maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
        connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000', 10)
      },
      logging: {
        level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
        enableConsole: process.env.LOG_CONSOLE !== 'false',
        enableFile: process.env.LOG_FILE === 'true',
        filePath: process.env.LOG_FILE_PATH || './logs/app.log'
      }
    };

    // Validate critical configuration
    if (isProduction && this.config.jwt.jwtSecret === 'default-jwt-secret-please-change-in-production') {
      console.warn('WARNING: Using default JWT secret in production environment!');
    }
  }

  /**
   * Get singleton instance
   * @returns ConfigService instance
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Get entire configuration
   * @returns Application configuration
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get environment
   * @returns Current environment
   */
  public getEnvironment(): string {
    return this.config.environment;
  }

  /**
   * Check if in development environment
   * @returns True if in development
   */
  public isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  /**
   * Check if in production environment
   * @returns True if in production
   */
  public isProduction(): boolean {
    return this.config.isProduction;
  }

  /**
   * Check if in test environment
   * @returns True if in test
   */
  public isTest(): boolean {
    return this.config.isTest;
  }

  /**
   * Get API configuration
   * @returns API configuration
   */
  public getApiConfig(): ApiConfig {
    return { ...this.config.api };
  }

  /**
   * Get JWT configuration
   * @returns JWT configuration
   */
  public getJwtConfig(): JwtConfig {
    return { ...this.config.jwt };
  }

  /**
   * Get database configuration
   * @returns Database configuration
   */
  public getDatabaseConfig(): DatabaseConfig {
    return { ...this.config.database };
  }

  /**
   * Get logging configuration
   * @returns Logging configuration
   */
  public getLoggingConfig(): LoggingConfig {
    return { ...this.config.logging };
  }

  /**
   * Get frontend URL
   * @returns Frontend URL
   */
  public getFrontendUrl(): string {
    return this.config.frontendUrl;
  }

  /**
   * Get environment variable
   * @param key Environment variable key
   * @param defaultValue Default value
   * @returns Environment variable value or default
   */
  public get(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }

  /**
   * Get environment variable as number
   * @param key Environment variable key
   * @param defaultValue Default value
   * @returns Environment variable value as number or default
   */
  public getNumber(key: string, defaultValue?: number): number | undefined {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  /**
   * Get environment variable as boolean
   * @param key Environment variable key
   * @param defaultValue Default value
   * @returns Environment variable value as boolean or default
   */
  public getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    const value = process.env[key];
    if (value === undefined) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();
export default configService;