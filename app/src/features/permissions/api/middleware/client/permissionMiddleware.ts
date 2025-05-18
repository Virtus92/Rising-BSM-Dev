'use client';

/**
 * Client-side Permission Constants
 * THIS FILE SHOULD NOT IMPORT SERVER-ONLY MODULES
 */

import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { getLogger } from '@/core/logging';

const logger = getLogger();

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
  
  // System permissions
  SYSTEM: {
    ADMIN: SystemPermission.SYSTEM_ADMIN,
    LOGS: SystemPermission.SYSTEM_LOGS,
  },
};

// Export minimal API for client usage
export const clientPermissionMiddleware = {
  API_PERMISSIONS,
};

export default clientPermissionMiddleware;
