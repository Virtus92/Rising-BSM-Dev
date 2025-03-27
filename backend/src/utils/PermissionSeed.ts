import { Permission } from '../entities/Permission.js';
import { IPermissionRepository } from '../interfaces/IPermissionRepository.js';
import { IRoleRepository } from '../interfaces/IRoleRepository.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';

/**
 * Utility class for seeding permissions and initial roles
 */
export class PermissionSeed {
  /**
   * Creates a new PermissionSeed instance
   * 
   * @param permissionRepository - Permission repository
   * @param roleRepository - Role repository
   * @param logger - Logging service
   */
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly logger: ILoggingService
  ) {}

  /**
   * Seed predefined permissions
   * 
   * @returns Promise with result information
   */
  async seedPermissions(): Promise<{ created: number; existing: number }> {
    const permissionsToCreate = this.getDefaultPermissions();
    
    try {
      let created = 0;
      let existing = 0;
      
      // Check which permissions already exist
      for (const permission of permissionsToCreate) {
        const exists = await this.permissionRepository.findByName(permission.name);
        
        if (!exists) {
          await this.permissionRepository.create(permission);
          this.logger.debug(`Created permission: ${permission.name}`);
          created++;
        } else {
          this.logger.debug(`Permission already exists: ${permission.name}`);
          existing++;
        }
      }
      
      this.logger.info(`Permission seeding completed: ${created} created, ${existing} already existed`);
      
      return { created, existing };
    } catch (error) {
      this.logger.error('Error seeding permissions', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Seed default roles with permissions
   * 
   * @returns Promise indicating success
   */
  async seedRoles(): Promise<boolean> {
    try {
      // Define default roles
      const roles = [
        {
          name: 'admin',
          description: 'Administrator with full system access',
          isSystem: true,
          permissions: this.getAllPermissionNames()
        },
        {
          name: 'manager',
          description: 'Manager with access to most features',
          isSystem: true,
          permissions: this.getManagerPermissionNames()
        },
        {
          name: 'user',
          description: 'Regular user with limited access',
          isSystem: true,
          permissions: this.getUserPermissionNames()
        }
      ];
      
      // Create or update each role
      for (const roleData of roles) {
        let role = await this.roleRepository.findByName(roleData.name);
        
        if (!role) {
          // Create new role
          this.logger.debug(`Creating role: ${roleData.name}`);
          
          role = await this.roleRepository.create({
            name: roleData.name,
            description: roleData.description,
            isSystem: roleData.isSystem
          });
        } else {
          this.logger.debug(`Role already exists: ${roleData.name}`);
          
          // Update role description if needed
          if (role.description !== roleData.description) {
            await this.roleRepository.update(role.id, {
              description: roleData.description
            });
          }
        }
        
        // Get permissions by name
        const permissions = await Promise.all(
          roleData.permissions.map(name => this.permissionRepository.findByName(name))
        );
        
        // Filter out any permissions that weren't found
        const permissionIds = permissions
          .filter(p => p !== null)
          .map(p => p!.id);
        
        // Assign permissions to the role
        await this.roleRepository.replacePermissions(role.id, permissionIds);
      }
      
      this.logger.info('Role seeding completed');
      
      return true;
    } catch (error) {
      this.logger.error('Error seeding roles', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get all permission names
   * 
   * @returns Array of all permission names
   */
  private getAllPermissionNames(): string[] {
    return this.getDefaultPermissions().map(p => p.name);
  }

  /**
   * Get manager permission names
   * 
   * @returns Array of permission names for managers
   */
  private getManagerPermissionNames(): string[] {
    return this.getDefaultPermissions()
      .filter(p => !p.name.includes('user:') && !p.name.includes('role:') && !p.name.includes('permission:'))
      .map(p => p.name);
  }

  /**
   * Get regular user permission names
   * 
   * @returns Array of permission names for regular users
   */
  private getUserPermissionNames(): string[] {
    return [
      'customer:view',
      'notification:view',
      'notification:update'
    ];
  }

  /**
   * Get default permissions
   * 
   * @returns Array of default permissions
   */
  private getDefaultPermissions(): Partial<Permission>[] {
    return [
      // User management
      {
        name: 'user:view',
        description: 'View user information',
        category: 'user-management'
      },
      {
        name: 'user:create',
        description: 'Create new users',
        category: 'user-management'
      },
      {
        name: 'user:update',
        description: 'Update user information',
        category: 'user-management'
      },
      {
        name: 'user:delete',
        description: 'Delete users',
        category: 'user-management'
      },
      
      // Role management
      {
        name: 'role:view',
        description: 'View roles',
        category: 'role-management'
      },
      {
        name: 'role:create',
        description: 'Create new roles',
        category: 'role-management'
      },
      {
        name: 'role:update',
        description: 'Update roles',
        category: 'role-management'
      },
      {
        name: 'role:delete',
        description: 'Delete roles',
        category: 'role-management'
      },
      
      // Permission management
      {
        name: 'permission:view',
        description: 'View permissions',
        category: 'permission-management'
      },
      {
        name: 'permission:create',
        description: 'Create new permissions',
        category: 'permission-management'
      },
      {
        name: 'permission:assign',
        description: 'Assign permissions to roles',
        category: 'permission-management'
      },
      
      // Customer management
      {
        name: 'customer:view',
        description: 'View customers',
        category: 'customer-management'
      },
      {
        name: 'customer:create',
        description: 'Create new customers',
        category: 'customer-management'
      },
      {
        name: 'customer:update',
        description: 'Update customers',
        category: 'customer-management'
      },
      {
        name: 'customer:delete',
        description: 'Delete customers',
        category: 'customer-management'
      },
      {
        name: 'customer:export',
        description: 'Export customer data',
        category: 'customer-management'
      },
      
      // Notification management
      {
        name: 'notification:view',
        description: 'View notifications',
        category: 'notification-management'
      },
      {
        name: 'notification:create',
        description: 'Create notifications',
        category: 'notification-management'
      },
      {
        name: 'notification:update',
        description: 'Update notifications (e.g., mark as read)',
        category: 'notification-management'
      },
      
      // Settings management
      {
        name: 'settings:view',
        description: 'View system settings',
        category: 'settings-management'
      },
      {
        name: 'settings:update',
        description: 'Update system settings',
        category: 'settings-management'
      }
    ];
  }
}