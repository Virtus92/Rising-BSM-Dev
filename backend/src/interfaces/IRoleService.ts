import { IBaseService } from './IBaseService.js';
import { Role } from '../entities/Role.js';
import { Permission } from '../entities/Permission.js';
import { 
  RoleCreateDto, 
  RoleUpdateDto, 
  RoleResponseDto, 
  RoleDetailResponseDto,
  PermissionAssignmentDto
} from '../dtos/RoleDtos.js';
import { ServiceOptions } from './IBaseService.js';

/**
 * IRoleService
 * 
 * Service interface for Role entity operations.
 * Extends the base service interface with role-specific methods.
 */
export interface IRoleService extends IBaseService<Role, RoleCreateDto, RoleUpdateDto, RoleResponseDto> {
  /**
   * Get detailed role information including permissions
   * 
   * @param id - Role ID
   * @param options - Service options
   * @returns Promise with detailed role response
   */
  getRoleDetails(id: number, options?: ServiceOptions): Promise<RoleDetailResponseDto | null>;
  
  /**
   * Get all permissions
   * 
   * @param options - Service options
   * @returns Promise with all permissions
   */
  getAllPermissions(options?: ServiceOptions): Promise<Permission[]>;
  
  /**
   * Get permissions by category
   * 
   * @param category - Permission category
   * @returns Promise with permissions in the category
   */
  getPermissionsByCategory(category: string): Promise<Permission[]>;
  
  /**
   * Assign permissions to a role
   * 
   * @param roleId - Role ID
   * @param data - Permission assignment data
   * @param options - Service options
   * @returns Promise with updated role details
   */
  assignPermissions(roleId: number, data: PermissionAssignmentDto, options?: ServiceOptions): Promise<RoleDetailResponseDto>;
  
  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to remove
   * @param options - Service options
   * @returns Promise with updated role details
   */
  removePermissions(roleId: number, permissionIds: number[], options?: ServiceOptions): Promise<RoleDetailResponseDto>;
  
  /**
   * Create a new permission
   * 
   * @param data - Permission data
   * @param options - Service options
   * @returns Promise with created permission
   */
  createPermission(data: Partial<Permission>, options?: ServiceOptions): Promise<Permission>;
}