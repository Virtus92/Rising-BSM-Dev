/**
 * PermissionSeed
 * 
 * Utility for seeding permissions and roles in the database.
 * Used during initial setup and migrations.
 */
import { PrismaClient } from '@prisma/client';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IPermissionRepository } from '../interfaces/IPermissionRepository.js';
import { IRoleRepository } from '../interfaces/IRoleRepository.js';
import { Permission } from '../entities/Permission.js';
import { Role } from '../entities/Role.js';
import { UserRole } from '../entities/User.js';

/**
 * Permission categories
 */
export enum PermissionCategory {
  USER = 'user',
  CUSTOMER = 'customer',
  PROJECT = 'project',
  SERVICE = 'service',
  APPOINTMENT = 'appointment',
  INVOICE = 'invoice',
  NOTIFICATION = 'notification',
  REPORT = 'report',
  SYSTEM = 'system'
}

/**
 * Permission actions
 */
export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE = 'manage',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve'
}

/**
 * Permission definition
 */
export interface PermissionDefinition {
  /**
   * Permission name (e.g., 'user:view')
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
  
  /**
   * Default roles that have this permission
   */
  defaultRoles?: UserRole[];
}

/**
 * PermissionSeed class
 */
export class PermissionSeed {
  /**
   * Permission definitions
   */
  private permissions: PermissionDefinition[] = [];
  
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
  ) {
    this.initializePermissions();
  }

  /**
   * Seed permissions and roles
   */
  async seed(): Promise<void> {
    this.logger.info('Seeding permissions and roles...');
    
    try {
      // Create permissions
      await this.createPermissions();
      
      // Create default roles
      await this.createDefaultRoles();
      
      // Assign permissions to roles
      await this.assignPermissionsToRoles();
      
      this.logger.info('Permissions and roles seeded successfully');
    } catch (error) {
      this.logger.error('Error seeding permissions and roles', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Create permissions
   */
  private async createPermissions(): Promise<void> {
    this.logger.info(`Creating ${this.permissions.length} permissions...`);
    
    for (const permissionDef of this.permissions) {
      try {
        // Check if permission already exists
        const existing = await this.permissionRepository.findByName(permissionDef.name);
        
        if (existing) {
          // Update existing permission
          await this.permissionRepository.update(existing.id, {
            description: permissionDef.description,
            category: permissionDef.category
          });
          
          this.logger.debug(`Updated permission: ${permissionDef.name}`);
        } else {
          // Create new permission
          const permission = new Permission({
            name: permissionDef.name,
            description: permissionDef.description,
            category: permissionDef.category
          });
          
          await this.permissionRepository.create(permission);
          
          this.logger.debug(`Created permission: ${permissionDef.name}`);
        }
      } catch (error) {
        this.logger.error(`Error creating permission ${permissionDef.name}`, error instanceof Error ? error : String(error));
      }
    }
  }

  /**
   * Create default roles
   */
  private async createDefaultRoles(): Promise<void> {
    this.logger.info('Creating default roles...');
    
    const defaultRoles: { name: string; description: string; isSystem: boolean; }[] = [
      {
        name: UserRole.ADMIN,
        description: 'Administrator with full access to all features',
        isSystem: true
      },
      {
        name: UserRole.MANAGER,
        description: 'Manager with access to most features',
        isSystem: true
      },
      {
        name: UserRole.USER,
        description: 'Regular user with limited access',
        isSystem: true
      }
    ];
    
    for (const roleDef of defaultRoles) {
      try {
        // Check if role already exists
        const existing = await this.roleRepository.findByName(roleDef.name);
        
        if (existing) {
          // Update existing role
          await this.roleRepository.update(existing.id, {
            description: roleDef.description,
            isSystem: roleDef.isSystem
          });
          
          this.logger.debug(`Updated role: ${roleDef.name}`);
        } else {
          // Create new role
          const role = new Role({
            name: roleDef.name,
            description: roleDef.description,
            isSystem: roleDef.isSystem
          });
          
          await this.roleRepository.create(role);
          
          this.logger.debug(`Created role: ${roleDef.name}`);
        }
      } catch (error) {
        this.logger.error(`Error creating role ${roleDef.name}`, error instanceof Error ? error : String(error));
      }
    }
  }

  /**
   * Assign permissions to roles
   */
  private async assignPermissionsToRoles(): Promise<void> {
    this.logger.info('Assigning permissions to roles...');
    
    // Get all roles
    const adminRole = await this.roleRepository.findByName(UserRole.ADMIN);
    const managerRole = await this.roleRepository.findByName(UserRole.MANAGER);
    const userRole = await this.roleRepository.findByName(UserRole.USER);
    
    if (!adminRole || !managerRole || !userRole) {
      throw new Error('Default roles not found');
    }
    
    // Get all permissions
    const allPermissions: Permission[] = [];
    for (const permDef of this.permissions) {
      const permission = await this.permissionRepository.findByName(permDef.name);
      if (permission) {
        allPermissions.push(permission);
      }
    }
    
    // Assign all permissions to admin role
    const adminPermissionIds = allPermissions.map(p => p.id);
    await this.roleRepository.setPermissions(adminRole.id, adminPermissionIds);
    
    // Assign permissions to manager role
    const managerPermissions = this.permissions.filter(p => {
      if (!p.defaultRoles) return false;
      return p.defaultRoles.includes(UserRole.MANAGER);
    });
    
    const managerPermissionIds: number[] = [];
    for (const p of managerPermissions) {
      const permission = await this.permissionRepository.findByName(p.name);
      if (permission) {
        managerPermissionIds.push(permission.id);
      }
    }
    
    await this.roleRepository.setPermissions(managerRole.id, managerPermissionIds);
    
    // Assign permissions to user role
    const userPermissions = this.permissions.filter(p => {
      if (!p.defaultRoles) return false;
      return p.defaultRoles.includes(UserRole.USER);
    });
    
    const userPermissionIds: number[] = [];
    for (const p of userPermissions) {
      const permission = await this.permissionRepository.findByName(p.name);
      if (permission) {
        userPermissionIds.push(permission.id);
      }
    }
    
    await this.roleRepository.setPermissions(userRole.id, userPermissionIds);
  }

  /**
   * Initialize permission definitions
   */
  private initializePermissions(): void {
    // Define permissions for each category and action
    
    // User permissions
    this.addPermissionSet(PermissionCategory.USER, [
      {
        action: PermissionAction.VIEW,
        description: 'View user information',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.CREATE,
        description: 'Create new users',
        defaultRoles: [UserRole.ADMIN]
      },
      {
        action: PermissionAction.EDIT,
        description: 'Edit existing users',
        defaultRoles: [UserRole.ADMIN]
      },
      {
        action: PermissionAction.DELETE,
        description: 'Delete users',
        defaultRoles: [UserRole.ADMIN]
      }
    ]);
    
    // Customer permissions
    this.addPermissionSet(PermissionCategory.CUSTOMER, [
      {
        action: PermissionAction.VIEW,
        description: 'View customer information',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]
      },
      {
        action: PermissionAction.CREATE,
        description: 'Create new customers',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.EDIT,
        description: 'Edit existing customers',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.DELETE,
        description: 'Delete customers',
        defaultRoles: [UserRole.ADMIN]
      },
      {
        action: PermissionAction.EXPORT,
        description: 'Export customer data',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      }
    ]);
    
    // Project permissions
    this.addPermissionSet(PermissionCategory.PROJECT, [
      {
        action: PermissionAction.VIEW,
        description: 'View project information',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]
      },
      {
        action: PermissionAction.CREATE,
        description: 'Create new projects',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.EDIT,
        description: 'Edit existing projects',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.DELETE,
        description: 'Delete projects',
        defaultRoles: [UserRole.ADMIN]
      }
    ]);
    
    // Service permissions
    this.addPermissionSet(PermissionCategory.SERVICE, [
      {
        action: PermissionAction.VIEW,
        description: 'View service information',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]
      },
      {
        action: PermissionAction.CREATE,
        description: 'Create new services',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.EDIT,
        description: 'Edit existing services',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.DELETE,
        description: 'Delete services',
        defaultRoles: [UserRole.ADMIN]
      }
    ]);
    
    // Appointment permissions
    this.addPermissionSet(PermissionCategory.APPOINTMENT, [
      {
        action: PermissionAction.VIEW,
        description: 'View appointment information',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]
      },
      {
        action: PermissionAction.CREATE,
        description: 'Create new appointments',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.EDIT,
        description: 'Edit existing appointments',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.DELETE,
        description: 'Delete appointments',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      }
    ]);
    
    // Invoice permissions
    this.addPermissionSet(PermissionCategory.INVOICE, [
      {
        action: PermissionAction.VIEW,
        description: 'View invoice information',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.CREATE,
        description: 'Create new invoices',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.EDIT,
        description: 'Edit existing invoices',
        defaultRoles: [UserRole.ADMIN]
      },
      {
        action: PermissionAction.DELETE,
        description: 'Delete invoices',
        defaultRoles: [UserRole.ADMIN]
      },
      {
        action: PermissionAction.APPROVE,
        description: 'Approve invoices',
        defaultRoles: [UserRole.ADMIN]
      }
    ]);
    
    // Notification permissions
    this.addPermissionSet(PermissionCategory.NOTIFICATION, [
      {
        action: PermissionAction.VIEW,
        description: 'View notifications',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]
      },
      {
        action: PermissionAction.MANAGE,
        description: 'Manage notifications',
        defaultRoles: [UserRole.ADMIN]
      }
    ]);
    
    // Report permissions
    this.addPermissionSet(PermissionCategory.REPORT, [
      {
        action: PermissionAction.VIEW,
        description: 'View reports',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      },
      {
        action: PermissionAction.CREATE,
        description: 'Create custom reports',
        defaultRoles: [UserRole.ADMIN]
      },
      {
        action: PermissionAction.EXPORT,
        description: 'Export reports',
        defaultRoles: [UserRole.ADMIN, UserRole.MANAGER]
      }
    ]);
    
    // System permissions
    this.addPermissionSet(PermissionCategory.SYSTEM, [
      {
        action: PermissionAction.VIEW,
        description: 'View system settings',
        defaultRoles: [UserRole.ADMIN]
      },
      {
        action: PermissionAction.EDIT,
        description: 'Edit system settings',
        defaultRoles: [UserRole.ADMIN]
      }
    ]);
    
    // Add wildcard permissions for each category
    for (const category of Object.values(PermissionCategory)) {
      this.permissions.push({
        name: `${category}:*`,
        description: `Full access to ${category} features`,
        category,
        defaultRoles: [UserRole.ADMIN]
      });
    }
  }

  /**
   * Add permission set for a category
   * 
   * @param category - Permission category
   * @param permissions - Array of permission definitions
   */
  private addPermissionSet(
    category: string, 
    permissions: Array<{
      action: string;
      description: string;
      defaultRoles?: UserRole[];
    }>
  ): void {
    for (const perm of permissions) {
      this.permissions.push({
        name: `${category}:${perm.action}`,
        description: perm.description,
        category,
        defaultRoles: perm.defaultRoles
      });
    }
  }
}

export default PermissionSeed;