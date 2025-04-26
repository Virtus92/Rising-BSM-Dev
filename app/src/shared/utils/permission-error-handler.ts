/**
 * Permission Error Handler Utility
 * 
 * Provides standardized error handling for permission-related errors across the application.
 */
import { NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * Formats a permission denied error message
 * 
 * @param permission - Permission code that was required
 * @param userId - User ID that was denied
 * @returns Formatted error message
 */
export function formatPermissionDeniedMessage(
  permission: SystemPermission | string | (SystemPermission | string)[],
  userId?: number
): string {
  const logger = getLogger();
  
  try {
    // For a single permission
    if (typeof permission === 'string') {
      return `You don't have permission to perform this action (requires ${permission})`;
    }
    
    // For multiple permissions
    if (Array.isArray(permission)) {
      if (permission.length === 0) {
        return 'Permission denied';
      }
      
      if (permission.length === 1) {
        return formatPermissionDeniedMessage(permission[0], userId);
      }
      
      return `You don't have permission to perform this action (requires [${permission.join(', ')}])`;
    }
    
    // Default message if something went wrong
    return 'You lack the necessary permissions to perform this action';
  } catch (error) {
    // Log but return a safe default message
    logger.error('Error formatting permission denied message:', { error, permission, userId });
    return 'Permission denied';
  }
}

/**
 * Creates a permission denied response
 * 
 * @param permission - Permission code that was required
 * @param userId - User ID that was denied
 * @returns Formatted NextResponse with error
 */
export function createPermissionDeniedResponse(
  permission: SystemPermission | string | (SystemPermission | string)[],
  userId?: number
): NextResponse {
  const logger = getLogger();
  
  try {
    const message = formatPermissionDeniedMessage(permission, userId);
    logger.warn(`Permission denied: User ${userId} does not have permission ${Array.isArray(permission) ? JSON.stringify(permission) : permission}`);
    return formatResponse.error(message, 403);
  } catch (error) {
    // Log but return a safe default response
    logger.error('Error creating permission denied response:', { error, permission, userId });
    return formatResponse.error('Permission denied', 403);
  }
}

/**
 * Permission error handler for use in UI components and hooks
 */
export const permissionErrorHandler = {
  /**
   * Handles a permission error in the UI
   * 
   * @param error - Error object
   * @param toast - Toast function if available
   * @returns Boolean indicating if it was handled
   */
  handlePermissionError(error: any, toast?: (props: any) => void): boolean {
    // Check if this is a permission error (status 403)
    if (error?.status === 403 || (typeof error === 'string' && error.includes('permission'))) {
      const message = typeof error === 'string' ? error : error.message || 'You do not have permission to perform this action';
      
      // Show toast if available
      if (toast) {
        toast({
          title: 'Permission Denied',
          description: message,
          variant: 'destructive'
        });
      } else {
        // Try to use global toast if available
        this.showGlobalToast(message);
      }
      
      return true; // Error was handled
    }
    
    return false; // Not a permission error
  },

  /**
   * Simple function to handle permission errors for direct use
   * 
   * @param message - Error message to display
   */
  handle(message: string): void {
    // Log the permission error for troubleshooting
    console.error('Permission denied:', message);
    this.showGlobalToast(message);
  },
  
  /**
   * Try to use global toast registry if available
   * 
   * @param message - Message to display
   */
  showGlobalToast(message: string): void {
    try {
      // Check for toast function in global scope
      if (typeof window !== 'undefined' && (window as any).__TOAST_REGISTRY__?.toast) {
        const toast = (window as any).__TOAST_REGISTRY__.toast;
        toast({
          title: 'Permission Denied',
          description: message || 'You do not have permission to perform this action',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to show permission error toast:', error as Error);
    }
  }
};

export default permissionErrorHandler;
