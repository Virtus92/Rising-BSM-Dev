/**
 * Error type definitions for Rising-BSM application
 * Centralizes error handling types across the application
 */

/**
 * Base Application Error
 * Used throughout the application for consistent error handling
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROLE_REQUIRED = 'ROLE_REQUIRED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_DISABLED = 'USER_DISABLED',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  ALREADY_AUTHENTICATED = 'ALREADY_AUTHENTICATED',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED'
}

/**
 * Auth error interface
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

/**
 * API error response interface
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: Record<string, any>;
    type?: string;
  };
  statusCode?: number;
}

/**
 * Authentication error factory
 */
export function createAuthError(
  type: AuthErrorType,
  message: string,
  details?: Record<string, any>,
  status?: number
): AuthError {
  return {
    type,
    message,
    status: status || getDefaultStatusForAuthErrorType(type),
    details
  };
}

/**
 * Maps auth error types to default HTTP status codes
 */
function getDefaultStatusForAuthErrorType(type: AuthErrorType): number {
  switch (type) {
    case AuthErrorType.AUTH_REQUIRED:
    case AuthErrorType.INVALID_CREDENTIALS:
    case AuthErrorType.INVALID_TOKEN:
    case AuthErrorType.TOKEN_EXPIRED:
    case AuthErrorType.NOT_AUTHENTICATED:
      return 401; // Unauthorized
    case AuthErrorType.PERMISSION_DENIED:
    case AuthErrorType.ROLE_REQUIRED:
      return 403; // Forbidden
    case AuthErrorType.USER_NOT_FOUND:
      return 404; // Not Found
    case AuthErrorType.USER_DISABLED:
      return 403; // Forbidden
    case AuthErrorType.REGISTRATION_FAILED:
    case AuthErrorType.TOKEN_REFRESH_FAILED:
      return 400; // Bad Request
    case AuthErrorType.ALREADY_AUTHENTICATED:
      return 409; // Conflict
    default:
      return 500; // Internal Server Error
  }
}
