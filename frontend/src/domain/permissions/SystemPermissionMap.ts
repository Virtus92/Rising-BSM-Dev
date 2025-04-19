/**
 * Centralized System Permission Definitions
 * 
 * This file contains the single source of truth for all permission definitions
 * used throughout the application, both in the backend and frontend.
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
 * Complete map of all system permissions with their display information
 * This is used for:
 * 1. Database seeding
 * 2. Frontend display 
 * 3. Permission validation
 */
export const SystemPermissionMap: Record<string, PermissionDefinition> = {
  // System permissions
  [SystemPermission.SYSTEM_ACCESS]: {
    code: SystemPermission.SYSTEM_ACCESS,
    name: 'System Access',
    description: 'Can access the system',
    category: PermissionCategory.SYSTEM,
    action: PermissionAction.ACCESS
  },
  
  // User permissions
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
  
  // Role permissions
  [SystemPermission.ROLES_VIEW]: {
    code: SystemPermission.ROLES_VIEW,
    name: 'View Roles',
    description: 'Can view roles and permissions',
    category: PermissionCategory.ROLES,
    action: PermissionAction.VIEW
  },
  [SystemPermission.ROLES_CREATE]: {
    code: SystemPermission.ROLES_CREATE,
    name: 'Create Roles',
    description: 'Can create new roles',
    category: PermissionCategory.ROLES,
    action: PermissionAction.CREATE
  },
  [SystemPermission.ROLES_EDIT]: {
    code: SystemPermission.ROLES_EDIT,
    name: 'Edit Roles',
    description: 'Can edit existing roles',
    category: PermissionCategory.ROLES,
    action: PermissionAction.EDIT
  },
  [SystemPermission.ROLES_DELETE]: {
    code: SystemPermission.ROLES_DELETE,
    name: 'Delete Roles',
    description: 'Can delete roles',
    category: PermissionCategory.ROLES,
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
  [SystemPermission.REQUESTS_MANAGE]: {
    code: SystemPermission.REQUESTS_MANAGE,
    name: 'Manage Requests',
    description: 'Has full management access to requests',
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
  }
};

/**
 * Utility function to get a permission definition by code
 * 
 * @param code Permission code
 * @returns Permission definition or undefined if not found
 */
export function getPermissionDefinition(code: SystemPermission | string): PermissionDefinition | undefined {
  return SystemPermissionMap[code];
}

/**
 * Creates a permission definition list from all system permissions or a subset
 * 
 * @param permissionCodes Optional subset of permission codes to include
 * @returns List of permission definitions
 */
export function createPermissionDefinitionList(permissionCodes?: string[]): PermissionDefinition[] {
  // If no codes provided, return all permissions
  if (!permissionCodes || permissionCodes.length === 0) {
    return Object.values(SystemPermissionMap);
  }
  
  // Otherwise, return only the requested permissions
  return permissionCodes
    .map(code => SystemPermissionMap[code])
    .filter(Boolean) // Remove any undefined values
    .concat(
      // Add any codes that don't have definitions with generated info
      permissionCodes
        .filter(code => !SystemPermissionMap[code])
        .map(code => {
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
        })
    );
}

/**
 * Gets all permission codes from the SystemPermissionMap
 * 
 * @returns Array of all system permission codes
 */
export function getAllPermissionCodes(): string[] {
  return Object.keys(SystemPermissionMap);
}
