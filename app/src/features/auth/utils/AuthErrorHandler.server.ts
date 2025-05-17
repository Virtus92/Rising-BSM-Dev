/**
 * Authentication Error Handler (Server-side)
 * 
 * This is the server-side version of the AuthErrorHandler, designed to work in
 * Next.js server components and API routes without 'use client' directive.
 */

import { NextResponse } from 'next/server';
import { getLogger } from '@/core/logging';
import { formatResponse } from '@/core/errors';
import { AuthErrorType } from '@/types/types/auth';

// Re-export AuthErrorType for backward compatibility
export { AuthErrorType };

const logger = getLogger();

/**
 * Specialized error class for authentication-related errors
 */
export class AuthError extends Error {
  public type: AuthErrorType;
  public status: number;
  public code?: string;
  public details?: Record<string, any>;
  
  constructor(
    message: string,
    type: AuthErrorType = AuthErrorType.INVALID_TOKEN,
    status: number = 401,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.status = status;
    this.details = details;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthError.prototype);
  }
  
  /**
   * Creates a properly formatted response from this error
   */
  toResponse(): NextResponse {
    const detailsString = this.details ? 
      (typeof this.details === 'string' ? this.details : JSON.stringify(this.details)) : 
      '';
      
    return formatResponse.unauthorized(
      this.message,
      detailsString
    );
  }
}

/**
 * TokenError - Error related to token operations
 */
export class TokenError extends AuthError {
  constructor(
    message: string,
    type: AuthErrorType = AuthErrorType.INVALID_TOKEN,
    status: number = 401,
    details?: Record<string, any>
  ) {
    super(message, type, status, details);
    this.name = 'TokenError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TokenError.prototype);
  }
}

/**
 * PermissionError - Error related to permission operations
 */
export class PermissionError extends AuthError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, AuthErrorType.PERMISSION_DENIED, 403, details);
    this.name = 'PermissionError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

// Error handler class
class AuthErrorHandler {
  /**
   * Creates a standardized AuthError with details
   */
  createError(
    message: string,
    type: AuthErrorType,
    details?: Record<string, any> | string,
    status = 401
  ): AuthError {
    // Convert details to a record object if it's a string
    const detailsObj = typeof details === 'string' ? { message: details } : details;
    
    // Create a custom AuthError object with properties
    const error = new AuthError(message, type, status, detailsObj);
    
    // Log the error
    logger.error(`Auth error (${type}): ${message}`, {
      type,
      message,
      details: detailsObj,
      status
    });
    
    return error;
  }
  
  /**
   * Normalizes different error formats into a standard AuthError object
   * This method is used across the codebase to ensure consistent error handling
   */
  normalizeError(error: string | Error | AuthError | Record<string, any> | undefined): AuthError {
    if (!error) {
      return this.createError('Unknown error', AuthErrorType.INVALID_TOKEN);
    }
    
    // Already an AuthError, just return it
    if (error instanceof AuthError) {
      return error;
    }
    
    // Regular Error object, convert to AuthError
    if (error instanceof Error) {
      // Create a proper AuthError
      return new AuthError(
        error.message,
        (error as any).type as AuthErrorType || AuthErrorType.INVALID_TOKEN,
        (error as any).status as number || 401,
        { originalError: error.name, stack: error.stack }
      );
    }
    
    // String error
    if (typeof error === 'string') {
      return this.createError(error, AuthErrorType.INVALID_TOKEN);
    }
    
    // Object with type property
    if (typeof error === 'object') {
      if ('type' in error && error.type) {
        const errorType = error.type as AuthErrorType;
        const message = 'message' in error ? String(error.message) : `Authentication error: ${errorType}`;
        const status = 'status' in error ? Number(error.status) : 401;
        
        // Remove type, message, and status to avoid duplication in details
        const { type, message: msg, status: st, ...details } = error;
        
        return this.createError(message, errorType, details, status);
      }
      
      // Other object
      return this.createError(
        'message' in error ? String(error.message) : 'Unknown error',
        AuthErrorType.INVALID_TOKEN,
        error
      );
    }
    
    // Fallback
    return this.createError('Unknown error format', AuthErrorType.INVALID_TOKEN);
  }
  
  /**
   * Creates a permission-related error
   */
  createPermissionError(
    message: string,
    details?: Record<string, any>
  ): PermissionError {
    return new PermissionError(message, details);
  }
  
  /**
   * Creates a standardized NextResponse for auth errors
   */
  createErrorResponse(
    message: string,
    type: AuthErrorType,
    status = 401,
    details?: Record<string, any>
  ): NextResponse {
    // Create an AuthError and convert to response
    const error = this.createError(message, type, details, status);
    return error.toResponse();
  }
  
  /**
   * Checks if a user is authenticated and returns an error response if not
   */
  requireAuth(user: any): NextResponse | null {
    if (!user) {
      return this.createErrorResponse(
        'Authentication required',
        AuthErrorType.AUTH_REQUIRED,
        401
      );
    }
    
    return null;
  }
  
  /**
   * Checks if a user has the required role and returns an error response if not
   */
  requireRole(user: any, requiredRole: string | string[]): NextResponse | null {
    if (!user) {
      return this.createErrorResponse(
        'Authentication required',
        AuthErrorType.AUTH_REQUIRED,
        401
      );
    }
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!roles.includes(user.role)) {
      return this.createErrorResponse(
        'Insufficient permissions',
        AuthErrorType.PERMISSION_DENIED,
        403,
        {
          requiredRole: roles,
          userRole: user.role
        }
      );
    }
    
    return null;
  }
  
  /**
   * Converts error details to string format for API responses
   */
  formatErrorDetails(details?: Record<string, any> | string): string {
    if (!details) {
      return '';
    }
    
    if (typeof details === 'string') {
      return details;
    }
    
    try {
      return JSON.stringify(details);
    } catch (e) {
      return String(details);
    }
  }
}

// Create singleton instance
export const authErrorHandler = new AuthErrorHandler();

// Export the instance methods directly for compatibility
export const normalizeError = authErrorHandler.normalizeError.bind(authErrorHandler);
export const createError = authErrorHandler.createError.bind(authErrorHandler);
export const createErrorResponse = authErrorHandler.createErrorResponse.bind(authErrorHandler);
export const requireAuth = authErrorHandler.requireAuth.bind(authErrorHandler);
export const requireRole = authErrorHandler.requireRole.bind(authErrorHandler);
export const formatErrorDetails = authErrorHandler.formatErrorDetails.bind(authErrorHandler);

/**
 * Authentication error specific to user authentication failures
 */
export class AuthenticationError extends AuthError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, AuthErrorType.INVALID_CREDENTIALS, 401, details);
    this.name = 'AuthenticationError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Refresh error specific to token refresh failures
 */
export class RefreshError extends AuthError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, AuthErrorType.REFRESH_FAILED, 401, details);
    this.name = 'RefreshError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RefreshError.prototype);
  }
}

// Default export 
export default authErrorHandler;