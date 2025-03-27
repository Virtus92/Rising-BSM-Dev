import { env } from './index.js';
import { ILoggingService, LogLevel } from '../interfaces/ILoggingService.js';

/**
 * Validates security-critical environment variables
 * 
 * @param logger - Logging service
 */
export function validateSecurityConfig(logger: ILoggingService): void {
  const IS_PRODUCTION = env<string>('NODE_ENV', 'development') === 'production';
  
  // Validate JWT secrets
  const JWT_SECRET = env<string>('JWT_SECRET', '');
  const JWT_REFRESH_SECRET = env<string>('JWT_REFRESH_SECRET', '');
  
  if (IS_PRODUCTION) {
    const insecureSecrets = [
      'your-super-secret-key-change-in-production',
      'your-refresh-secret-key-change-in-production',
      'your-super-secret-development-key',
      'your-super-secret-refresh-key'
    ];
    
    // Check JWT secret
    if (!JWT_SECRET || JWT_SECRET.length < 32 || insecureSecrets.includes(JWT_SECRET)) {
      const error = 'SECURITY RISK: JWT_SECRET is insecure or default in production environment!';
      logger.error(error);
      throw new Error(error);
    }
    
    // Check refresh token secret
    if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32 || insecureSecrets.includes(JWT_REFRESH_SECRET)) {
      const error = 'SECURITY RISK: JWT_REFRESH_SECRET is insecure or default in production environment!';
      logger.error(error);
      throw new Error(error);
    }
  } else {
    // In development, just warn
    if (JWT_SECRET.length < 32) {
      logger.warn('JWT_SECRET is shorter than recommended (32+ characters)');
    }
    
    if (JWT_REFRESH_SECRET.length < 32) {
      logger.warn('JWT_REFRESH_SECRET is shorter than recommended (32+ characters)');
    }
  }
}