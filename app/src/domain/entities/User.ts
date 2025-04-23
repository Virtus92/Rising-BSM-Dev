import { BaseEntity } from './BaseEntity';
import { UserRole, UserStatus } from '../enums/UserEnums';

// Re-export the enums for easy access
export { UserRole, UserStatus } from '../enums/UserEnums';

/**
 * User Entity
 * 
 * Represents a user in the system.
 */
export class User extends BaseEntity {
  /**
   * Username
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
   * User status
   */
  status: UserStatus;
  
  /**
   * Profile picture URL
   */
  profilePicture?: string;
  
  /**
   * User permissions
   */
  permissions?: string[];
  
  /**
   * Last login timestamp
   */
  lastLoginAt?: Date;
  
  /**
   * Password reset token
   */
  resetToken?: string;
  
  /**
   * Expiration timestamp of the password reset token
   */
  resetTokenExpiry?: Date;
  
  /**
   * Constructor
   * 
   * @param data - Initialization data
   */
  constructor(data: Partial<User> = {}) {
    super(data);
    
    this.name = data.name || '';
    this.email = data.email || '';
    this.password = data.password;
    // Ensure role is always a valid UserRole enum value
    this.role = this.validateRole(data.role);
    this.phone = data.phone;
    // Ensure status is always a valid UserStatus enum value
    this.status = this.validateStatus(data.status);
    this.profilePicture = data.profilePicture;
    this.permissions = data.permissions || [];
    this.lastLoginAt = data.lastLoginAt ? new Date(data.lastLoginAt) : undefined;
    this.resetToken = data.resetToken;
    this.resetTokenExpiry = data.resetTokenExpiry ? new Date(data.resetTokenExpiry) : undefined;
  }
  
  /**
   * Returns the first name
   */
  get firstName(): string {
    return this.name.split(' ')[0];
  }
  
  /**
   * Returns the last name
   */
  get lastName(): string {
    const nameParts = this.name.split(' ');
    return nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
  
  /**
   * Returns the full name
   */
  getFullName(): string {
    return this.name.trim();
  }
  
  /**
   * Checks if the user is active
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
  
  /**
   * Checks if the user has admin rights
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
  
  /**
   * Checks if the user has manager rights or higher
   */
  isManagerOrAbove(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.MANAGER;
  }
  
  /**
   * Checks if the user has a specific role
   * 
   * @param role - Role to check
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }
  
  /**
   * Records a login
   */
  recordLogin(): User {
    this.lastLoginAt = new Date();
    return this;
  }
  
  /**
   * Changes the user's password
   * 
   * @param hashedPassword - New hashed password
   */
  changePassword(hashedPassword: string): User {
    this.password = hashedPassword;
    this.resetToken = undefined;
    this.resetTokenExpiry = undefined;
    this.updateAuditData();
    return this;
  }
  
  /**
   * Sets a token for password reset
   * 
   * @param token - Reset token
   * @param expiryHours - Expiry time in hours
   */
  setResetToken(token: string, expiryHours: number = 24): User {
    this.resetToken = token;
    
    // Ablaufzeit setzen
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    this.resetTokenExpiry = expiry;
    
    return this;
  }
  
  /**
   * Checks if a password reset token is valid
   * 
   * @param token - Token to check
   */
  isResetTokenValid(token: string): boolean {
    if (!this.resetToken || !this.resetTokenExpiry) {
      return false;
    }
    
    // Check if the token matches
    if (this.resetToken !== token) {
      return false;
    }
    
    // Check if the token has not expired
    return this.resetTokenExpiry > new Date();
  }
  
  /**
   * Validates the role against the UserRole enum
   * If invalid, defaults to UserRole.USER
   * 
   * @param role - Role value to validate
   * @returns Valid UserRole value
   */
  private validateRole(role?: UserRole | string): UserRole {
    if (!role) return UserRole.USER;
    
    // Check if the role is a valid UserRole enum value
    const isValidRole = Object.values(UserRole).includes(role as UserRole);
    return isValidRole ? (role as UserRole) : UserRole.USER;
  }
  
  /**
   * Validates the status against the UserStatus enum
   * If invalid, defaults to UserStatus.ACTIVE
   * 
   * @param status - Status value to validate
   * @returns Valid UserStatus value
   */
  private validateStatus(status?: UserStatus | string): UserStatus {
    if (!status) return UserStatus.ACTIVE;
    
    // Check if the status is a valid UserStatus enum value
    const isValidStatus = Object.values(UserStatus).includes(status as UserStatus);
    return isValidStatus ? (status as UserStatus) : UserStatus.ACTIVE;
  }
  
  /**
   * Validates the email format
   */
  isValidEmail(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.email);
  }
  
  /**
   * Updates the user status
   * 
   * @param status - New status
   * @param updatedBy - ID of the user making the change
   */
  updateStatus(status: UserStatus, updatedBy?: number): User {
    this.status = status;
    this.updateAuditData(updatedBy);
    return this;
  }
  
  /**
   * Deactivates the user
   * 
   * @param updatedBy - ID of the user performing the deactivation
   */
  deactivate(updatedBy?: number): User {
    return this.updateStatus(UserStatus.INACTIVE, updatedBy);
  }
  
  /**
   * Activates the user
   * 
   * @param updatedBy - ID of the user performing the activation
   */
  activate(updatedBy?: number): User {
    return this.updateStatus(UserStatus.ACTIVE, updatedBy);
  }
  
  /**
   * Marks the user as deleted (Soft Delete)
   * 
   * @param updatedBy - ID of the user performing the deletion
   */
  softDelete(updatedBy?: number): User {
    return this.updateStatus(UserStatus.DELETED, updatedBy);
  }
  
  /**
   * Updates the user data
   * 
   * @param data - New data
   * @param updatedBy - ID of the user performing the update
   */
  update(data: Partial<User>, updatedBy?: number): User {
    // Only update defined properties
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.role !== undefined) this.role = data.role;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.status !== undefined) this.status = data.status;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
    if (data.password !== undefined) this.password = data.password;
    if (data.permissions !== undefined) this.permissions = data.permissions;
    
    // Update audit data
    this.updateAuditData(updatedBy);
    
    return this;
  }
  
  /**
   * Converts the entity to a plain object
   */
  override toObject(): Record<string, any> {
    const baseObject = super.toObject();
    
    // Passwort und Token entfernen
    const { password, resetToken, resetTokenExpiry, ...safeData } = {
      name: this.name,
      email: this.email,
      role: this.role,
      phone: this.phone,
      status: this.status,
      profilePicture: this.profilePicture,
      permissions: this.permissions,
      lastLoginAt: this.lastLoginAt,
      password: this.password,
      resetToken: this.resetToken,
      resetTokenExpiry: this.resetTokenExpiry
    };
    
    return { ...baseObject, ...safeData };
  }
}

// Type-alias für einfachere Verwendung der User-Klasse im Code
/**
 * Type alias for User entity for simpler usage in the codebase
 * Contains the essential properties for most display and processing needs
 */
export type UserType = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  profilePicture?: string;
  permissions?: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  lastLoginAt?: string | Date;
};
