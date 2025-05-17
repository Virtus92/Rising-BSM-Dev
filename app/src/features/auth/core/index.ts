/**
 * Core Authentication System Index
 * 
 * This file exports the main components of the authentication system
 * for use by other parts of the application.
 */

// Import and re-export auth service
import AuthServiceDefault, { AuthServiceClass } from './AuthService';

// Re-export service as both named export and default
export const AuthService = AuthServiceDefault;
export { AuthServiceClass };
export default AuthServiceDefault;

// Export token service
import { TokenService } from './services/TokenService';
export { TokenService };

// Export token validator for middleware and static access
import TokenValidator from '../utils/TokenValidator';
export { TokenValidator };

// Export error types
import { AuthError, TokenError } from '../utils/AuthErrorHandler';
export { AuthError, TokenError };

// Type exports from AuthService
export type { 
  AuthState, 
  UserInfo,
  TokenInfo,
  AuthInitOptions,
  TokenValidationResult,
  RefreshResult,
  DecodedToken
} from './AuthService';

// Export registration functionality
export {
  register,
  type RegisterData
} from './register';

// Export test components
export { default as AuthServiceTest } from './tests/AuthServiceTest';