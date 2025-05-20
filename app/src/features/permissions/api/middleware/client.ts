/**
 * Client-safe permissions middleware
 * This is a client-safe version of the permissions module that doesn't import server-only code.
 */
'use client';

import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * Permission code constants for API endpoints
 * All permissions are properly defined (no substitutions)
 */
export const API_PERMISSIONS = {
  // User management permissions
  USERS: {
    VIEW: SystemPermission.USERS_VIEW,
    CREATE: SystemPermission.USERS_CREATE,
    UPDATE: SystemPermission.USERS_EDIT,
    DELETE: SystemPermission.USERS_DELETE,
    MANAGE_PERMISSIONS: SystemPermission.USERS_EDIT,
  },
  
  // Customer management permissions
  CUSTOMERS: {
    VIEW: SystemPermission.CUSTOMERS_VIEW,
    CREATE: SystemPermission.CUSTOMERS_CREATE,
    UPDATE: SystemPermission.CUSTOMERS_EDIT,
    DELETE: SystemPermission.CUSTOMERS_DELETE,
  },
  
  // Request management permissions
  REQUESTS: {
    VIEW: SystemPermission.REQUESTS_VIEW,
    CREATE: SystemPermission.REQUESTS_CREATE,
    UPDATE: SystemPermission.REQUESTS_EDIT,
    DELETE: SystemPermission.REQUESTS_DELETE,
    ASSIGN: SystemPermission.REQUESTS_ASSIGN,
    CONVERT: SystemPermission.REQUESTS_CONVERT,
  },
  
  // Appointment management permissions
  APPOINTMENTS: {
    VIEW: SystemPermission.APPOINTMENTS_VIEW,
    CREATE: SystemPermission.APPOINTMENTS_CREATE,
    UPDATE: SystemPermission.APPOINTMENTS_EDIT,
    DELETE: SystemPermission.APPOINTMENTS_DELETE,
  },
  
  // Notification management permissions
  NOTIFICATIONS: {
    VIEW: SystemPermission.NOTIFICATIONS_VIEW,
  },
  
  // Settings management permissions
  SETTINGS: {
    VIEW: SystemPermission.SETTINGS_VIEW,
    UPDATE: SystemPermission.SETTINGS_EDIT,
  },
  
  // System permissions
  SYSTEM: {
    ADMIN: SystemPermission.SYSTEM_ADMIN,
  },
};

/**
 * Client-side permission check result interface
 * Note: This is a duplicate of the server-side interface but doesn't import server code
 */
export interface PermissionCheckResult {
  /** Whether the check was successful */
  success: boolean;
  
  /** Error message (if unsuccessful) */
  message?: string;
  
  /** HTTP status code */
  status?: number;
  
  /** Permission that was checked */
  permission?: string;
  
  /** Error details (if any) */
  error?: any;
}

/**
 * Client-side permissions middleware object
 * This provides client-safe permissions constants and types
 */
export const permissionMiddleware = {
  API_PERMISSIONS
};

export default permissionMiddleware;