import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';

/**
 * ConfigValidator
 * 
 * Utility class to validate and diagnose configuration issues
 * related to CORS, networking, and URL schemes.
 */
export class ConfigValidator {
  constructor(private readonly logger: ILoggingService) {}

  /**
   * Run all validation checks
   */
  public validateAll(): void {
    this.logger.info('Starting configuration validation...');
    
    this.validateCorsConfig();
    this.validateNetworkConfig();
    this.validateApiPrefix();
    this.validateEnvironmentVariables();
    
    this.logger.info('Configuration validation complete.');
  }

  /**
   * Validate CORS configuration
   */
  private validateCorsConfig(): void {
    this.logger.info('Validating CORS configuration...');
    
    const corsEnabled = config.CORS_ENABLED;
    const corsOrigins = config.CORS_ORIGINS;
    
    // Check if CORS is enabled
    if (!corsEnabled) {
      this.logger.warn('CORS is disabled. This might cause issues with browser-based frontend applications.');
    }
    
    // Check if at least one origin is configured
    if (corsOrigins.length === 0) {
      this.logger.error('No CORS origins configured. This will block all cross-origin requests.');
    }
    
    // Check if frontEnd URL is in the allowed origins
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!corsOrigins.includes(frontendUrl)) {
      this.logger.warn(`Frontend URL ${frontendUrl} is not in the allowed CORS origins: ${corsOrigins.join(', ')}`);
      this.logger.info(`Consider adding ${frontendUrl} to your CORS_ORIGINS environment variable.`);
    }
    
    // Check for protocol mismatches
    const hasHttps = corsOrigins.some(origin => origin.startsWith('https://'));
    const hasHttp = corsOrigins.some(origin => origin.startsWith('http://') && !origin.startsWith('https://'));
    
    if (hasHttps && hasHttp) {
      this.logger.warn('Mixed HTTP/HTTPS origins detected. This might cause issues with secure contexts.');
    }
    
    // Check for wildcard origin which can be a security risk
    if (corsOrigins.includes('*')) {
      this.logger.warn('Wildcard CORS origin (*) detected. This is a security risk in production.');
    }
    
    this.logger.info('CORS validation complete.');
  }

  /**
   * Validate network configuration
   */
  private validateNetworkConfig(): void {
    this.logger.info('Validating network configuration...');
    
    // Check if the server is listening on the correct port
    const port = config.PORT;
    const host = config.HOST;
    
    this.logger.info(`Server configured to listen on ${host}:${port}`);
    
    // Check if server is listening on localhost which can cause issues in Docker
    if (host === 'localhost') {
      this.logger.warn('Server is configured to listen on localhost. This might cause issues in Docker environments.');
      this.logger.info('Consider using 0.0.0.0 to listen on all interfaces for Docker environments.');
    }
    
    // Check if port is already in use
    // This would require running a command to check, but we'll skip that for now
    
    this.logger.info('Network validation complete.');
  }

  /**
   * Validate API prefix
   */
  private validateApiPrefix(): void {
    this.logger.info('Validating API prefix...');
    
    const apiPrefix = config.API_PREFIX;
    
    // Check if API prefix starts with /
    if (!apiPrefix.startsWith('/')) {
      this.logger.error(`API prefix "${apiPrefix}" does not start with a slash (/). This will cause routing issues.`);
    }
    
    this.logger.info(`API configured with prefix: ${apiPrefix}`);
    this.logger.info('API prefix validation complete.');
  }

  /**
   * Validate environment variables
   */
  private validateEnvironmentVariables(): void {
    this.logger.info('Validating environment variables...');
    
    // Check if .env file exists
    const envPath = path.resolve(process.cwd(), '.env');
    const envExists = fs.existsSync(envPath);
    
    if (!envExists) {
      this.logger.warn('.env file not found. Environment variables may be missing.');
    }
    
    // Check for critical environment variables
    const criticalVars = [
      'NODE_ENV',
      'BACKEND_PORT',
      'BACKEND_HOST',
      'CORS_ORIGINS',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'DATABASE_URL'
    ];
    
    const missingVars = criticalVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.logger.warn(`Missing critical environment variables: ${missingVars.join(', ')}`);
    }
    
    // Check Docker-specific environment variables
    const isDocker = fs.existsSync('/.dockerenv');
    
    if (isDocker) {
      this.logger.info('Running in Docker environment.');
      
      // Check if DATABASE_URL is properly configured for Docker
      const dbUrl = process.env.DATABASE_URL || '';
      
      if (dbUrl.includes('localhost')) {
        this.logger.error('DATABASE_URL contains "localhost" which will not work correctly in Docker.');
        this.logger.info('Use the service name from docker-compose.yml instead (e.g., "db" instead of "localhost").');
      }
    }
    
    this.logger.info('Environment variables validation complete.');
  }

  /**
   * Print configuration summary
   */
  public printConfigSummary(): void {
    this.logger.info('Configuration Summary:');
    this.logger.info(`Environment: ${config.NODE_ENV}`);
    this.logger.info(`Server: ${config.HOST}:${config.PORT}`);
    this.logger.info(`API Prefix: ${config.API_PREFIX}`);
    this.logger.info(`CORS Enabled: ${config.CORS_ENABLED}`);
    this.logger.info(`CORS Origins: ${config.CORS_ORIGINS.join(', ')}`);
    this.logger.info(`Database: ${config.DB_HOST}:${config.DB_PORT}`);
  }
}

export default ConfigValidator;