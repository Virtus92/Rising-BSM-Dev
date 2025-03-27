import { Role } from '../entities/Role.js';
import { QueryOptions, FilterCriteria, IBaseRepository } from './IBaseRepository.js';

/**
 * Role repository interface
 */
export interface IRoleRepository extends IBaseRepository<Role, number> {
  /**
   * Find role by name
   * 
   * @param name - Role name
   * @returns Promise with found role or null
   */
  findByName(name: string): Promise<Role | null>;
  
  /**
   * Get roles for a user
   * 
   * @param userId - User ID
   * @returns Promise with array of roles
   */
  getRolesForUser(userId: number): Promise<Role[]>;
  
  /**
   * Assign roles to a user
   * 
   * @param userId - User ID
   * @param roleIds - Array of role IDs
   * @returns Promise with number of roles assigned
   */
  assignRolesToUser(userId: number, roleIds: number[]): Promise<number>;
  
  /**
   * Remove roles from a user
   * 
   * @param userId - User ID
   * @param roleIds - Array of role IDs to remove (or all if undefined)
   * @returns Promise with number of roles removed
   */
  removeRolesFromUser(userId: number, roleIds?: number[]): Promise<number>;
  
  /**
   * Set permissions for a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs
   * @returns Promise with role with updated permissions
   */
  setPermissions(roleId: number, permissionIds: number[]): Promise<Role>;
  
  /**
   * Add permissions to a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs
   * @returns Promise with number of permissions added
   */
  addPermissions(roleId: number, permissionIds: number[]): Promise<number>;
  
  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs (or all if undefined)
   * @returns Promise with number of permissions removed
   */
  removePermissions(roleId: number, permissionIds?: number[]): Promise<number>;
}