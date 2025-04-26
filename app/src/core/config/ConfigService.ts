/**
 * ConfigService - Provides access to application configuration
 * This service handles environment variables and application settings
 */

// Types for configuration
export interface ApiConfig {
  baseUrl: string;
  retries: number;
  timeout: number;
}

export interface SecurityConfig {
  jwtSecret: string;
  accessTokenExpiry: number; // seconds
  refreshTokenExpiry: number; // days
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSymbol: boolean;
}

export interface JwtConfig {
  secret: string;
  accessTokenExpiry: number; // seconds
  refreshTokenExpiry: number; // days
  audience: string;
  issuer: string;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamps: boolean;
}

/**
 * ConfigService singleton class
 * Provides access to application configuration
 */
class ConfigService {
  /**
   * Get a configuration value by key
   * @param key Configuration key
   * @returns Configuration value
   */
  get(key: string): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    return undefined;
  }
  
  /**
   * Get the current environment
   * @returns Environment name
   */
  getEnvironment(): string {
    if (typeof process !== 'undefined' && process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }
    return 'development';
  }
  
  /**
   * Check if the application is running in development mode
   * @returns true if running in development mode
   */
  isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }
  
  /**
   * Check if the application is running in production mode
   * @returns true if running in production mode
   */
  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }
  
  /**
   * Check if the application is running in test mode
   * @returns true if running in test mode
   */
  isTest(): boolean {
    return this.getEnvironment() === 'test';
  }
  
  /**
   * Get API configuration
   * @returns API configuration
   */
  getApiConfig(): ApiConfig {
    return {
      baseUrl: this.getApiBaseUrl(),
      retries: this.isDevelopment() ? 2 : 3,
      timeout: this.isDevelopment() ? 10000 : 30000
    };
  }
  
  /**
   * Get API base URL
   * @returns API base URL
   */
  private getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Browser environment
      return '/api';
    } else if (process.env.API_BASE_URL) {
      // Server environment with explicit API URL
      return process.env.API_BASE_URL;
    } else {
      // Default for server environment
      return '/api';
    }
  }
  
  /**
   * Get security configuration
   * @returns Security configuration
   */
  getSecurityConfig(): SecurityConfig {
    return {
      jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret',
      accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '900', 10), // 15 minutes in seconds
      refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '7', 10), // 7 days
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
      passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      passwordRequireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
      passwordRequireSymbol: process.env.PASSWORD_REQUIRE_SYMBOL !== 'false'
    };
  }
  
  /**
   * Get JWT configuration
   * @returns JWT configuration
   */
  getJwtConfig(): JwtConfig {
    return {
      secret: process.env.JWT_SECRET || 'development-jwt-secret',
      accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '900', 10), // 15 minutes in seconds
      refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '7', 10), // 7 days
      audience: process.env.JWT_AUDIENCE || 'rising-bsm-app',
      issuer: process.env.JWT_ISSUER || 'rising-bsm'
    };
  }
  
  /**
   * Get logging configuration
   * @returns Logging configuration
   */
  getLoggingConfig(): LoggingConfig {
    // Higher logging in development, less in production
    const defaultLevel = this.isDevelopment() ? 'debug' : 'info';
    
    return {
      level: (process.env.LOG_LEVEL || defaultLevel) as LoggingConfig['level'],
      includeTimestamps: process.env.LOG_TIMESTAMPS !== 'false'
    };
  }
}

// Export singleton instance
export const configService = new ConfigService();
export default configService;