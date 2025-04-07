/**
 * User Entity
 * 
 * Domänenmodell für Benutzer im System.
 * Leitet von BaseEntity ab und fügt benutzerspezifische Eigenschaften und Methoden hinzu.
 */
import { BaseEntity } from '../core/BaseEntity';
import { UserRole, UserStatus } from '../enums/user-enums';

export class User extends BaseEntity {
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
   * Constructor
   * 
   * @param data - Initial data
   */
  constructor(data: Partial<User> = {}) {
    super(data);
    
    this.name = data.name || '';
    this.email = data.email || '';
    this.password = data.password;
    this.role = data.role || UserRole.EMPLOYEE;
    this.phone = data.phone;
    this.status = data.status || UserStatus.ACTIVE;
    this.profilePicture = data.profilePicture;
    this.lastLoginAt = data.lastLoginAt;
    this.resetToken = data.resetToken;
    this.resetTokenExpiry = data.resetTokenExpiry;
  }
  
  /**
   * Get first name
   */
  get firstName(): string {
    return this.name.split(' ')[0];
  }
  
  /**
   * Get last name
   */
  get lastName(): string {
    const nameParts = this.name.split(' ');
    return nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
  
  /**
   * Get full name
   */
  getFullName(): string {
    return this.name.trim();
  }
  
  /**
   * Check if user is active
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
  
  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
  
  /**
   * Check if user has specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }
  
  /**
   * Record user login
   */
  recordLogin(): User {
    this.lastLoginAt = new Date();
    return this;
  }
  
  /**
   * Change user's password
   * 
   * @param hashedPassword - New hashed password
   */
  changePassword(hashedPassword: string): User {
    this.password = hashedPassword;
    this.resetToken = undefined;
    this.resetTokenExpiry = undefined;
    this.updateAudit();
    return this;
  }
  
  /**
   * Set password reset token
   * 
   * @param token - Reset token
   * @param expiryHours - Hours until token expires
   */
  setResetToken(token: string, expiryHours: number = 24): User {
    this.resetToken = token;
    
    // Set expiry time
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    this.resetTokenExpiry = expiry;
    
    return this;
  }
  
  /**
   * Check if reset token is valid
   * 
   * @param token - Token to check
   */
  isResetTokenValid(token: string): boolean {
    if (!this.resetToken || !this.resetTokenExpiry) {
      return false;
    }
    
    // Check token matches
    if (this.resetToken !== token) {
      return false;
    }
    
    // Check token not expired
    return this.resetTokenExpiry > new Date();
  }
  
  /**
   * Update user status
   * 
   * @param status - New status
   * @param updatedBy - User ID making the change
   */
  updateStatus(status: UserStatus, updatedBy?: number): User {
    this.status = status;
    this.updateAudit(updatedBy);
    return this;
  }
  
  /**
   * Deactivate user
   * 
   * @param updatedBy - User ID performing the deactivation
   */
  deactivate(updatedBy?: number): User {
    return this.updateStatus(UserStatus.INACTIVE, updatedBy);
  }
  
  /**
   * Activate user
   * 
   * @param updatedBy - User ID performing the activation
   */
  activate(updatedBy?: number): User {
    return this.updateStatus(UserStatus.ACTIVE, updatedBy);
  }
  
  /**
   * Mark user as deleted (soft delete)
   * 
   * @param updatedBy - User ID performing the deletion
   */
  softDelete(updatedBy?: number): User {
    return this.updateStatus(UserStatus.DELETED, updatedBy);
  }
  
  /**
   * Update user properties
   * 
   * @param data - Updated properties
   * @param updatedBy - User ID making the change
   */
  update(data: Partial<User>, updatedBy?: number): User {
    // Update only defined properties
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.role !== undefined) this.role = data.role;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.status !== undefined) this.status = data.status;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
    if (data.password !== undefined) this.password = data.password;
    
    // Update audit information
    this.updateAudit(updatedBy);
    
    return this;
  }
  
  /**
   * Convert entity to plain object
   */
  toObject(): Record<string, any> {
    const obj = super.toObject();
    
    // Remove sensitive data when converting to plain object
    delete obj.password;
    delete obj.resetToken;
    delete obj.resetTokenExpiry;
    
    return obj;
  }
}
