/**
 * User entity
 * 
 * Domain entity representing a user in the system.
 */
import { Role } from './Role.js';

export class User {
    /**
     * User ID
     */
    id: number;
    
    /**
     * Username
     */
    username: string;
    
    /**
     * Email address
     */
    email: string;
    
    /**
     * Hashed password
     */
    password?: string;
    
    /**
     * First name
     */
    firstName: string;
    
    /**
     * Last name
     */
    lastName: string;

    /**
     * User role (legacy field for backward compatibility)
     */
    role: UserRole;

    /**
     * User roles (role IDs)
     */
    roles: number[];
    
    /**
     * Account status
     */
    status: UserStatus;
    
    /**
     * Creation timestamp
     */
    createdAt: Date;
    
    /**
     * Last update timestamp
     */
    updatedAt: Date;
    
    /**
     * ID of the user who created this user
     */
    createdBy?: number;
    
    /**
     * ID of the user who last updated this user
     */
    updatedBy?: number;
    
    /**
     * Last login timestamp
     */
    lastLoginAt?: Date;
    
    // Role objects for permission checking
    private _roleObjects: Role[] = [];
  
    /**
     * Creates a new User instance
     * 
     * @param data - User data
     */
    constructor(data: Partial<User> = {}) {
      this.id = data.id || 0;
      this.username = data.username || '';
      this.email = data.email || '';
      this.password = data.password;
      this.firstName = data.firstName || '';
      this.lastName = data.lastName || '';
      this.role = data.role || UserRole.USER;
      this.roles = data.roles || [];
      this.status = data.status || UserStatus.ACTIVE;
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
      this.createdBy = data.createdBy;
      this.updatedBy = data.updatedBy;
      this.lastLoginAt = data.lastLoginAt;
    }
  
    /**
     * Get full name
     * 
     * @returns Formatted full name
     */
    getFullName(): string {
      return `${this.firstName} ${this.lastName}`.trim();
    }
  
    /**
     * Check if user is active
     * 
     * @returns Whether user is active
     */
    isActive(): boolean {
      return this.status === UserStatus.ACTIVE;
    }
  
    /**
     * Set role objects for permission checking
     * 
     * @param roles - Role objects
     */
    setRoles(roles: Role[]): void {
      this._roleObjects = roles;
      this.roles = roles.map(r => r.id);
    }
    
    /**
     * Check if user has a specific permission
     * 
     * @param permission - Permission name
     * @returns Whether user has the permission
     */
    hasPermission(permission: string): boolean {
      // Admin role has all permissions
      if (this.role === UserRole.ADMIN) {
        return true;
      }
      
      // Check permissions from role objects
      if (this._roleObjects.length > 0) {
        return this._roleObjects.some(role => role.hasPermission(permission));
      }
      
      // Fall back to checking based on role (legacy approach)
      return this.getDefaultPermissions().includes(permission);
    }
    
    /**
     * Get default permissions based on role (legacy approach)
     * 
     * @returns Array of permission names
     */
    private getDefaultPermissions(): string[] {
      // This is a fallback for when role objects aren't loaded
      switch (this.role) {
        case UserRole.ADMIN:
          return ['*']; // Admin has all permissions
        case UserRole.MANAGER:
          return [
            'user:view', 'customer:*', 'project:*', 'appointment:*',
            'service:view', 'service:create', 'service:edit',
            'notification:*', 'report:*'
          ];
        case UserRole.USER:
          return [
            'customer:view', 'project:view', 'appointment:view',
            'service:view', 'notification:view'
          ];
        default:
          return [];
      }
    }
  
    /**
     * Update user properties
     * 
     * @param data - User data to update
     */
    update(data: Partial<User>): void {
      // Update only defined properties
      if (data.username !== undefined) this.username = data.username;
      if (data.email !== undefined) this.email = data.email;
      if (data.firstName !== undefined) this.firstName = data.firstName;
      if (data.lastName !== undefined) this.lastName = data.lastName;
      if (data.role !== undefined) this.role = data.role;
      if (data.roles !== undefined) this.roles = data.roles;
      if (data.status !== undefined) this.status = data.status;
      if (data.password !== undefined) this.password = data.password;
      
      // Always update the updatedAt timestamp
      this.updatedAt = new Date();
    }
  
    /**
     * Set last login timestamp
     */
    recordLogin(): void {
      this.lastLoginAt = new Date();
    }
  
    /**
     * Deactivate user
     * 
     * @param updatedBy - ID of user making the change
     */
    deactivate(updatedBy?: number): void {
      this.status = UserStatus.INACTIVE;
      this.updatedAt = new Date();
      if (updatedBy) this.updatedBy = updatedBy;
    }
  
    /**
     * Activate user
     * 
     * @param updatedBy - ID of user making the change
     */
    activate(updatedBy?: number): void {
      this.status = UserStatus.ACTIVE;
      this.updatedAt = new Date();
      if (updatedBy) this.updatedBy = updatedBy;
    }
    
    /**
     * Check if user is an admin
     * 
     * @returns Whether user is an admin
     */
    get isAdmin(): boolean {
      return this.role === UserRole.ADMIN;
    }
  }
  
  /**
   * User role enum
   */
  export enum UserRole {
    ADMIN = 'admin',
    MANAGER = 'manager',
    USER = 'user'
  }
  
  /**
   * User status enum
   */
  export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    DELETED = 'deleted'
  }