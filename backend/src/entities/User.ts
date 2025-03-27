/**
 * User entity
 * 
 * Domain entity representing a user in the system.
 * Aligned with the Prisma schema.
 */
export class User {
  /**
   * User ID
   */
  id: number;
  
  /**
   * User name
   */
  name: string;
  
  /**
   * Email address
   */
  email: string;
  
  /**
   * Hashed password
   */
  password?: string;
  
  /**
   * User role
   */
  role: UserRole;
  
  /**
   * Phone number
   */
  phone?: string;
  
  /**
   * Account status
   */
  status: UserStatus;
  
  /**
   * Profile picture URL
   */
  profilePicture?: string;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Last update timestamp
   */
  updatedAt: Date;
  
  /**
   * Last login timestamp
   */
  lastLoginAt?: Date;
  
  /**
   * Password reset token
   */
  resetToken?: string;
  
  /**
   * Password reset token expiry
   */
  resetTokenExpiry?: Date;

  /**
   * Creates a new User instance
   * 
   * @param data - User data
   */
  constructor(data: Partial<User> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.email = data.email || '';
    this.password = data.password;
    this.role = data.role || UserRole.EMPLOYEE;
    this.phone = data.phone;
    this.status = data.status || UserStatus.ACTIVE;
    this.profilePicture = data.profilePicture;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLoginAt = data.lastLoginAt;
    this.resetToken = data.resetToken;
    this.resetTokenExpiry = data.resetTokenExpiry;
  }

  /**
   * Get first and last name from full name
   * 
   * @returns Object with firstName and lastName properties
   */
  getNameParts(): { firstName: string; lastName: string } {
    const parts = this.name.trim().split(' ');
    
    if (parts.length <= 1) {
      return { firstName: this.name, lastName: '' };
    }
    
    const lastName = parts.pop() || '';
    const firstName = parts.join(' ');
    
    return { firstName, lastName };
  }

  /**
   * Get full name
   * 
   * @returns Formatted full name
   */
  getFullName(): string {
    return this.name.trim();
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
   * Check if user has admin role
   * 
   * @returns Whether user is an administrator
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if user has specific role
   * 
   * @param role - Role to check
   * @returns Whether user has the role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  /**
   * Update user properties
   * 
   * @param data - User data to update
   */
  update(data: Partial<User>): void {
    // Update only defined properties
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.role !== undefined) this.role = data.role;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.status !== undefined) this.status = data.status;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
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
  }

  /**
   * Activate user
   * 
   * @param updatedBy - ID of user making the change
   */
  activate(updatedBy?: number): void {
    this.status = UserStatus.ACTIVE;
    this.updatedAt = new Date();
  }
}

/**
 * User role enum
 * Aligned with Prisma schema
 */
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee"
}

/**
 * User status enum
 * Aligned with Prisma schema
 */
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  DELETED = "deleted"
}