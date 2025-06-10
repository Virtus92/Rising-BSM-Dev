/**
 * System Permission Categories
 */
export enum PermissionCategory {
  DASHBOARD = "Dashboard",
  USERS = "Users",
  CUSTOMERS = "Customers",
  REQUESTS = "Requests",
  APPOINTMENTS = "Appointments",
  SETTINGS = "Settings",
  PROFILE = "Profile",
  NOTIFICATIONS = "Notifications",
  PERMISSIONS = "Permissions",
  AUTOMATION = "Automation"
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
 * ONLY includes permissions that are actually implemented and used
 */
export enum SystemPermission {
  // Dashboard permission
  DASHBOARD_ACCESS = "dashboard.access",
  
  // User permissions
  USERS_VIEW = "users.view",
  USERS_CREATE = "users.create",
  USERS_EDIT = "users.edit",
  USERS_DELETE = "users.delete",
  
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
  REQUESTS_CONVERT = "requests.convert",
  
  // Appointment permissions
  APPOINTMENTS_VIEW = "appointments.view",
  APPOINTMENTS_CREATE = "appointments.create",
  APPOINTMENTS_EDIT = "appointments.edit",
  APPOINTMENTS_DELETE = "appointments.delete",
  
  // Notification permission
  NOTIFICATIONS_VIEW = "notifications.view",

  // Settings permissions
  SETTINGS_VIEW = "settings.view",
  SETTINGS_EDIT = "settings.edit",
  
  // Profile permissions
  PROFILE_VIEW = "profile.view",
  PROFILE_EDIT = "profile.edit",
  
  // Permission management
  PERMISSIONS_VIEW = "permissions.view",
  PERMISSIONS_MANAGE = "permissions.manage",
  
  // Automation permissions
  AUTOMATION_VIEW = "automation.view",
  AUTOMATION_CREATE = "automation.create",
  AUTOMATION_EDIT = "automation.edit",
  AUTOMATION_DELETE = "automation.delete",
  AUTOMATION_MANAGE = "automation.manage",
  
  // API Key permissions
  API_KEYS_VIEW = "api_keys.view",
  API_KEYS_CREATE = "api_keys.create",
  API_KEYS_EDIT = "api_keys.edit",
  API_KEYS_DELETE = "api_keys.delete",
  API_KEYS_MANAGE = "api_keys.manage",
  
  // IMPORTANT: This is added to fix references in code
  // This permission is used in routes, so must be defined here
  SYSTEM_ADMIN = "system.admin"
}

/**
 * Gets default permissions for a specific role
 * 
 * @param role - Role name
 * @returns Array of permission codes for the role
 */
export function getPermissionsForRole(role: string): string[] {
  // Convert role to lowercase for consistent comparison
  const normalizedRole = role.toLowerCase();
  
  // Base permissions that all users should have
  const basePermissions = [
    SystemPermission.PROFILE_VIEW,
    SystemPermission.PROFILE_EDIT,
    SystemPermission.DASHBOARD_ACCESS,
    SystemPermission.NOTIFICATIONS_VIEW
  ];
  
  // Role-specific permissions
  switch (normalizedRole) {
    case 'admin':
      // Admin should have ALL permissions - return all available system permissions
      return Object.values(SystemPermission);
      
    case 'manager':
      return [
        ...basePermissions,
        // User management
        SystemPermission.USERS_VIEW,
        SystemPermission.USERS_CREATE,
        SystemPermission.USERS_EDIT,
        // Customer management
        SystemPermission.CUSTOMERS_VIEW,
        SystemPermission.CUSTOMERS_CREATE,
        SystemPermission.CUSTOMERS_EDIT,
        SystemPermission.CUSTOMERS_DELETE,
        // Request management
        SystemPermission.REQUESTS_VIEW,
        SystemPermission.REQUESTS_CREATE,
        SystemPermission.REQUESTS_EDIT,
        SystemPermission.REQUESTS_DELETE,
        SystemPermission.REQUESTS_APPROVE,
        SystemPermission.REQUESTS_REJECT,
        SystemPermission.REQUESTS_ASSIGN,
        SystemPermission.REQUESTS_CONVERT,
        // Appointment management
        SystemPermission.APPOINTMENTS_VIEW,
        SystemPermission.APPOINTMENTS_CREATE,
        SystemPermission.APPOINTMENTS_EDIT,
        SystemPermission.APPOINTMENTS_DELETE,
        // Settings
        SystemPermission.SETTINGS_VIEW,
        // Permission management (limited)
        SystemPermission.PERMISSIONS_VIEW,
        // Automation management
        SystemPermission.AUTOMATION_VIEW,
        SystemPermission.AUTOMATION_CREATE,
        SystemPermission.AUTOMATION_EDIT,
        SystemPermission.AUTOMATION_DELETE,
        // API Key management
        SystemPermission.API_KEYS_VIEW,
        SystemPermission.API_KEYS_CREATE,
        SystemPermission.API_KEYS_EDIT,
        SystemPermission.API_KEYS_DELETE,
        SystemPermission.API_KEYS_MANAGE
      ];
      
    case 'staff':
      return [
        ...basePermissions,
        // Limited customer access
        SystemPermission.CUSTOMERS_VIEW,
        SystemPermission.CUSTOMERS_CREATE,
        // Request handling
        SystemPermission.REQUESTS_VIEW,
        SystemPermission.REQUESTS_CREATE,
        SystemPermission.REQUESTS_EDIT,
        // Appointment management
        SystemPermission.APPOINTMENTS_VIEW,
        SystemPermission.APPOINTMENTS_CREATE,
        SystemPermission.APPOINTMENTS_EDIT,
      ];
      
    case 'guest':
      return [
        ...basePermissions,
        // Read-only access
        SystemPermission.CUSTOMERS_VIEW,
        SystemPermission.REQUESTS_VIEW,
        SystemPermission.APPOINTMENTS_VIEW,
      ];
      
    default:
      // Unknown role gets only base permissions
      return basePermissions;
  }
}
