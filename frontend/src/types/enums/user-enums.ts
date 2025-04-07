/**
 * User role enumeration
 * Aligned with Prisma schema
 */
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
  USER = "user"
}

/**
 * User status enumeration
 * Aligned with Prisma schema
 */
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  DELETED = "deleted"
}
