/**
 * AuthErrorHandler.ts
 * 
 * Defines custom error types for authentication and token operations and
 * provides a central error handling mechanism for authentication errors.
 */

import { NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors/formatting/response-formatter';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Base error class for auth errors
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Error class for token-related errors
 */
export class TokenError extends AuthError {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

/**
 * Error class for refresh token errors
 */
export class RefreshError extends TokenError {
  constructor(message: string) {
    super(message);
    this.name = 'RefreshError';
  }
}

/**
 * Error class for validation errors
 */
export class ValidationError extends AuthError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error class for unauthorized access
 */
export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Types of authentication errors
 */
export enum AuthErrorType {
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  PERMISSION_CHECK_FAILED = 'PERMISSION_CHECK_FAILED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_INVALID = 'TOKEN_INVALID',
}

/**
 * Structure for a normalized error
 */
export interface NormalizedAuthError {
  message: string;
  type: AuthErrorType;
  status: number;
  details?: any;
  toResponse: () => NextResponse;
}

/**
 * Error handling utilities for authentication
 */
export const authErrorHandler = {
  /**
   * Create an auth error of a specific type
   */
  createError(message: string, type: AuthErrorType, details?: any): NormalizedAuthError {
    let status: number;
    
    // Map error types to HTTP status codes
    switch (type) {
      case AuthErrorType.INVALID_TOKEN:
      case AuthErrorType.TOKEN_EXPIRED:
      case AuthErrorType.UNAUTHORIZED:
        status = 401;
        break;
      case AuthErrorType.PERMISSION_DENIED:
        status = 403;
        break;
      case AuthErrorType.INVALID_REQUEST:
      case AuthErrorType.VALIDATION_ERROR:
        status = 400;
        break;
      case AuthErrorType.LOGIN_FAILED:
      case AuthErrorType.REGISTRATION_FAILED:
      case AuthErrorType.REFRESH_FAILED:
        status = 401;
        break;
      case AuthErrorType.SERVER_ERROR:
      default:
        status = 500;
        break;
    }
    
    return {
      message,
      type,
      status,
      details,
      toResponse: function() {
        return formatResponse.error(this.message, this.status, this.details);
      }
    };
  },
  
  /**
   * Normalize any error into a structured auth error
   */
  normalizeError(error: Error | any): NormalizedAuthError {
    // Already normalized error
    if (error && typeof error === 'object' && 'type' in error && 'status' in error) {
      return {
        ...error,
        toResponse: function() {
          return formatResponse.error(this.message, this.status, this.details);
        }
      };
    }
    
    let message = error instanceof Error ? error.message : String(error);
    let type = AuthErrorType.SERVER_ERROR;
    let status = 500;
    let details = undefined;
    
    // Map specific error types
    if (error instanceof TokenError) {
      type = AuthErrorType.INVALID_TOKEN;
      status = 401;
    } else if (error instanceof ValidationError) {
      type = AuthErrorType.VALIDATION_ERROR;
      status = 400;
    } else if (error instanceof UnauthorizedError) {
      type = AuthErrorType.UNAUTHORIZED;
      status = 401;
    } else if (error instanceof AuthError) {
      type = AuthErrorType.SERVER_ERROR;
      status = 500;
    }
    
    // Check for error messages that indicate specific types
    if (message.includes('token')) {
      if (message.includes('expired')) {
        type = AuthErrorType.TOKEN_EXPIRED;
        status = 401;
      } else if (message.includes('invalid') || message.includes('malformed')) {
        type = AuthErrorType.INVALID_TOKEN;
        status = 401;
      }
    } else if (message.includes('permission') || message.includes('forbidden')) {
      type = AuthErrorType.PERMISSION_DENIED;
      status = 403;
    } else if (message.includes('invalid request') || message.includes('validation')) {
      type = AuthErrorType.VALIDATION_ERROR;
      status = 400;
    } else if (message.includes('unauthorized') || message.includes('unauthenticated')) {
      type = AuthErrorType.UNAUTHORIZED;
      status = 401;
    }
    
    // Extract any details if available
    if (error && typeof error === 'object') {
      if ('details' in error) {
        details = error.details;
      } else if ('stack' in error) {
        // Only include stack in development
        if (process.env.NODE_ENV === 'development') {
          details = { stack: error.stack };
        }
      }
    }
    
    return {
      message,
      type,
      status,
      details,
      toResponse: function() {
        return formatResponse.error(this.message, this.status, this.details);
      }
    };
  },

  createPermissionError(message: string, details?: any): NormalizedAuthError {
    return this.createError(message, AuthErrorType.PERMISSION_DENIED, details);
  },
};

// Default export for backward compatibility
export default {
  AuthError,
  TokenError,
  RefreshError,
  ValidationError,
  UnauthorizedError,
  authErrorHandler
};