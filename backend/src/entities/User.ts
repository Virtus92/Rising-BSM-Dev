/**
 * User entity
 * 
 * Domain entity representing a user in the system.
 */
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
     * User role
     */
    role: UserRole;
    
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
     * Check if user has the specified role
     * 
     * @param role - Role to check
     * @returns Whether user has the role
     */
    hasRole(role: UserRole): boolean {
      return this.role === role;
    }
  
    /**
     * Check if user is an administrator
     * 
     * @returns Whether user is an administrator
     */
    isAdmin(): boolean {
      return this.role === UserRole.ADMIN;
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