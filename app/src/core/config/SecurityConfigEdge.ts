/**
 * Edge-compatible security configuration 
 * Simplified version for middleware that doesn't rely on Node.js features
 */

/**
 * Security configuration for Edge Runtime
 * Handles security-related configuration without dependencies
 */
export class SecurityConfigEdge {
  private static instance: SecurityConfigEdge;
  private jwtSecret: string | null = null;
  private initialized = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SecurityConfigEdge {
    if (!SecurityConfigEdge.instance) {
      SecurityConfigEdge.instance = new SecurityConfigEdge();
    }
    return SecurityConfigEdge.instance;
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
        // In development, use a default
        const devDefault = 'default-secret-change-me';
        console.warn(
          'JWT_SECRET not found in environment variables. ' +
          'Using default secret for development. ' +
          'THIS IS NOT SECURE FOR PRODUCTION!'
        );
        this.jwtSecret = devDefault;
      } else {
        this.jwtSecret = secret;
        console.log('JWT security configuration loaded successfully.');
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize security configuration', error as Error);
      return false;
    }
  }

  /**
   * Get JWT secret for token verification
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
   * Get JWT verification options for token validation
   */
  public getJwtVerifyOptions() {
    return {
      issuer: 'rising-bsm',
      audience: process.env.JWT_AUDIENCE || 'rising-bsm-app',
    };
  }
}

// Export singleton instance for simpler imports
export const securityConfigEdge = SecurityConfigEdge.getInstance();
export default securityConfigEdge;