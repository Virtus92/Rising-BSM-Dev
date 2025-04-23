/**
 * Error Handling Utilities
 * 
 * A collection of helper functions for consistent error handling.
 */

import { useToast } from '@/shared/hooks/useToast';
const { toast } = useToast();

/**
 * Interface for standardized API error responses
 */
export interface ApiErrorResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]> | string[];
}

/**
 * Handle any type of error with graceful fallbacks
 * 
 * @param error - Error to handle
 * @param defaultMessage - Default message if error can't be parsed
 * @returns User-friendly error message
 */
export function handleError(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (!error) {
    return defaultMessage;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  
  // Handle API error responses
  if (typeof error === 'object' && error !== null) {
    // Check for standard API error response
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    
    // Check for errors array/object
    if ('errors' in error) {
      const errors = (error as any).errors;
      
      // Handle array of error messages
      if (Array.isArray(errors)) {
        return errors.map(e => typeof e === 'string' ? e : JSON.stringify(e)).join(', ');
      }
      
      // Handle object with error messages
      if (typeof errors === 'object' && errors !== null) {
        return Object.values(errors)
          .flat()
          .map(e => typeof e === 'string' ? e : JSON.stringify(e))
          .join(', ');
      }
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Fallback
  try {
    return JSON.stringify(error) || defaultMessage;
  } catch (e) {
    return defaultMessage;
  }
}

/**
 * Display an error toast with a standardized format
 * 
 * @param error - Error to display
 * @param title - Optional title for the toast
 */
export function showErrorToast(error: unknown, title: string = 'Error') {
  const message = handleError(error);
  toast({
    title,
    description: message,
    variant: 'destructive'
  });
}

/**
 * Extract validation errors from an API response
 * 
 * @param error - API error response
 * @returns Validation errors as a Record<string, string>
 */
export function extractValidationErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Not an error object
  if (!error || typeof error !== 'object') {
    return result;
  }
  
  // Handle API error with validation errors
  if ('errors' in error) {
    const errors = (error as any).errors;
    
    // Handle object with field-specific errors
    if (typeof errors === 'object' && errors !== null && !Array.isArray(errors)) {
      Object.entries(errors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          result[field] = messages.join(', ');
        } else if (typeof messages === 'string') {
          result[field] = messages;
        }
      });
    }
    
    // Handle validationErrors property
    if ('validationErrors' in error && typeof (error as any).validationErrors === 'object') {
      const validationErrors = (error as any).validationErrors;
      
      Object.entries(validationErrors).forEach(([field, message]) => {
        result[field] = Array.isArray(message) ? message.join(', ') : String(message);
      });
    }
  }
  
  return result;
}

/**
 * Centralized error logging function
 * 
 * @param error - Error to log
 * @param context - Additional context information
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  // Log to console in development, could be replaced with proper logging service
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
  }
  
  // In production environment, we could send this to a logging service
  // An implementation could be added here in the future
}
