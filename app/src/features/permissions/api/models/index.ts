/**
 * Permissions API Models
 * 
 * This file exports API models/schemas for permissions endpoints
 */

/**
 * Permission List Request Model
 */
export interface PermissionListRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  category?: string;
  code?: string;
  search?: string;
}

/**
 * Create Permission Request Model
 */
export interface CreatePermissionRequest {
  code: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Update Permission Request Model
 */
export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
  category?: string;
}

/**
 * Role Defaults Request Model
 */
export interface RoleDefaultsRequest {
  role: string;
}

/**
 * Update User Permissions Request Model
 */
export interface UpdateUserPermissionsRequest {
  userId: number;
  permissions: string[];
}
