/**
 * API Permissions Helper
 * 
 * Provides permission checking utilities for API route handlers
 */
import { NextRequest } from 'next/server';
import { formatForbidden } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { permissionMiddleware } from '@/features/permissions/api/middleware';
import { getLogger } from '@/core/logging';

const logger = getLogger();

/**
 * Higher-order function to wrap route handlers with permission checks
 * 
 * @param permission Required permission code
 * @param handler Route handler function
 * @returns Wrapped handler with permission check
 */
export function withPermission<T>(
  permission: SystemPermission | string,
  handler: (req: NextRequest, ...args: any[]) => Promise<T>
) {
  return async (req: NextRequest, ...args: any[]): Promise<T> => {
    const userId = req.auth?.userId;
    
    // If no auth info, deny access
    if (!userId) {
      logger.warn(`Permission check failed: No authenticated user`);
      return formatForbidden(
        `Authentication required to access this resource`,
        'AUTHENTICATION_REQUIRED'
      ) as T;
    }
    
    // Check if user has the required permission
    const hasPermission = await permissionMiddleware.hasPermission(
      userId,
      permission
    );
    
    if (!hasPermission) {
      logger.warn(`Permission denied: User ${userId} does not have permission ${permission}`);
      return formatForbidden(
        `You don't have permission to perform this action (requires ${permission})`,
        'PERMISSION_DENIED'
      ) as T;
    }
    
    // User has permission, proceed with the handler
    return handler(req, ...args);
  };
}

/**
 * Check if a user has multiple permissions (all required)
 * 
 * @param userId User ID
 * @param permissions Array of permission codes
 * @returns Whether user has all permissions
 */
export async function hasAllPermissions(
  userId: number,
  permissions: (SystemPermission | string)[]
): Promise<boolean> {
  // Check each permission
  for (const permission of permissions) {
    const hasPermission = await permissionMiddleware.hasPermission(userId, permission);
    if (!hasPermission) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a user has at least one of the specified permissions
 * 
 * @param userId User ID
 * @param permissions Array of permission codes
 * @returns Whether user has any of the permissions
 */
export async function hasAnyPermission(
  userId: number,
  permissions: (SystemPermission | string)[]
): Promise<boolean> {
  // Check if user has at least one permission
  for (const permission of permissions) {
    const hasPermission = await permissionMiddleware.hasPermission(userId, permission);
    if (hasPermission) {
      return true;
    }
  }
  
  return false;
}

/**
 * Permission utilities for API routes
 */
export const apiPermissions = {
  withPermission,
  hasAllPermissions,
  hasAnyPermission
};

export default apiPermissions;
