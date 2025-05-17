/**
 * Permission Error Handler Utility
 * 
 * Provides standardized error handling for permission-related errors across the application.
 * Updated with improved error diagnostics and logging.
 */
import { NextResponse } from 'next/server';
import { formatResponse } from '@/core/errors';
import { getLogger } from '@/core/logging';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getPermissionFromCache } from '@/features/permissions/lib/utils/permissionCacheUtils';

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
 * Creates a permission denied response with detailed diagnostics
 * 
 * @param permission - Permission code that was required
 * @param userId - User ID that was denied
 * @returns Formatted NextResponse with error
 */
export async function createPermissionDeniedResponse(
  permission: SystemPermission | string | (SystemPermission | string)[],
  userId?: number
): Promise<NextResponse> {
  const logger = getLogger();
  const requestId = `perm-check-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    const message = formatPermissionDeniedMessage(permission, userId);
    
    // Enhanced logging with diagnostics information
    logger.warn(`Permission denied: User ${userId} does not have permission(s)`, { 
      userId, 
      permission: Array.isArray(permission) ? permission : [permission],
      requestId
    });
    
    // Diagnostic cache check to help troubleshoot issues
    if (userId && typeof permission === 'string') {
      try {
        const cacheStatus = await getPermissionFromCache(Number(userId), permission);
        logger.info(`Permission cache diagnostics for denied permission:`, {
          userId,
          permission,
          cachedValue: cacheStatus,
          requestId
        });
      } catch (cacheError) {
        logger.warn(`Failed to check permission cache during error handling`, {
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
          requestId
        });
      }
    }
    
    return formatResponse.error(message, 403);
  } catch (error) {
    // Log but return a safe default response
    logger.error('Error creating permission denied response:', { 
      error: error instanceof Error ? error.message : String(error), 
      permission, 
      userId,
      requestId
    });
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
      if (typeof window !== 'undefined' && window.__TOAST_REGISTRY__?.toast) {
        const toast = window.__TOAST_REGISTRY__.toast;
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
