import { IBaseRepository } from './IBaseRepository.js';
import { Permission } from '../entities/Permission.js';

/**
 * IPermissionRepository
 * 
 * Repository interface for Permission entity operations.
 * Extends the base repository interface with permission-specific methods.
 */
export interface IPermissionRepository extends IBaseRepository<Permission, number> {
  /**
   * Find a permission by name
   * 
   * @param name - Permission name to search for
   * @returns Promise with permission or null if not found
   */
  findByName(name: string): Promise<Permission | null>;
  
  /**
   * Get all permissions by category
   * 
   * @param category - Category name
   * @returns Promise with array of permissions
   */
  findByCategory(category: string): Promise<Permission[]>;
  
  /**
   * Get permissions for a role
   * 
   * @param roleId - Role ID
   * @returns Promise with array of permissions
   */
  getPermissionsByRole(roleId: number): Promise<Permission[]>;
  
  /**
   * Get permissions for a user based on their roles
   * 
   * @param userId - User ID
   * @returns Promise with array of permissions
   */
  getUserPermissions(userId: number): Promise<Permission[]>;
  
  /**
   * Check if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permissionName - Permission name to check
   * @returns Promise indicating whether the user has the permission
   */
  checkUserPermission(userId: number, permissionName: string): Promise<boolean>;
  
  /**
   * Assign permissions to a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to assign
   * @returns Promise with the number of permissions assigned
   */
  assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<number>;
  
  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to remove
   * @returns Promise with the number of permissions removed
   */
  removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<number>;
  
  /**
   * Get all unique categories
   * 
   * @returns Promise with array of category names
   */
  getAllCategories(): Promise<string[]>;
}