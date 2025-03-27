import { IBaseRepository } from './IBaseRepository.js';
import { Role } from '../entities/Role.js';
import { Permission } from '../entities/Permission.js';

/**
 * IRoleRepository
 * 
 * Repository interface for Role entity operations.
 * Extends the base repository interface with role-specific methods.
 */
export interface IRoleRepository extends IBaseRepository<Role, number> {
  /**
   * Find a role by name
   * 
   * @param name - Role name
   * @returns Promise with role or null if not found
   */
  findByName(name: string): Promise<Role | null>;
  
  /**
   * Find a role by ID and include its permissions
   * 
   * @param id - Role ID
   * @returns Promise with role including permissions
   */
  findByIdWithPermissions(id: number): Promise<Role | null>;
  
  /**
   * Find all roles with their permissions
   * 
   * @returns Promise with roles including permissions
   */
  findAllWithPermissions(): Promise<Role[]>;
  
  /**
   * Get permissions assigned to a role
   * 
   * @param roleId - Role ID
   * @returns Promise with role's permissions
   */
  getRolePermissions(roleId: number): Promise<Permission[]>;
  
  /**
   * Add permissions to a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Permission IDs to add
   * @returns Promise with success indicator
   */
  addPermissions(roleId: number, permissionIds: number[]): Promise<boolean>;
  
  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Permission IDs to remove
   * @returns Promise with success indicator
   */
  removePermissions(roleId: number, permissionIds: number[]): Promise<boolean>;
  
  /**
   * Replace all permissions for a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - New permission IDs
   * @returns Promise with success indicator
   */
  replacePermissions(roleId: number, permissionIds: number[]): Promise<boolean>;
  
  /**
   * Get user roles with their permissions
   * 
   * @param userId - User ID
   * @returns Promise with user's roles including permissions
   */
  getUserRoles(userId: number): Promise<Role[]>;
  
  /**
   * Assign roles to a user
   * 
   * @param userId - User ID
   * @param roleIds - Role IDs to assign
   * @returns Promise with success indicator
   */
  assignRolesToUser(userId: number, roleIds: number[]): Promise<boolean>;
  
  /**
   * Remove roles from a user
   * 
   * @param userId - User ID
   * @param roleIds - Role IDs to remove
   * @returns Promise with success indicator
   */
  removeRolesFromUser(userId: number, roleIds: number[]): Promise<boolean>;
}