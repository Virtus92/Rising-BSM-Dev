'use client';

import React from 'react';
import { AuthErrorType } from '@/types/types/auth';

interface AuthErrorDisplayProps {
  /**
   * Error object or message
   */
  error: Error | string | any;
  
  /**
   * Error type (optional, will be extracted from error if possible)
   */
  errorType?: AuthErrorType | string;
  
  /**
   * Error details (optional, will be extracted from error if possible)
   */
  details?: any;
  
  /**
   * Show stack trace in development mode
   */
  showStack?: boolean;
  
  /**
   * Show detailed error information
   */
  showDetails?: boolean;
  
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Extracts error type from error object
 */
function getErrorType(error: any): AuthErrorType | string {
  if (!error) return AuthErrorType.UNKNOWN;
  
  if (typeof error === 'string') {
    // Try to infer type from error message
    if (error.toLowerCase().includes('permission')) {
      return AuthErrorType.PERMISSION_DENIED;
    }
    if (error.toLowerCase().includes('token')) {
      return AuthErrorType.TOKEN_INVALID;
    }
    if (error.toLowerCase().includes('auth')) {
      return AuthErrorType.AUTH_FAILED;
    }
    return AuthErrorType.UNKNOWN;
  }
  
  // Extract from error object
  if (error.type) return error.type;
  if ((error).errorType) return (error).errorType;
  if ((error).code) return (error).code;
  
  // Check error message for keywords
  if (error.message) {
    const message = error.message.toLowerCase();
    if (message.includes('permission')) {
      return AuthErrorType.PERMISSION_DENIED;
    }
    if (message.includes('token')) {
      if (message.includes('expired')) {
        return AuthErrorType.TOKEN_EXPIRED;
      }
      if (message.includes('invalid')) {
        return AuthErrorType.TOKEN_INVALID;
      }
      if (message.includes('missing')) {
        return AuthErrorType.TOKEN_MISSING;
      }
      return AuthErrorType.TOKEN_INVALID;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return AuthErrorType.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return AuthErrorType.AUTH_TIMEOUT;
    }
    if (message.includes('authentication') || message.includes('login')) {
      return AuthErrorType.AUTH_FAILED;
    }
  }
  
  return AuthErrorType.UNKNOWN;
}

/**
 * Gets user-friendly error message based on error type
 */
function getFriendlyMessage(errorType: AuthErrorType | string): string {
  switch (errorType) {
    case AuthErrorType.TOKEN_MISSING:
      return 'Authentication token is missing. Please log in again.';
    case AuthErrorType.TOKEN_EXPIRED:
      return 'Your session has expired. Please log in again.';
    case AuthErrorType.TOKEN_INVALID:
      return 'Invalid authentication token. Please log in again.';
    case AuthErrorType.TOKEN_REFRESH_FAILED:
      return 'Failed to refresh your session. Please log in again.';
    case AuthErrorType.AUTH_REQUIRED:
      return 'Authentication is required to access this feature.';
    case AuthErrorType.AUTH_FAILED:
      return 'Authentication failed. Please check your credentials and try again.';
    case AuthErrorType.AUTH_TIMEOUT:
      return 'Authentication request timed out. Please try again.';
    case AuthErrorType.LOGIN_FAILED:
      return 'Login failed. Please check your credentials and try again.';
    case AuthErrorType.LOGOUT_FAILED:
      return 'Logout failed. You may need to clear your browser cookies.';
    case AuthErrorType.PERMISSION_DENIED:
      return 'You do not have permission to access this feature.';
    case AuthErrorType.PERMISSION_CHECK_FAILED:
      return 'Failed to check your permissions. Please try again.';
    case AuthErrorType.API_ERROR:
      return 'An API error occurred. Please try again later.';
    case AuthErrorType.NETWORK_ERROR:
      return 'Network error. Please check your internet connection.';
    case AuthErrorType.SERVER_ERROR:
      return 'A server error occurred. Please try again later.';
    default:
      return 'An error occurred. Please try again later.';
  }
}

/**
 * Gets error message from error object
 */
function getErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Unknown error';
}

/**
 * Extract error details from error object
 */
function getErrorDetails(error: any): any {
  if (!error) return null;
  
  if (error.details) return error.details;
  if ((error).errorDetails) return (error).errorDetails;
  
  // For standard errors, create details object
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  return null;
}

/**
 * Component to display authentication and permission errors
 */
export function AuthErrorDisplay({
  error,
  errorType: providedErrorType,
  details: providedDetails,
  showStack = true,
  showDetails = process.env.NODE_ENV === 'development',
  className = ''
}: AuthErrorDisplayProps) {
  // Extract error information
  const errorMessage = getErrorMessage(error);
  const errorType = providedErrorType || getErrorType(error);
  const details = providedDetails || getErrorDetails(error);
  const friendlyMessage = getFriendlyMessage(errorType);
  
  // Select background color based on error type
  let bgColor = 'bg-red-50';
  let borderColor = 'border-red-500';
  let textColor = 'text-red-700';
  
  if (errorType === AuthErrorType.PERMISSION_DENIED) {
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-500';
    textColor = 'text-orange-700';
  } else if (errorType === AuthErrorType.NETWORK_ERROR) {
    bgColor = 'bg-blue-50';
    borderColor = 'border-blue-500';
    textColor = 'text-blue-700';
  } else if (
    errorType === AuthErrorType.TOKEN_EXPIRED || 
    errorType === AuthErrorType.AUTH_TIMEOUT
  ) {
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-500';
    textColor = 'text-amber-700';
  }
  
  return (
    <div className={`p-4 my-4 border-l-4 ${borderColor} ${bgColor} ${textColor} ${className}`}>
      <div className="flex items-center">
        <svg 
          className="w-6 h-6 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="font-bold text-lg">{errorType}</p>
      </div>
      
      <p className="mt-2">{friendlyMessage}</p>
      
      <p className="mt-1 text-sm opacity-80">{errorMessage}</p>
      
      {showDetails && details && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">
            Technical Details
          </summary>
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            <pre>{JSON.stringify(details, null, 2)}</pre>
          </div>
        </details>
      )}
      
      {showStack && process.env.NODE_ENV === 'development' && error instanceof Error && error.stack && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">
            Stack Trace
          </summary>
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            <pre>{error.stack}</pre>
          </div>
        </details>
      )}
    </div>
  );
}

export default AuthErrorDisplay;