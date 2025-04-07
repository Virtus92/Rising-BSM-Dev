import { UserRole, UserStatus } from '@/types/enums/user-enums';

/**
 * User entity
 * 
 * Domain entity representing a user in the system.
 * Aligned with the Prisma schema.
 */
export interface User {
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
   * ID of user who created this user
   */
  createdBy?: number;
  
  /**
   * ID of user who last updated this user
   */
  updatedBy?: number;
  
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
}

/**
 * User utilities - helper functions for working with User entity
 */
export const UserUtils = {
  /**
   * Creates a new User instance
   * 
   * @param data - User data
   */
  create: (data: Partial<User> = {}): User => ({
    id: data.id || 0,
    name: data.name || '',
    email: data.email || '',
    password: data.password,
    role: data.role || UserRole.EMPLOYEE,
    phone: data.phone,
    status: data.status || UserStatus.ACTIVE,
    profilePicture: data.profilePicture,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    lastLoginAt: data.lastLoginAt,
    resetToken: data.resetToken,
    resetTokenExpiry: data.resetTokenExpiry
  }),

  /**
   * Get first and last name from full name
   */
  getNameParts: (user: User): { firstName: string; lastName: string } => {
    const parts = user.name.trim().split(' ');
    
    if (parts.length <= 1) {
      return { firstName: user.name, lastName: '' };
    }
    
    const lastName = parts.pop() || '';
    const firstName = parts.join(' ');
    
    return { firstName, lastName };
  },

  /**
   * Get first name from full name
   */
  getFirstName: (user: User): string => {
    return user.name.split(' ')[0];
  },
  
  /**
   * Get last name from full name
   */
  getLastName: (user: User): string => {
    const nameParts = user.name.split(' ');
    return nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  },

  /**
   * Get full name
   */
  getFullName: (user: User): string => {
    return user.name.trim();
  },

  /**
   * Check if user is active
   */
  isActive: (user: User): boolean => {
    return user.status === UserStatus.ACTIVE;
  },

  /**
   * Check if user has admin role
   */
  isAdmin: (user: User): boolean => {
    return user.role === UserRole.ADMIN;
  },

  /**
   * Check if user has specific role
   */
  hasRole: (user: User, role: UserRole): boolean => {
    return user.role === role;
  },

  /**
   * Update user properties
   */
  update: (user: User, data: Partial<User>): User => {
    const updated = { ...user };
    
    // Update only defined properties
    if (data.name !== undefined) updated.name = data.name;
    if (data.email !== undefined) updated.email = data.email;
    if (data.role !== undefined) updated.role = data.role;
    if (data.phone !== undefined) updated.phone = data.phone;
    if (data.status !== undefined) updated.status = data.status;
    if (data.profilePicture !== undefined) updated.profilePicture = data.profilePicture;
    if (data.password !== undefined) updated.password = data.password;
    
    // Always update the updatedAt timestamp
    updated.updatedAt = new Date();
    
    // If updatedBy is provided, update it
    if (data.updatedBy !== undefined) updated.updatedBy = data.updatedBy;
    
    return updated;
  },

  /**
   * Record user login
   */
  recordLogin: (user: User): User => {
    return {
      ...user,
      lastLoginAt: new Date()
    };
  },

  /**
   * Deactivate user
   */
  deactivate: (user: User, updatedBy?: number): User => {
    return {
      ...user,
      status: UserStatus.INACTIVE,
      updatedAt: new Date(),
      updatedBy: updatedBy || user.updatedBy
    };
  },

  /**
   * Activate user
   */
  activate: (user: User, updatedBy?: number): User => {
    return {
      ...user,
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
      updatedBy: updatedBy || user.updatedBy
    };
  }
};
