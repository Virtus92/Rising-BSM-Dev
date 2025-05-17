/**
 * Security Configuration
 * Provides security-related configuration settings
 */

export class SecurityConfig {
  private readonly _jwtSecret: string;
  private readonly _jwtAudience: string;
  private readonly _jwtIssuer: string;
  private readonly _bcryptRounds: number;
  private readonly _accessTokenLifetime: number;
  private readonly _refreshTokenLifetime: number;
  
  constructor() {
    this._jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this._jwtAudience = process.env.JWT_AUDIENCE || 'rising-bsm-app';
    this._jwtIssuer = process.env.JWT_ISSUER || 'rising-bsm';
    this._bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    this._accessTokenLifetime = parseInt(process.env.ACCESS_TOKEN_LIFETIME || '900', 10); // 15 minutes default
    this._refreshTokenLifetime = parseInt(process.env.REFRESH_TOKEN_LIFETIME || '2592000', 10); // 30 days default
  }
  
  /**
   * Get JWT secret
   */
  getJwtSecret(): string {
    return this._jwtSecret;
  }
  
  /**
   * Get JWT audience
   */
  getJwtAudience(): string {
    return this._jwtAudience;
  }
  
  /**
   * Get JWT issuer
   */
  getJwtIssuer(): string {
    return this._jwtIssuer;
  }
  
  /**
   * Get bcrypt rounds
   */
  getBcryptRounds(): number {
    return this._bcryptRounds;
  }
  
  /**
   * Get access token lifetime in seconds
   */
  getAccessTokenLifetime(): number {
    return this._accessTokenLifetime;
  }
  
  /**
   * Get refresh token lifetime in seconds
   */
  getRefreshTokenLifetime(): number {
    return this._refreshTokenLifetime;
  }
  
  /**
   * Get session cookie options
   */
  getSessionCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };
  }
  
  /**
   * Get CORS configuration
   */
  getCorsConfiguration() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    return {
      origin: allowedOrigins,
      credentials: true,
      optionsSuccessStatus: 200,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    };
  }
  
  /**
   * Get rate limiting configuration
   */
  getRateLimitConfiguration() {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    };
  }
  
  /**
   * Validate environment configuration
   */
  validateConfiguration(): boolean {
    const required = ['JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn(`Missing required security configuration: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export const securityConfig = new SecurityConfig();
