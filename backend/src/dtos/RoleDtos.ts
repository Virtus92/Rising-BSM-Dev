import { Role } from '../entities/Role.js';
import { Permission } from '../entities/Permission.js';

/**
 * Base interface for role DTOs
 */
interface BaseRoleDto {
    /**
     * Common properties shared by all role DTOs
     */
  }
  
  /**
   * DTO for creating a new role
   */
  export interface RoleCreateDto extends BaseRoleDto {
    /**
     * Role name
     */
    name: string;
    
    /**
     * Role description
     */
    description?: string;
    
    /**
     * Whether this is a system role (cannot be deleted)
     */
    isSystem?: boolean;
  }
  
  /**
   * DTO for updating an existing role
   */
  export interface RoleUpdateDto extends BaseRoleDto {
    /**
     * Role name
     */
    name?: string;
    
    /**
     * Role description
     */
    description?: string;
    
    /**
     * Whether this is a system role (cannot be deleted)
     */
    isSystem?: boolean;
  }
  
  /**
   * Permission response DTO for role module
   */
  export interface PermissionResponseDto {
    id: number;
    name: string;
    description: string; // Notice this is not optional
    category: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  /**
   * Role response DTO
   */
  export interface RoleResponseDto {
    id: number;
    name: string;
    description: string;
    isSystem: boolean;
    permissions?: PermissionResponseDto[];
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  /**
   * Role assignment DTO
   */
  export interface RoleAssignmentDto {
    roleId: number;
  }
  
  /**
   * User role assignment DTO
   */
  export interface UserRoleAssignmentDto {
    roleIds: number[];
    replaceExisting?: boolean;
  }
  
  /**
   * Helper functions for role DTOs
   */
  export class RoleDtoUtils {
    /**
     * Convert a role entity to a response DTO
     * 
     * @param role - Role entity
     * @returns Role response DTO
     */
    static toResponseDto(role: Role): RoleResponseDto {
      return {
        id: role.id,
        name: role.name,
        description: role.description || '',
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      };
    }
  
    /**
     * Convert a permission entity to a response DTO
     * 
     * @param permission - Permission entity
     * @returns Permission response DTO
     */
    static permissionToDto(permission: Permission): PermissionResponseDto {
      return {
        id: permission.id,
        name: permission.name,
        description: permission.description || '',
        category: permission.category,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      };
    }
  }
  
  /**
   * DTO for detailed role responses including permissions
   */
  export interface RoleDetailResponseDto extends RoleResponseDto {
    /**
     * Permissions assigned to this role
     */
    permissions: PermissionResponseDto[];
  }
  
  /**
   * DTO for permission assignment
   */
  export interface PermissionAssignmentDto {
    /**
     * Permission IDs to assign
     */
    permissionIds: number[];
    
    /**
     * Whether to replace existing permissions
     */
    replaceExisting: boolean;
  }
  
  /**
   * Validation schema for role creation
   */
  export const roleCreateValidationSchema = {
    name: {
      type: 'string',
      required: true,
      min: 2,
      max: 50,
      messages: {
        required: 'Name is required',
        min: 'Name must be at least 2 characters',
        max: 'Name cannot exceed 50 characters'
      }
    },
    description: {
      type: 'string',
      required: false,
      max: 200,
      messages: {
        max: 'Description cannot exceed 200 characters'
      }
    },
    isSystem: {
      type: 'boolean',
      required: false,
      default: false
    }
  };
  
  /**
   * Validation schema for role update
   */
  export const roleUpdateValidationSchema = {
    name: {
      type: 'string',
      required: false,
      min: 2,
      max: 50,
      messages: {
        min: 'Name must be at least 2 characters',
        max: 'Name cannot exceed 50 characters'
      }
    },
    description: {
      type: 'string',
      required: false,
      max: 200,
      messages: {
        max: 'Description cannot exceed 200 characters'
      }
    },
    isSystem: {
      type: 'boolean',
      required: false
    }
  };
  
  /**
   * Validation schema for permission assignment
   */
  export const permissionAssignmentValidationSchema = {
    permissionIds: {
      type: 'array',
      required: true,
      items: {
        type: 'number',
        integer: true,
        min: 1
      },
      messages: {
        required: 'Permission IDs are required',
        type: 'Permission IDs must be an array'
      }
    },
    replaceExisting: {
      type: 'boolean',
      required: false,
      default: false
    }
  };
  
  /**
   * Validation schema for user role assignment
   */
  export const userRoleAssignmentValidationSchema = {
    roleIds: {
      type: 'array',
      required: true,
      items: {
        type: 'number',
        integer: true,
        min: 1
      },
      messages: {
        required: 'Role IDs are required',
        type: 'Role IDs must be an array'
      }
    },
    replaceExisting: {
      type: 'boolean',
      required: false,
      default: false
    }
  };
  