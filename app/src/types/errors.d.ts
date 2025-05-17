/**
 * Type definitions for error related interfaces
 */

// Basic error structure for authentication errors
export interface AuthError extends Error {
  type: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Authentication error types
export enum AuthErrorType {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  REFRESH_FAILED = 'REFRESH_FAILED'
}

// API error response structure
export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  error: {
    code: string;
    details?: Record<string, unknown>;
  };
  statusCode: number;
}

// Validation error object
export interface ValidationErrorObject {
  validationErrors: Record<string, string[]>;
  message: string;
}
