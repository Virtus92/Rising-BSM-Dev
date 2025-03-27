/**
 * Type extensions for Prisma models to improve TypeScript support
 */

/**
 * Permission model from Prisma
 */
export interface PrismaPermission {
  id: number;
  name: string;
  description: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  roles?: PrismaRolePermission[];
}

/**
 * Role model from Prisma
 */
export interface PrismaRole {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
  permissions?: PrismaRolePermission[];
  users?: PrismaUserRole[];
}

/**
 * RolePermission model from Prisma
 */
export interface PrismaRolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  createdAt: Date;
  role?: PrismaRole;
  permission?: PrismaPermission;
}

/**
 * UserRole model from Prisma
 */
export interface PrismaUserRole {
  id: number;
  userId: number;
  roleId: number;
  createdAt: Date;
  user?: any; // User model interface could be added if needed
  role?: PrismaRole;
}

/**
 * Count result from Prisma
 */
export interface PrismaCount {
  count: number;
}
