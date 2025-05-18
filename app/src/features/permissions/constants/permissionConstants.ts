'use client';

/**
 * Permission middleware client-side API
 * This provides the same API_PERMISSIONS constants as the server middleware
 * without importing server-only code
 */

import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * Permission code constants for client UI components
 * These match the server-side constants in permissionMiddleware.ts
 */
export const API_PERMISSIONS = {
  // User management permissions
  USERS: {
    VIEW: SystemPermission.USERS_VIEW,
    CREATE: SystemPermission.USERS_CREATE, 
    UPDATE: SystemPermission.USERS_EDIT,
    DELETE: SystemPermission.USERS_DELETE,
    MANAGE_PERMISSIONS: SystemPermission.USERS_MANAGE,
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
    UPDATE: SystemPermission.NOTIFICATIONS_EDIT,
    DELETE: SystemPermission.NOTIFICATIONS_DELETE,
    MANAGE: SystemPermission.NOTIFICATIONS_MANAGE,
  },
  
  // Settings management permissions
  SETTINGS: {
    VIEW: SystemPermission.SETTINGS_VIEW,
    UPDATE: SystemPermission.SETTINGS_EDIT,
  },
  
  // Statistics permissions
  STATISTICS: {
    VIEW: SystemPermission.USERS_VIEW, // Using USERS_VIEW as a fallback permission for statistics
  },
  
  // System permissions
  SYSTEM: {
    ADMIN: SystemPermission.SYSTEM_ADMIN,
    LOGS: SystemPermission.SYSTEM_LOGS,
  },
};

export default API_PERMISSIONS;