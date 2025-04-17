/**
 * User roles in the system
 * 
 * ADMIN - Full system access with all permissions
 * MANAGER - Can manage users, customers, requests, and appointments
 * EMPLOYEE - Regular staff member with limited management capabilities
 * USER - Basic access for customers and limited features
 */
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
  USER = "user"
}

/**
 * User status in the system
 * 
 * ACTIVE - User can log in and access the system according to their permissions
 * INACTIVE - Account is created but temporarily disabled, can be reactivated
 * SUSPENDED - Account is temporarily blocked due to policy violations
 * DELETED - Account has been marked for deletion (soft-delete)
 */
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  DELETED = "deleted"
}

/**
 * Flags for system-managed vs user-manageable statuses
 */
export const SYSTEM_MANAGED_STATUSES = [UserStatus.DELETED];
export const USER_MANAGEABLE_STATUSES = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED];

/**
 * Check if a status can be managed by regular users
 * 
 * @param status - Status to check
 * @returns Whether the status can be managed by users
 */
export function isUserManageableStatus(status: UserStatus): boolean {
  return USER_MANAGEABLE_STATUSES.includes(status);
}
