import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';

/**
 * Permission Data Transfer Object
 */
export interface PermissionDto {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Create Permission Data Transfer Object
 */
export interface CreatePermissionDto {
  code: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Update Permission Data Transfer Object
 */
export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  category?: string;
}

/**
 * Permission Response Data Transfer Object
 */
export interface PermissionResponseDto extends BaseResponseDto {
  code: string;
  name: string;
  description: string;
  category: string;
}

/**
 * User Permission Data Transfer Object
 */
export interface UserPermissionDto {
  userId: number;
  permissionId: number;
  permissionCode?: string;
  grantedAt: Date | string;
  grantedBy?: number;
}

/**
 * User Permissions Response Data Transfer Object
 */
export interface UserPermissionsResponseDto {
  userId: number;
  role: string;
  permissions: string[];
}

/**
 * Update User Permissions Data Transfer Object
 */
export interface UpdateUserPermissionsDto {
  userId: number;
  permissions: string[];
}

/**
 * Permission Filter Parameters Data Transfer Object
 */
export interface PermissionFilterParamsDto extends BaseFilterParamsDto {
  category?: string;
  code?: string;
  search?: string;
}
