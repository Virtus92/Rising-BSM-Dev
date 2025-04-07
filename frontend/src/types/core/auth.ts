import { OperationOptions } from './shared';

/**
 * Authentication context for secure operations
 */
export interface AuthContext {
  userId: number;
  role: string;
  email: string;
  name: string;
  permissions?: string[];
}

/**
 * JWT Token Payload Structure
 */
export interface JwtPayload extends AuthContext {
  sub?: string;
  iat: number;
  exp: number;
}

/**
 * Authentication operation options with security context
 */
export interface SecureOperationOptions extends OperationOptions {
  authContext?: AuthContext;
}

/**
 * Authentication token response
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Authentication status
 */
export interface AuthStatus {
  authenticated: boolean;
  userId?: number;
  role?: string;
}

/**
 * Password reset request details
 */
export interface PasswordResetRequest {
  email: string;
  token: string;
  newPassword: string;
}

/**
 * User login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
