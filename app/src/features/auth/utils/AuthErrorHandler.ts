/**
 * Authentication Error Handler
 * 
 * Provides centralized error handling for authentication and permissions errors
 * with standardized error reporting instead of fallbacks
 */
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Authentication error types
 */
export enum AuthErrorType {
  // Token errors
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_FAILED = 'AUTH_FAILED',
  AUTH_TIMEOUT = 'AUTH_TIMEOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT_FAILED = 'LOGOUT_FAILED',
  
  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_CHECK_FAILED = 'PERMISSION_CHECK_FAILED',
  
  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Other errors
  UNKNOWN = 'UNKNOWN'
}

/**
 * Detailed authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly type: AuthErrorType,
    public readonly details?: any,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Context for error handling
 */
interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: number;
  path?: string;
  [key: string]: any;
}

/**
 * Authentication Error Handler
 * A centralized service for handling authentication errors
 */
class AuthErrorHandler {
  /**
   * Create a structured authentication error
   * 
   * @param message Error message
   * @param type Error type
   * @param details Additional error details
   * @param statusCode HTTP status code
   * @returns AuthError instance
   */
  createError(
    message: string,
    type: AuthErrorType = AuthErrorType.UNKNOWN,
    details?: any,
    statusCode: number = 401
  ): AuthError {
    return new AuthError(message, type, details, statusCode);
  }
  
  /**
   * Handle authentication error with logging
   * 
   * @param error Error object
   * @param context Error context
   * @throws The original error
   */
  handleError(error: unknown, context: ErrorContext = {}): never {
    // Convert to AuthError if it's not already
    const authError = this.normalizeError(error, context);
    
    // Log the error with context
    this.logError(authError, context);
    
    // Always throw the error - no fallbacks or silent handling
    throw authError;
  }
  
  /**
   * Log authentication error with context
   * 
   * @param error Error object
   * @param context Error context
   */
  logError(error: AuthError, context: ErrorContext = {}): void {
    logger.error(`Auth Error [${error.type}]: ${error.message}`, {
      error: {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack
      },
      context
    });
  }
  
  /**
   * Convert any error to an AuthError
   * 
   * @param error Error object
   * @param context Error context
   * @returns AuthError instance
   */
  normalizeError(error: unknown, context: ErrorContext = {}): AuthError {
    // If it's already an AuthError, return it
    if (error instanceof AuthError) {
      return error;
    }
    
    // Process Error objects
    if (error instanceof Error) {
      // Determine error type from message
      let errorType = AuthErrorType.UNKNOWN;
      let statusCode = 401;
      
      if (error.message.includes('token') || error.message.includes('jwt')) {
        if (error.message.includes('expired')) {
          errorType = AuthErrorType.TOKEN_EXPIRED;
        } else if (error.message.includes('invalid')) {
          errorType = AuthErrorType.TOKEN_INVALID;
        } else if (error.message.includes('missing')) {
          errorType = AuthErrorType.TOKEN_MISSING;
        } else if (error.message.includes('refresh')) {
          errorType = AuthErrorType.TOKEN_REFRESH_FAILED;
        }
      } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
        errorType = AuthErrorType.PERMISSION_DENIED;
        statusCode = 403;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorType = AuthErrorType.NETWORK_ERROR;
        statusCode = 0; // Network error has no HTTP status
      } else if (error.message.includes('server') && error.message.includes('error')) {
        errorType = AuthErrorType.SERVER_ERROR;
        statusCode = 500;
      }
      
      // Extract status code if available
      if ((error as any).statusCode) {
        statusCode = (error as any).statusCode;
      }
      
      // Create AuthError from Error
      return new AuthError(
        error.message,
        errorType,
        {
          originalError: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          context
        },
        statusCode
      );
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return new AuthError(error, AuthErrorType.UNKNOWN, { context });
    }
    
    // Handle unknown errors
    return new AuthError(
      'Unknown authentication error',
      AuthErrorType.UNKNOWN,
      { originalError: error, context }
    );
  }
  
  /**
   * Create token error
   * 
   * @param message Error message
   * @param type Error type
   * @param details Additional details
   * @returns AuthError instance
   */
  createTokenError(
    message: string,
    type: AuthErrorType = AuthErrorType.TOKEN_INVALID,
    details?: any
  ): AuthError {
    return new AuthError(message, type, details, 401);
  }
  
  /**
   * Create permission error
   * 
   * @param message Error message
   * @param details Additional details
   * @returns AuthError instance
   */
  createPermissionError(
    message: string,
    details?: any
  ): AuthError {
    return new AuthError(message, AuthErrorType.PERMISSION_DENIED, details, 403);
  }
}

// Export singleton instance
export const authErrorHandler = new AuthErrorHandler();
export default authErrorHandler;
