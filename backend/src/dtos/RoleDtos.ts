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
   * DTO for role responses
   */
  export interface RoleResponseDto extends BaseRoleDto {
    /**
     * Role ID
     */
    id: number;
    
    /**
     * Role name
     */
    name: string;
    
    /**
     * Role description
     */
    description: string;
    
    /**
     * Whether this is a system role (cannot be deleted)
     */
    isSystem: boolean;
    
    /**
     * Creation timestamp
     */
    createdAt: string;
    
    /**
     * Last update timestamp
     */
    updatedAt: string;
  }
  
  /**
   * DTO for permission responses
   */
  export interface PermissionResponseDto {
    /**
     * Permission ID
     */
    id: number;
    
    /**
     * Permission name
     */
    name: string;
    
    /**
     * Permission description
     */
    description: string;
    
    /**
     * Permission category
     */
    category: string;
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
   * DTO for user role assignment
   */
  export interface UserRoleAssignmentDto {
    /**
     * Role IDs to assign
     */
    roleIds: number[];
    
    /**
     * Whether to replace existing roles
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