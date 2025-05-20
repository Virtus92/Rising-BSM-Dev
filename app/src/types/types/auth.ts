/**
 * Authentication Type Definitions
 * 
 * This file defines the core authentication types used throughout the application.
 */

/**
 * Authentication Information
 * Contains information about the authenticated user and session
 */
export interface AuthInfo {
  /**
   * Authenticated user's ID
   */
  userId: number;
  
  /**
   * User's email address
   */
  email: string;
  
  /**
   * User's role in the system
   */
  role?: string;
  
  /**
   * User's name or display name
   */
  name?: string;
  
  /**
   * Token expiration timestamp
   */
  exp?: number;
  
  /**
   * Additional user permissions
   */
  permissions?: string[];
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  // Authentication errors
  INVALID_CREDENTIALS = 'invalid_credentials',
  INVALID_TOKEN = 'invalid_token',
  AUTH_REQUIRED = 'auth_required',
  AUTH_FAILED = 'auth_failed',
  AUTH_TIMEOUT = 'auth_timeout',
  LOGIN_FAILED = 'login_failed',
  LOGOUT_FAILED = 'logout_failed',
  
  // Token errors
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'invalid_token',
  TOKEN_MISSING = 'token_missing',
  REFRESH_FAILED = 'refresh_failed',
  TOKEN_REFRESH_FAILED = 'token_refresh_failed',
  TOKEN_VALIDATION_TIMEOUT = 'token_validation_timeout',
  TOKEN_VALIDATION_FAILED = 'token_validation_failed',
  TOKEN_UNAUTHORIZED = 'token_unauthorized',
  TOKEN_FORBIDDEN = 'token_forbidden',
  
  // User errors
  USER_NOT_FOUND = 'user_not_found',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_DISABLED = 'account_disabled',
  INVALID_REQUEST = 'invalid_request',
  INVALID_USER_ID = 'invalid_user_id',
  INVALID_PERMISSION = 'invalid_permission',
  
  // Permission errors
  PERMISSION_DENIED = 'permission_denied',
  PERMISSION_CHECK_FAILED = 'permission_check_failed',
  
  
  // Session errors
  SESSION_EXPIRED = 'session_expired',
  
  // Password errors
  INVALID_RESET_TOKEN = 'invalid_reset_token',
  PASSWORD_POLICY_VIOLATION = 'password_policy_violation',
  
  // System errors
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  DATABASE_ERROR = 'database_error',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  INTERNAL_ERROR = 'internal_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  UNKNOWN = 'unknown'
}

/**
 * Authentication error structure
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  status: number;
  details?: Record<string, any>;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  error?: string;
  details?: Record<string, any>;
}

/**
 * Extended request with auth information
 */
export type ExtendedRequest = Request & {
  auth?: AuthInfo;
};
