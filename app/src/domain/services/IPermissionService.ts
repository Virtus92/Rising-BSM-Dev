import { IBaseService, ServiceOptions } from './IBaseService';
import { Permission } from '../entities/Permission';
import { 
  CreatePermissionDto, 
  UpdatePermissionDto, 
  PermissionResponseDto,
  UserPermissionsResponseDto,
  UpdateUserPermissionsDto,
  PermissionFilterParamsDto
} from '../dtos/PermissionDtos';
import { PaginationResult } from '../repositories/IBaseRepository';

/**
 * Permission Service Interface
 */
export interface IPermissionService extends IBaseService<Permission, CreatePermissionDto, UpdatePermissionDto, PermissionResponseDto> {
  /**
   * Finds a permission by its code
   * 
   * @param code - Permission code
   * @param options - Service options
   * @returns Found permission or null
   */
  findByCode(code: string, options?: ServiceOptions): Promise<PermissionResponseDto | null>;
  
  /**
   * Finds permissions with advanced filtering options
   * 
   * @param filters - Filter parameters
   * @param options - Service options
   * @returns Found permissions with pagination
   */
  findPermissions(filters: PermissionFilterParamsDto, options?: ServiceOptions): 
    Promise<PaginationResult<PermissionResponseDto>>;
  
  /**
   * Gets all permissions for a user
   * 
   * @param userId - User ID
   * @param options - Service options
   * @returns User's permissions
   */
  getUserPermissions(userId: number, options?: ServiceOptions): Promise<UserPermissionsResponseDto>;
  
  /**
   * Updates permissions for a user
   * 
   * @param data - Update data
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  updateUserPermissions(data: UpdateUserPermissionsDto, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Adds a permission to a user
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  addUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Removes a permission from a user
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @param options - Service options
   * @returns Whether the operation was successful
   */
  removeUserPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permissionCode - Permission code
   * @param options - Service options
   * @returns Whether the user has the permission
   */
  hasPermission(userId: number, permissionCode: string, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Gets the default permissions for a role
   * 
   * @param role - User role
   * @param options - Service options
   * @returns Default permissions for the role
   */
  getDefaultPermissionsForRole(role: string, options?: ServiceOptions): Promise<string[]>;
  
  /**
   * Sets default permissions for a role
   * 
   * @param role - Role name
   * @param permissions - Array of permission codes
   * @param options - Service options
   * @returns Updated permissions for the role
   */
  setDefaultPermissionsForRole(role: string, permissions: string[], options?: ServiceOptions): Promise<string[]>;
  
  /**
   * Gets role permissions from the database with fallback to defaults
   * 
   * @param role - Role name
   * @param options - Service options
   * @returns Permissions for the role
   */
  getRolePermissions(role: string, options?: ServiceOptions): Promise<string[]>;
}