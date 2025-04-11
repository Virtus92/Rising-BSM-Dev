'use client';

import { getLogger } from '../logging';

/**
 * Security configuration manager
 * Handles security-related configuration and validation
 */
export class SecurityConfig {
  private static instance: SecurityConfig;
  private jwtSecret: string | null = null;
  private initialized = false;
  private logger = getLogger();

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SecurityConfig {
    if (!SecurityConfig.instance) {
      SecurityConfig.instance = new SecurityConfig();
    }
    return SecurityConfig.instance;
  }

  /**
   * Initialize security configuration
   * Must be called before using security features
   * @returns True if initialization succeeded
   */
  public initialize(): boolean {
    if (this.initialized) {
      return true;
    }

    try {
      // Get JWT secret from environment
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        // In development, log a warning but continue with a default
        const devDefault = 'default-secret-change-me';
        this.logger.warn(
          'JWT_SECRET not found in environment variables. ' +
          'Using default secret for development. ' +
          'THIS IS NOT SECURE FOR PRODUCTION!'
        );
        this.jwtSecret = devDefault;
      } else {
        this.jwtSecret = secret;
        this.logger.info('JWT security configuration loaded successfully.');
      }

      this.initialized = true;
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize security configuration', { error });
      return false;
    }
  }

  /**
   * Get JWT secret for token signing/verification
   * @throws Error if JWT secret is not configured
   */
  public getJwtSecret(): string {
    if (!this.initialized) {
      const initialized = this.initialize();
      if (!initialized) {
        throw new Error('Security configuration not initialized');
      }
    }

    if (!this.jwtSecret) {
      // Fall back to default in development
      if (process.env.NODE_ENV !== 'production') {
        return 'default-secret-change-me';
      }
      throw new Error('JWT_SECRET not configured properly');
    }

    return this.jwtSecret;
  }

  /**
   * Check if JWT secret is properly configured
   */
  public isJwtSecretConfigured(): boolean {
    if (!this.initialized) {
      this.initialize();
    }
    
    // In development, always return true
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    
    return !!this.jwtSecret && this.jwtSecret !== 'default-secret-change-me';
  }

  /**
   * Get JWT token options for signing
   */
  public getJwtOptions() {
    return {
      // Standard JWT options
      expiresIn: process.env.ACCESS_TOKEN_LIFETIME || '24h',  // 24 hour default for backward compatibility
      issuer: 'rising-bsm',
      audience: process.env.JWT_AUDIENCE || 'rising-bsm-app',
    };
  }

  /**
   * Get JWT verification options for token validation
   */
  public getJwtVerifyOptions() {
    // For backward compatibility, don't require any claims by default
    return {};
  }
  
  /**
   * Get access token lifetime in seconds
   */
  public getAccessTokenLifetime(): number {
    const lifetimeStr = process.env.ACCESS_TOKEN_LIFETIME || '24h';
    
    if (lifetimeStr.endsWith('h')) {
      const hours = parseInt(lifetimeStr.slice(0, -1), 10);
      return hours * 60 * 60;
    } else if (lifetimeStr.endsWith('m')) {
      const minutes = parseInt(lifetimeStr.slice(0, -1), 10);
      return minutes * 60;
    } else if (lifetimeStr.endsWith('d')) {
      const days = parseInt(lifetimeStr.slice(0, -1), 10);
      return days * 24 * 60 * 60;
    } else {
      return 24 * 60 * 60; // Default to 24 hours
    }
  }
  
  /**
   * Get refresh token lifetime in seconds
   */
  public getRefreshTokenLifetime(): number {
    const lifetimeStr = process.env.REFRESH_TOKEN_LIFETIME || '30d';
    
    if (lifetimeStr.endsWith('h')) {
      const hours = parseInt(lifetimeStr.slice(0, -1), 10);
      return hours * 60 * 60;
    } else if (lifetimeStr.endsWith('m')) {
      const minutes = parseInt(lifetimeStr.slice(0, -1), 10);
      return minutes * 60;
    } else if (lifetimeStr.endsWith('d')) {
      const days = parseInt(lifetimeStr.slice(0, -1), 10);
      return days * 24 * 60 * 60;
    } else {
      return 30 * 24 * 60 * 60; // Default to 30 days
    }
  }
}

// Export singleton instance for simpler imports
export const securityConfig = SecurityConfig.getInstance();
export default securityConfig;
