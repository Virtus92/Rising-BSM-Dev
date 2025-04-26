import { NextRequest, NextResponse } from 'next/server';
import { formatError } from '@/core/errors';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getServiceFactory } from '@/core/factories';
import { getLogger } from '@/core/logging';

/**
 * Defines API permission codes used throughout the application
 * This file maps API endpoints to permission codes for authorization
 */

// Permission code constants for API endpoints
export const API_PERMISSIONS = {
  // User management permissions
  USERS: {
    VIEW: 'api:users:view',
    CREATE: 'api:users:create',
    UPDATE: 'api:users:update',
    DELETE: 'api:users:delete',
    MANAGE_PERMISSIONS: 'api:users:manage-permissions',
  },
  
  // Customer management permissions
  CUSTOMERS: {
    VIEW: 'api:customers:view',
    CREATE: 'api:customers:create',
    UPDATE: 'api:customers:update',
    DELETE: 'api:customers:delete',
  },
  
  // Request management permissions
  REQUESTS: {
    VIEW: 'api:requests:view',
    CREATE: 'api:requests:create',
    UPDATE: 'api:requests:update',
    DELETE: 'api:requests:delete',
    ASSIGN: 'api:requests:assign',
    CONVERT: 'api:requests:convert',
  },
  
  // Appointment management permissions
  APPOINTMENTS: {
    VIEW: 'api:appointments:view',
    CREATE: 'api:appointments:create',
    UPDATE: 'api:appointments:update',
    DELETE: 'api:appointments:delete',
  },
  
  // Notification management permissions
  NOTIFICATIONS: {
    VIEW: 'api:notifications:view',
    MANAGE: 'api:notifications:manage',
  },
  
  // Settings management permissions
  SETTINGS: {
    VIEW: 'api:settings:view',
    UPDATE: 'api:settings:update',
  },
  
  // System permissions
  SYSTEM: {
    ADMIN: 'api:system:admin',
    LOGS: 'api:system:logs',
  },
} as const;

// Default permission sets for user roles
export const ROLE_PERMISSIONS = {
  ADMIN: [
    ...Object.values(API_PERMISSIONS.USERS),
    ...Object.values(API_PERMISSIONS.CUSTOMERS),
    ...Object.values(API_PERMISSIONS.REQUESTS),
    ...Object.values(API_PERMISSIONS.APPOINTMENTS),
    ...Object.values(API_PERMISSIONS.NOTIFICATIONS),
    ...Object.values(API_PERMISSIONS.SETTINGS),
    ...Object.values(API_PERMISSIONS.SYSTEM),
  ],
  
  MANAGER: [
    API_PERMISSIONS.USERS.VIEW,
    ...Object.values(API_PERMISSIONS.CUSTOMERS),
    ...Object.values(API_PERMISSIONS.REQUESTS),
    ...Object.values(API_PERMISSIONS.APPOINTMENTS),
    ...Object.values(API_PERMISSIONS.NOTIFICATIONS),
    API_PERMISSIONS.SETTINGS.VIEW,
  ],
  
  AGENT: [
    API_PERMISSIONS.USERS.VIEW,
    API_PERMISSIONS.CUSTOMERS.VIEW,
    API_PERMISSIONS.CUSTOMERS.CREATE,
    API_PERMISSIONS.CUSTOMERS.UPDATE,
    API_PERMISSIONS.REQUESTS.VIEW,
    API_PERMISSIONS.REQUESTS.CREATE,
    API_PERMISSIONS.REQUESTS.UPDATE,
    API_PERMISSIONS.APPOINTMENTS.VIEW,
    API_PERMISSIONS.APPOINTMENTS.CREATE,
    API_PERMISSIONS.APPOINTMENTS.UPDATE,
    API_PERMISSIONS.NOTIFICATIONS.VIEW,
  ],
  
  USER: [
    API_PERMISSIONS.CUSTOMERS.VIEW,
    API_PERMISSIONS.REQUESTS.VIEW,
    API_PERMISSIONS.REQUESTS.CREATE,
    API_PERMISSIONS.APPOINTMENTS.VIEW,
    API_PERMISSIONS.NOTIFICATIONS.VIEW,
  ],
};

/**
 * Utility function to wrap route handlers with permission checks
 * 
 * @param handler - Route handler function
 * @param requiredPermission - Permission required for this route
 * @returns Wrapped handler function with permission check
 */
export function withPermission<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse<T>>,
  requiredPermission: SystemPermission | string
) {
  const logger = getLogger();
  
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    try {
      // Get user ID from auth
      const userId = request.auth?.userId;
      
      if (!userId) {
        logger.warn(`Permission check failed: No user ID found in request`);
        return formatError('Authentication required', 401) as NextResponse<T>;
      }
      
      // Get permission service
      const serviceFactory = getServiceFactory();
      const permissionService = serviceFactory.createPermissionService();
      
      // Check if user has permission
      const hasPermission = await permissionService.hasPermission(
        userId, 
        requiredPermission,
        { context: { userId, requestUrl: request.url } }
      );
      
      if (!hasPermission) {
        logger.warn(`Permission denied: User ${userId} does not have permission ${requiredPermission}`);
        return formatError(
          `You don't have permission to perform this action (requires ${requiredPermission})`, 
          403
        ) as NextResponse<T>;
      }
      
      // User has permission, proceed to handler
      return handler(request, ...args);
    } catch (error) {
      logger.error('Error in permission middleware', { 
        error: error instanceof Error ? error.message : String(error), 
        stack: error instanceof Error ? error.stack : undefined,
        requiredPermission
      });
      
      return formatError(
        'Server error during permission check', 
        500
      ) as NextResponse<T>;
    }
  };
}

/**
 * Checks if a permission is included in a role's default permissions
 * 
 * @param permission - Permission code to check
 * @param role - User role
 * @returns Whether the permission is included
 */
export function isPermissionIncludedInRole(permission: string, role: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role?.toUpperCase() as keyof typeof ROLE_PERMISSIONS];
  return !!rolePermissions && rolePermissions.includes(permission as any);
}

/**
 * Gets all permission codes
 * 
 * @returns Array of permission codes
 */
export function getAllPermissionCodes(): string[] {
  return [
    ...Object.values(API_PERMISSIONS.USERS),
    ...Object.values(API_PERMISSIONS.CUSTOMERS),
    ...Object.values(API_PERMISSIONS.REQUESTS),
    ...Object.values(API_PERMISSIONS.APPOINTMENTS),
    ...Object.values(API_PERMISSIONS.NOTIFICATIONS),
    ...Object.values(API_PERMISSIONS.SETTINGS),
    ...Object.values(API_PERMISSIONS.SYSTEM),
  ];
}

// Add withPermission method to API_PERMISSIONS object for backward compatibility
(API_PERMISSIONS as any).withPermission = withPermission;

export default {
  API_PERMISSIONS,
  ROLE_PERMISSIONS,
  isPermissionIncludedInRole,
  getAllPermissionCodes,
  withPermission
};