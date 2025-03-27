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
   * @param name - Permission name
   * @returns Promise with permission or null if not found
   */
  findByName(name: string): Promise<Permission | null>;
  
  /**
   * Find permissions by category
   * 
   * @param category - Permission category
   * @returns Promise with permissions in that category
   */
  findByCategory(category: string): Promise<Permission[]>;
  
  /**
   * Get all permission categories
   * 
   * @returns Promise with unique category names
   */
  getAllCategories(): Promise<string[]>;
  
  /**
   * Check if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permissionName - Permission name
   * @returns Promise with boolean indicating if user has permission
   */
  checkUserPermission(userId: number, permissionName: string): Promise<boolean>;
  
  /**
   * Get all permissions for a user
   * 
   * @param userId - User ID
   * @returns Promise with user's permissions
   */
  getUserPermissions(userId: number): Promise<Permission[]>;
  
  /**
   * Create multiple permissions at once
   * 
   * @param permissions - Array of permission data
   * @returns Promise with created permissions
   */
  createMany(permissions: Partial<Permission>[]): Promise<Permission[]>;
}