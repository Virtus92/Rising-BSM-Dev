/**
 * System Permission Categories
 */
export enum PermissionCategory {
  SYSTEM = "System",
  USERS = "Users",
  ROLES = "Roles",
  CUSTOMERS = "Customers",
  REQUESTS = "Requests",
  APPOINTMENTS = "Appointments",
  SETTINGS = "Settings",
  PROFILE = "Profile"
}

/**
 * System Permission Actions
 */
export enum PermissionAction {
  VIEW = "view",
  CREATE = "create",
  EDIT = "edit",
  DELETE = "delete",
  MANAGE = "manage",
  ACCESS = "access",
  APPROVE = "approve",
  REJECT = "reject",
  ASSIGN = "assign"
}

/**
 * Common System Permissions
 * 
 * Format: {category}.{action}
 */
export enum SystemPermission {
  // System permissions
  SYSTEM_ACCESS = "system.access",
  
  // User permissions
  USERS_VIEW = "users.view",
  USERS_CREATE = "users.create",
  USERS_EDIT = "users.edit",
  USERS_DELETE = "users.delete",
  
  // Role permissions
  ROLES_VIEW = "roles.view",
  ROLES_CREATE = "roles.create",
  ROLES_EDIT = "roles.edit",
  ROLES_DELETE = "roles.delete",
  
  // Customer permissions
  CUSTOMERS_VIEW = "customers.view",
  CUSTOMERS_CREATE = "customers.create",
  CUSTOMERS_EDIT = "customers.edit",
  CUSTOMERS_DELETE = "customers.delete",
  
  // Request permissions
  REQUESTS_VIEW = "requests.view",
  REQUESTS_CREATE = "requests.create",
  REQUESTS_EDIT = "requests.edit",
  REQUESTS_DELETE = "requests.delete",
  REQUESTS_APPROVE = "requests.approve",
  REQUESTS_REJECT = "requests.reject",
  REQUESTS_ASSIGN = "requests.assign",
  REQUESTS_MANAGE = "requests.manage",
  
  // Appointment permissions
  APPOINTMENTS_VIEW = "appointments.view",
  APPOINTMENTS_CREATE = "appointments.create",
  APPOINTMENTS_EDIT = "appointments.edit",
  APPOINTMENTS_DELETE = "appointments.delete",
  
  // Settings permissions
  SETTINGS_VIEW = "settings.view",
  SETTINGS_EDIT = "settings.edit",
  
  // Profile permissions
  PROFILE_VIEW = "profile.view",
  PROFILE_EDIT = "profile.edit"
}

// Role-based permission presets
export const RolePermissions: Record<string, SystemPermission[]> = {
  "admin": [
    SystemPermission.SYSTEM_ACCESS,
    SystemPermission.USERS_VIEW,
    SystemPermission.USERS_CREATE,
    SystemPermission.USERS_EDIT,
    SystemPermission.USERS_DELETE,
    SystemPermission.ROLES_VIEW,
    SystemPermission.ROLES_CREATE,
    SystemPermission.ROLES_EDIT,
    SystemPermission.ROLES_DELETE,
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
    SystemPermission.REQUESTS_MANAGE,
    SystemPermission.APPOINTMENTS_VIEW,
    SystemPermission.APPOINTMENTS_CREATE,
    SystemPermission.APPOINTMENTS_EDIT,
    SystemPermission.APPOINTMENTS_DELETE,
    SystemPermission.SETTINGS_VIEW,
    SystemPermission.SETTINGS_EDIT,
    SystemPermission.PROFILE_VIEW,
    SystemPermission.PROFILE_EDIT
  ],
  "manager": [
    SystemPermission.SYSTEM_ACCESS,
    SystemPermission.USERS_VIEW,
    SystemPermission.CUSTOMERS_VIEW,
    SystemPermission.CUSTOMERS_CREATE,
    SystemPermission.CUSTOMERS_EDIT,
    SystemPermission.REQUESTS_VIEW,
    SystemPermission.REQUESTS_CREATE,
    SystemPermission.REQUESTS_EDIT,
    SystemPermission.REQUESTS_DELETE,
    SystemPermission.REQUESTS_APPROVE,
    SystemPermission.REQUESTS_REJECT,
    SystemPermission.REQUESTS_ASSIGN,
    SystemPermission.APPOINTMENTS_VIEW,
    SystemPermission.APPOINTMENTS_CREATE,
    SystemPermission.APPOINTMENTS_EDIT,
    SystemPermission.APPOINTMENTS_DELETE,
    SystemPermission.SETTINGS_VIEW,
    SystemPermission.PROFILE_VIEW,
    SystemPermission.PROFILE_EDIT
  ],
  "employee": [
    SystemPermission.SYSTEM_ACCESS,
    SystemPermission.CUSTOMERS_VIEW,
    SystemPermission.CUSTOMERS_CREATE,
    SystemPermission.REQUESTS_VIEW,
    SystemPermission.REQUESTS_CREATE,
    SystemPermission.APPOINTMENTS_VIEW,
    SystemPermission.APPOINTMENTS_CREATE,
    SystemPermission.APPOINTMENTS_EDIT,
    SystemPermission.PROFILE_VIEW,
    SystemPermission.PROFILE_EDIT
  ],
  "user": [
    SystemPermission.SYSTEM_ACCESS,
    SystemPermission.PROFILE_VIEW,
    SystemPermission.PROFILE_EDIT,
    SystemPermission.APPOINTMENTS_VIEW,
    SystemPermission.APPOINTMENTS_CREATE
  ]
};

/**
 * Gets permissions for a specific role
 * 
 * @param role - User role
 * @returns Array of permission codes for the role
 */
export function getPermissionsForRole(role: string): string[] {
  const lowercaseRole = role.toLowerCase();
  return (RolePermissions[lowercaseRole] || []).map(permission => permission.toString());
}
