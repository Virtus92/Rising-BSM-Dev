/**
 * Security module exports
 */

// Export API key utilities
export { ApiKeyGenerator } from './api-key-utils';

// Export password utilities
export { 
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateSecureString,
  createHash
} from './password-utils';

// Export password validation utilities
export {
  validatePasswordStrength,
  getPasswordValidationDetails,
  generateSecurePassword,
  DEFAULT_PASSWORD_CRITERIA
} from './validation/password-validation';

export type {
  PasswordCriteria,
  PasswordValidationDetails,
  PasswordGenerationOptions
} from './validation/password-validation';

// Export rate limiter
export { 
  SecurityRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  publicRateLimiter
} from './rate-limiter';

// Export API key rate limiting
export {
  ApiKeyRateLimiter,
  checkApiKeyRateLimit,
  createApiKeyRateLimitMiddleware,
  getRateLimiter
} from './rate-limiting';

export type {
  ApiKeyRateLimit,
  RateLimitResult
} from './rate-limiting';

// Export security monitoring
export { 
  securityMonitor,
  type SecurityEvent,
  type ThreatAnalysis
} from './monitoring';
