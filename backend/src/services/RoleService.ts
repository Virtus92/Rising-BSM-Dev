import { BaseService } from '../core/BaseService.js';
import { IRoleService } from '../interfaces/IRoleService.js';
import { IRoleRepository } from '../interfaces/IRoleRepository.js';
import { IPermissionRepository } from '../interfaces/IPermissionRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IValidationService } from '../interfaces/IValidationService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { Role } from '../entities/Role.js';
import { Permission } from '../entities/Permission.js';
import { 
  RoleCreateDto, 
  RoleUpdateDto, 
  RoleResponseDto,
  RoleDetailResponseDto,
  PermissionAssignmentDto
} from '../dtos/RoleDtos.js';
import { ServiceOptions } from '../interfaces/IBaseService.js';

/**
 * Implementation of IRoleService
 * Provides business logic for managing roles and their permissions
 */
export class RoleService extends BaseService<Role, RoleCreateDto, RoleUpdateDto, RoleResponseDto> implements IRoleService {
  /**
   * Creates a new RoleService instance
   * 
   * @param roleRepository - Role repository
   * @param permissionRepository - Permission repository
   * @param logger - Logging service
   * @param validator - Validation service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository,
    logger: ILoggingService,
    validator: IValidationService,
    errorHandler: IErrorHandler
  ) {
    super(roleRepository, logger, validator, errorHandler);
    this.logger.debug('Initialized RoleService');
  }

  /**
   * Get detailed role information including permissions
   * 
   * @param id - Role ID
   * @param options - Service options
   * @returns Promise with detailed role response
   */
  async getRoleDetails(id: number, options?: ServiceOptions): Promise<RoleDetailResponseDto | null> {
    try {
      const role = await this.roleRepository.findByIdWithPermissions(id);
      
      if (!role) {
        return null;
      }
      
      // Map to response DTO with permissions
      const roleDto = this.toDTO(role) as RoleResponseDto;
      
      // Get permissions assigned to this role
      const permissions = await this.roleRepository.getRolePermissions(id);
      
      return {
        ...roleDto,
        permissions: permissions.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          category: p.category
        }))
      };
    } catch (error) {
      this.logger.error('Error in RoleService.getRoleDetails', error instanceof Error ? error : String(error), { id });
      throw this.handleError(error);
    }
  }

  /**
   * Get all permissions
   * 
   * @returns Promise with all permissions
   */
  async getAllPermissions(options?: ServiceOptions): Promise<Permission[]> {
    try {
      const result = await this.permissionRepository.findAll(options);
      // Extract the data array from the paginated result
      return result.data || [];
    } catch (error) {
      this.logger.error('Error in RoleService.getAllPermissions', error instanceof Error ? error : String(error));
      throw this.handleError(error);
    }
  }

  /**
   * Get permissions by category
   * 
   * @param category - Permission category
   * @returns Promise with permissions in the category
   */
  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    try {
      return await this.permissionRepository.findByCriteria({ category });
    } catch (error) {
      this.logger.error('Error in RoleService.getPermissionsByCategory', error instanceof Error ? error : String(error), { category });
      throw this.handleError(error);
    }
  }

  /**
   * Assign permissions to a role
   * 
   * @param roleId - Role ID
   * @param data - Permission assignment data
   * @param options - Service options
   * @returns Promise with updated role details
   */
  async assignPermissions(roleId: number, data: PermissionAssignmentDto, options?: ServiceOptions): Promise<RoleDetailResponseDto> {
    try {
      // Check if role exists
      const role = await this.roleRepository.findById(roleId);
      
      if (!role) {
        throw this.errorHandler.createNotFoundError(`Role with ID ${roleId} not found`);
      }
      
      // Validate permissions - ensure they all exist
      for (const permId of data.permissionIds) {
        const permExists = await this.permissionRepository.findById(permId);
        if (!permExists) {
          throw this.errorHandler.createValidationError('Invalid permission', [`Permission with ID ${permId} does not exist`]);
        }
      }
      
      // Clear existing permissions and assign new ones
      if (data.replaceExisting) {
        await this.roleRepository.replacePermissions(roleId, data.permissionIds);
      } else {
        // Add permissions
        await this.roleRepository.addPermissions(roleId, data.permissionIds);
      }
      
      // Log the activity
      if (options?.context?.userId) {
        await this.roleRepository.logActivity(
          options.context.userId,
          'assign_permissions',
          `Assigned permissions to role ${role.name}`,
          options.context.ipAddress
        );
      }
      
      // Get updated role details
      const updatedRole = await this.getRoleDetails(roleId);
      
      if (!updatedRole) {
        throw this.errorHandler.createError('Failed to retrieve updated role', 500);
      }
      
      return updatedRole;
    } catch (error) {
      this.logger.error('Error in RoleService.assignPermissions', error instanceof Error ? error : String(error), { roleId, data });
      throw this.handleError(error);
    }
  }

  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID
   * @param permissionIds - Array of permission IDs to remove
   * @param options - Service options
   * @returns Promise with updated role details
   */
  async removePermissions(roleId: number, permissionIds: number[], options?: ServiceOptions): Promise<RoleDetailResponseDto> {
    try {
      // Check if role exists
      const role = await this.roleRepository.findById(roleId);
      
      if (!role) {
        throw this.errorHandler.createNotFoundError(`Role with ID ${roleId} not found`);
      }
      
      // Remove permissions
      await this.roleRepository.removePermissions(roleId, permissionIds);
      
      // Log the activity
      if (options?.context?.userId) {
        await this.roleRepository.logActivity(
          options.context.userId,
          'remove_permissions',
          `Removed permissions from role ${role.name}`,
          options.context.ipAddress
        );
      }
      
      // Get updated role details
      const updatedRole = await this.getRoleDetails(roleId);
      
      if (!updatedRole) {
        throw this.errorHandler.createError('Failed to retrieve updated role', 500);
      }
      
      return updatedRole;
    } catch (error) {
      this.logger.error('Error in RoleService.removePermissions', error instanceof Error ? error : String(error), { roleId, permissionIds });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new permission
   * 
   * @param data - Permission data
   * @param options - Service options
   * @returns Promise with created permission
   */
  async createPermission(data: Partial<Permission>, options?: ServiceOptions): Promise<Permission> {
    try {
      // Validate permission data
      if (!data.name || !data.category) {
        throw this.errorHandler.createValidationError('Invalid permission data', [
          !data.name ? 'Permission name is required' : '',
          !data.category ? 'Permission category is required' : ''
        ].filter(Boolean));
      }
      
      // Check if permission already exists with the same name
      const existingPerm = await this.permissionRepository.findByCriteria({ name: data.name });
      
      if (existingPerm.length > 0) {
        throw this.errorHandler.createValidationError('Invalid permission data', [`Permission with name '${data.name}' already exists`]);
      }
      
      // Create the permission
      const permission = await this.permissionRepository.create(data);
      
      // Log the activity
      if (options?.context?.userId) {
        await this.permissionRepository.logActivity(
          options.context.userId,
          'create_permission',
          `Created permission ${permission.name}`,
          options.context.ipAddress
        );
      }
      
      return permission;
    } catch (error) {
      this.logger.error('Error in RoleService.createPermission', error instanceof Error ? error : String(error), { data });
      throw this.handleError(error);
    }
  }

  /**
   * Map entity to response DTO
   * 
   * @param entity - Role entity
   * @returns Role response DTO
   */
  toDTO(entity: Role): RoleResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      isSystem: entity.isSystem,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * Get validation schema for create operation
   * 
   * @returns Validation schema
   */
  protected getCreateValidationSchema(): any {
    return {
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
  }

  /**
   * Get validation schema for update operation
   * 
   * @returns Validation schema
   */
  protected getUpdateValidationSchema(): any {
    return {
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
  }

  /**
   * Map DTO to entity
   * 
   * @param dto - DTO data
   * @param existingEntity - Existing entity (for updates)
   * @returns Entity data
   */
  protected toEntity(dto: RoleCreateDto | RoleUpdateDto, existingEntity?: Role): Partial<Role> {
    if (existingEntity) {
      // Update operation
      return dto;
    } else {
      // Create operation
      return {
        ...dto as RoleCreateDto
      };
    }
  }
}