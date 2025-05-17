/**
 * Error Type Definitions
 * 
 * This file defines the error types and interfaces used throughout the application.
 */

/**
 * Authentication Error Types
 */
export enum AuthErrorType {
  /**
   * Authentication is required but not provided
   */
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  
  /**
   * User does not have permission for the requested action
   */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  /**
   * Authentication token has expired
   */
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  /**
   * Authentication token is invalid
   */
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  /**
   * Invalid credentials provided (wrong username/password)
   */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  /**
   * User account is locked or disabled
   */
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  /**
   * User account is inactive
   */
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  
  /**
   * Session has been invalidated
   */
  SESSION_INVALID = 'SESSION_INVALID',
  
  /**
   * General unauthorized access
   */
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  /**
   * Token refresh failed
   */
  REFRESH_FAILED = 'REFRESH_FAILED',
  
  /**
   * Multi-factor authentication required
   */
  MFA_REQUIRED = 'MFA_REQUIRED'
}

/**
 * Authentication Error Interface
 */
export interface AuthError {
  /**
   * Error name
   */
  name: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Error type from AuthErrorType enum
   */
  type: AuthErrorType;
  
  /**
   * Optional error code for more specific error identification
   */
  code?: string;
  
  /**
   * HTTP status code associated with this error
   */
  status?: number;
  
  /**
   * Additional error details or metadata
   */
  details?: Record<string, any>;
}

/**
 * API Error Response Interface
 * Standardized error response format for API endpoints
 */
export interface ApiErrorResponse {
  /**
   * Indicates success status (always false for errors)
   */
  success: false;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Error details
   */
  error: {
    /**
     * Error code
     */
    code: string;
    
    /**
     * Additional error details
     */
    details?: Record<string, any>;
  };
  
  /**
   * Error timestamp
   */
  timestamp: string;
  
  /**
   * HTTP status code
   */
  statusCode?: number;
}
