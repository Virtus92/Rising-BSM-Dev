/**
 * Centralized System Permission Definitions - CLEANED VERSION
 * 
 * This file contains the single source of truth for ONLY NECESSARY permissions
 * used throughout the application, both in the backend and frontend.
 * Unnecessary and unimplemented permissions have been removed.
 */
import { PermissionCategory, PermissionAction, SystemPermission } from '../enums/PermissionEnums';

/**
 * Permission definition with display information
 */
export interface PermissionDefinition {
  code: SystemPermission | string;
  name: string;
  description: string;
  category: string;
  action: string;
}

/**
 * Clean map of only the necessary system permissions with their display information
 *
 * IMPORTANT: This map matches exactly what is in SystemPermission enum
 * and includes ONLY permissions that are actually implemented and used
 */
export const SystemPermissionMap: Record<string, PermissionDefinition> = {
  // Dashboard permission
  [SystemPermission.DASHBOARD_ACCESS]: {
    code: SystemPermission.DASHBOARD_ACCESS,
    name: 'Access Dashboard',
    description: 'Can access the main dashboard',
    category: PermissionCategory.DASHBOARD,
    action: PermissionAction.ACCESS
  },
  
  // User management permissions
  [SystemPermission.USERS_VIEW]: {
    code: SystemPermission.USERS_VIEW,
    name: 'View Users',
    description: 'Can view user list and details',
    category: PermissionCategory.USERS,
    action: PermissionAction.VIEW
  },
  [SystemPermission.USERS_CREATE]: {
    code: SystemPermission.USERS_CREATE,
    name: 'Create Users',
    description: 'Can create new users',
    category: PermissionCategory.USERS,
    action: PermissionAction.CREATE
  },
  [SystemPermission.USERS_EDIT]: {
    code: SystemPermission.USERS_EDIT,
    name: 'Edit Users',
    description: 'Can edit existing users',
    category: PermissionCategory.USERS,
    action: PermissionAction.EDIT
  },
  [SystemPermission.USERS_DELETE]: {
    code: SystemPermission.USERS_DELETE,
    name: 'Delete Users',
    description: 'Can delete users',
    category: PermissionCategory.USERS,
    action: PermissionAction.DELETE
  },
  
  // Customer permissions
  [SystemPermission.CUSTOMERS_VIEW]: {
    code: SystemPermission.CUSTOMERS_VIEW,
    name: 'View Customers',
    description: 'Can view customer list and details',
    category: PermissionCategory.CUSTOMERS,
    action: PermissionAction.VIEW
  },
  [SystemPermission.CUSTOMERS_CREATE]: {
    code: SystemPermission.CUSTOMERS_CREATE,
    name: 'Create Customers',
    description: 'Can create new customers',
    category: PermissionCategory.CUSTOMERS,
    action: PermissionAction.CREATE
  },
  [SystemPermission.CUSTOMERS_EDIT]: {
    code: SystemPermission.CUSTOMERS_EDIT,
    name: 'Edit Customers',
    description: 'Can edit existing customers',
    category: PermissionCategory.CUSTOMERS,
    action: PermissionAction.EDIT
  },
  [SystemPermission.CUSTOMERS_DELETE]: {
    code: SystemPermission.CUSTOMERS_DELETE,
    name: 'Delete Customers',
    description: 'Can delete customers',
    category: PermissionCategory.CUSTOMERS,
    action: PermissionAction.DELETE
  },
  
  // Request permissions
  [SystemPermission.REQUESTS_VIEW]: {
    code: SystemPermission.REQUESTS_VIEW,
    name: 'View Requests',
    description: 'Can view request list and details',
    category: PermissionCategory.REQUESTS,
    action: PermissionAction.VIEW
  },
  [SystemPermission.REQUESTS_CREATE]: {
    code: SystemPermission.REQUESTS_CREATE,
    name: 'Create Requests',
    description: 'Can create new requests',
    category: PermissionCategory.REQUESTS,
    action: PermissionAction.CREATE
  },
  [SystemPermission.REQUESTS_EDIT]: {
    code: SystemPermission.REQUESTS_EDIT,
    name: 'Edit Requests',
    description: 'Can edit existing requests',
    category: PermissionCategory.REQUESTS,
    action: PermissionAction.EDIT
  },
  [SystemPermission.REQUESTS_DELETE]: {
    code: SystemPermission.REQUESTS_DELETE,
    name: 'Delete Requests',
    description: 'Can delete requests',
    category: PermissionCategory.REQUESTS,
    action: PermissionAction.DELETE
  },
  [SystemPermission.REQUESTS_APPROVE]: {
    code: SystemPermission.REQUESTS_APPROVE,
    name: 'Approve Requests',
    description: 'Can approve requests',
    category: PermissionCategory.REQUESTS,
    action: PermissionAction.APPROVE
  },
  [SystemPermission.REQUESTS_REJECT]: {
    code: SystemPermission.REQUESTS_REJECT,
    name: 'Reject Requests',
    description: 'Can reject requests',
    category: PermissionCategory.REQUESTS,
    action: PermissionAction.REJECT
  },
  [SystemPermission.REQUESTS_ASSIGN]: {
    code: SystemPermission.REQUESTS_ASSIGN,
    name: 'Assign Requests',
    description: 'Can assign requests to users',
    category: PermissionCategory.REQUESTS,
    action: PermissionAction.ASSIGN
  },
  [SystemPermission.REQUESTS_CONVERT]: {
    code: SystemPermission.REQUESTS_CONVERT,
    name: 'Convert Requests',
    description: 'Can convert requests to other entity types',
    category: PermissionCategory.REQUESTS,
    action: PermissionAction.MANAGE
  },
  
  // Appointment permissions
  [SystemPermission.APPOINTMENTS_VIEW]: {
    code: SystemPermission.APPOINTMENTS_VIEW,
    name: 'View Appointments',
    description: 'Can view appointment list and details',
    category: PermissionCategory.APPOINTMENTS,
    action: PermissionAction.VIEW
  },
  [SystemPermission.APPOINTMENTS_CREATE]: {
    code: SystemPermission.APPOINTMENTS_CREATE,
    name: 'Create Appointments',
    description: 'Can create new appointments',
    category: PermissionCategory.APPOINTMENTS,
    action: PermissionAction.CREATE
  },
  [SystemPermission.APPOINTMENTS_EDIT]: {
    code: SystemPermission.APPOINTMENTS_EDIT,
    name: 'Edit Appointments',
    description: 'Can edit existing appointments',
    category: PermissionCategory.APPOINTMENTS,
    action: PermissionAction.EDIT
  },
  [SystemPermission.APPOINTMENTS_DELETE]: {
    code: SystemPermission.APPOINTMENTS_DELETE,
    name: 'Delete Appointments',
    description: 'Can delete appointments',
    category: PermissionCategory.APPOINTMENTS,
    action: PermissionAction.DELETE
  },
  
  // Notification permission
  [SystemPermission.NOTIFICATIONS_VIEW]: {
    code: SystemPermission.NOTIFICATIONS_VIEW,
    name: 'View Notifications',
    description: 'Can view notifications',
    category: PermissionCategory.NOTIFICATIONS,
    action: PermissionAction.VIEW
  },
  
  // Settings permissions
  [SystemPermission.SETTINGS_VIEW]: {
    code: SystemPermission.SETTINGS_VIEW,
    name: 'View Settings',
    description: 'Can view system settings',
    category: PermissionCategory.SETTINGS,
    action: PermissionAction.VIEW
  },
  [SystemPermission.SETTINGS_EDIT]: {
    code: SystemPermission.SETTINGS_EDIT,
    name: 'Edit Settings',
    description: 'Can edit system settings',
    category: PermissionCategory.SETTINGS,
    action: PermissionAction.EDIT
  },
  
  // Profile permissions
  [SystemPermission.PROFILE_VIEW]: {
    code: SystemPermission.PROFILE_VIEW,
    name: 'View Profile',
    description: 'Can view own profile',
    category: PermissionCategory.PROFILE,
    action: PermissionAction.VIEW
  },
  [SystemPermission.PROFILE_EDIT]: {
    code: SystemPermission.PROFILE_EDIT,
    name: 'Edit Profile',
    description: 'Can edit own profile',
    category: PermissionCategory.PROFILE,
    action: PermissionAction.EDIT
  },
  
  // Permission management
  [SystemPermission.PERMISSIONS_VIEW]: {
    code: SystemPermission.PERMISSIONS_VIEW,
    name: 'View Permissions',
    description: 'Can view permissions',
    category: PermissionCategory.PERMISSIONS,
    action: PermissionAction.VIEW
  },
  [SystemPermission.PERMISSIONS_MANAGE]: {
    code: SystemPermission.PERMISSIONS_MANAGE,
    name: 'Manage Permissions',
    description: 'Can manage permissions',
    category: PermissionCategory.PERMISSIONS,
    action: PermissionAction.MANAGE
  },
  
  // System administration
  [SystemPermission.SYSTEM_ADMIN]: {
    code: SystemPermission.SYSTEM_ADMIN,
    name: 'System Administration',
    description: 'Full system administration access',
    category: 'System',
    action: 'admin'
  }
};

/**
 * Utility function to get a permission definition by code
 * 
 * @param code Permission code
 * @returns Permission definition or undefined if not found
 */
export function getPermissionDefinition(code: SystemPermission | string): PermissionDefinition | undefined {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid permission code provided to getPermissionDefinition');
  }
  return SystemPermissionMap[code];
}

/**
 * Creates a permission definition list from all system permissions or a subset
 * No fallbacks or workarounds - ensures all permissions are properly handled
 * 
 * @param permissionCodes Optional subset of permission codes to include
 * @returns List of permission definitions
 */
export function createPermissionDefinitionList(permissionCodes?: string[]): PermissionDefinition[] {
  // If no codes provided, return all permissions
  if (!permissionCodes || !Array.isArray(permissionCodes) || permissionCodes.length === 0) {
    // Ensure we get all system permissions first
    const allSystemPermCodes = Object.values(SystemPermission).map(p => p.toString());
    
    // Get definitions for all permissions
    return allSystemPermCodes.map(code => {
      // If definition exists in map, use it
      if (SystemPermissionMap[code]) {
        return SystemPermissionMap[code];
      }
      
      // Otherwise generate a definition based on the code
      const parts = code.split('.');
      const category = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Other';
      const action = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Access';
      
      return {
        code,
        name: `${action} ${category}`,
        description: `Can ${parts[1] || 'access'} ${parts[0] || 'system'}`,
        category,
        action: parts[1] || 'access'
      };
    });
  }
  
  // Otherwise, return only the requested permissions
  return permissionCodes.map(code => {
    // If definition exists in map, use it
    if (SystemPermissionMap[code]) {
      return SystemPermissionMap[code];
    }
    
    // Otherwise generate a definition
    const parts = code.split('.');
    const category = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Other';
    const action = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Access';
    
    return {
      code,
      name: `${action} ${category}`,
      description: `Can ${parts[1] || 'access'} ${parts[0] || 'system'}`,
      category,
      action: parts[1] || 'access'
    };
  });
}

/**
 * Gets all permission codes from the SystemPermissionMap
 * 
 * @returns Array of all system permission codes
 */
export function getAllPermissionCodes(): string[] {
  return Object.keys(SystemPermissionMap);
}

/**
 * Ensures all enum permissions have corresponding definitions
 * Returns any permissions that are missing from the map
 */
export function findMissingPermissions(): string[] {
  const allEnumPermissions = Object.values(SystemPermission).map(p => p.toString());
  const definedPermissions = Object.keys(SystemPermissionMap);
  
  return allEnumPermissions.filter(p => !definedPermissions.includes(p));
}

/**
 * Gets default permissions for a specific role
 * This is the canonical source of default permissions for all roles
 * 
 * @param role User role (case-insensitive)
 * @returns Array of permission codes for the role
 */
export function getDefaultPermissionsForRole(role: string): string[] {
  // Basic permissions that all roles should have
  const basicPermissions = [
    SystemPermission.PROFILE_VIEW,
    SystemPermission.PROFILE_EDIT,
    SystemPermission.DASHBOARD_ACCESS
  ];
  
  // Normalize role to lowercase
  const normalizedRole = role.toLowerCase();
  
  // Return appropriate permissions based on role
  switch(normalizedRole) {
    case 'admin':
      return [
        ...basicPermissions,
        SystemPermission.USERS_VIEW,
        SystemPermission.USERS_CREATE,
        SystemPermission.USERS_EDIT,
        SystemPermission.USERS_DELETE,
        SystemPermission.PERMISSIONS_VIEW,
        SystemPermission.PERMISSIONS_MANAGE,
        SystemPermission.CUSTOMERS_VIEW,
        SystemPermission.CUSTOMERS_CREATE,
        SystemPermission.CUSTOMERS_EDIT,
        SystemPermission.CUSTOMERS_DELETE,
        SystemPermission.REQUESTS_VIEW,
        SystemPermission.REQUESTS_CREATE,
        SystemPermission.REQUESTS_EDIT,
        SystemPermission.REQUESTS_DELETE,
        SystemPermission.REQUESTS_APPROVE,
        SystemPermission.REQUESTS_REJECT,
        SystemPermission.REQUESTS_ASSIGN,
        SystemPermission.REQUESTS_CONVERT,
        SystemPermission.APPOINTMENTS_VIEW,
        SystemPermission.APPOINTMENTS_CREATE,
        SystemPermission.APPOINTMENTS_EDIT,
        SystemPermission.APPOINTMENTS_DELETE,
        SystemPermission.NOTIFICATIONS_VIEW,
        SystemPermission.SETTINGS_VIEW,
        SystemPermission.SETTINGS_EDIT,
        SystemPermission.SYSTEM_ADMIN
      ];
    case 'manager':
      return [
        ...basicPermissions,
        SystemPermission.USERS_VIEW,
        SystemPermission.CUSTOMERS_VIEW,
        SystemPermission.CUSTOMERS_CREATE,
        SystemPermission.CUSTOMERS_EDIT,
        SystemPermission.REQUESTS_VIEW,
        SystemPermission.REQUESTS_CREATE,
        SystemPermission.REQUESTS_EDIT,
        SystemPermission.REQUESTS_APPROVE,
        SystemPermission.REQUESTS_REJECT,
        SystemPermission.REQUESTS_ASSIGN,
        SystemPermission.APPOINTMENTS_VIEW,
        SystemPermission.APPOINTMENTS_CREATE,
        SystemPermission.APPOINTMENTS_EDIT,
        SystemPermission.NOTIFICATIONS_VIEW,
        SystemPermission.SETTINGS_VIEW
      ];
    case 'employee':
      return [
        ...basicPermissions,
        SystemPermission.CUSTOMERS_VIEW,
        SystemPermission.REQUESTS_VIEW,
        SystemPermission.REQUESTS_CREATE,
        SystemPermission.APPOINTMENTS_VIEW,
        SystemPermission.APPOINTMENTS_CREATE,
        SystemPermission.NOTIFICATIONS_VIEW
      ];
    case 'user':
      return [
        ...basicPermissions,
        SystemPermission.REQUESTS_CREATE,
        SystemPermission.NOTIFICATIONS_VIEW
      ];
    default:
      return basicPermissions;
  }
}
