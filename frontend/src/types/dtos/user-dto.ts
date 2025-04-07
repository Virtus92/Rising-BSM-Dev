import { UserRole, UserStatus } from '../entities/user';

/**
 * DTO for creating a new user
 */
export interface CreateUserDto {
  /**
   * Name
   */
  name: string;
  
  /**
   * Email address
   */
  email: string;
  
  /**
   * Password
   */
  password: string;
  
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
  role?: UserRole;
}

/**
 * DTO for updating an existing user
 */
export interface UpdateUserDto {
  /**
   * Name
   */
  name?: string;
  
  /**
   * Email address
   */
  email?: string;
  
  /**
   * First name
   */
  firstName?: string;
  
  /**
   * Last name
   */
  lastName?: string;
  
  /**
   * User role
   */
  role?: UserRole;
  
  /**
   * Account status
   */
  status?: UserStatus;
}

/**
 * DTO for changing password
 */
export interface ChangePasswordDto {
  /**
   * Current password
   */
  currentPassword: string;
  
  /**
   * New password
   */
  newPassword: string;
  
  /**
   * Confirm new password
   */
  confirmPassword: string;
}

/**
 * DTO for user responses
 */
export interface UserResponseDto {
  /**
   * User ID
   */
  id: number;
  
  /**
   * Name
   */
  name: string;
  
  /**
   * Email address
   */
  email: string;
  
  /**
   * First name
   */
  firstName: string;
  
  /**
   * Last name
   */
  lastName: string;
  
  /**
   * Full name
   */
  fullName: string;
  
  /**
   * User role
   */
  role: UserRole;

  /**
   * Phone number
   */
  phone?: string;

  /**
   * Profile picture URL
   */
  profilePicture?: string;
  
  /**
   * Account status
   */
  status: UserStatus;
  
  /**
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * Last update timestamp
   */
  updatedAt: string;
  
  /**
   * Last login timestamp
   */
  lastLoginAt?: string;
}

/**
 * DTO for detailed user responses
 */
export interface UserDetailResponseDto extends UserResponseDto {
  /**
   * User activity history
   */
  activities?: UserActivityResponseDto[];
}

/**
 * DTO for user activity responses
 */
export interface UserActivityResponseDto {
  /**
   * Activity ID
   */
  id: number;
  
  /**
   * Activity type
   */
  type: string;
  
  /**
   * Activity details
   */
  details?: string;
  
  /**
   * IP address
   */
  ipAddress?: string;
  
  /**
   * Activity timestamp
   */
  timestamp: string;
}

/**
 * DTO for updating user status
 */
export interface UpdateUserStatusDto {
  /**
   * New status
   */
  status: UserStatus;
  
  /**
   * Reason for status change
   */
  reason?: string;
}

/**
 * Filter parameters for user queries
 */
export interface UserFilterParams {
  /**
   * Search text
   */
  search?: string;
  
  /**
   * User role
   */
  role?: UserRole;
  
  /**
   * User status
   */
  status?: UserStatus;
  
  /**
   * Start date for filtering
   */
  startDate?: Date;
  
  /**
   * End date for filtering
   */
  endDate?: Date;
  
  /**
   * Pagination page number
   */
  page?: number;
  
  /**
   * Items per page
   */
  limit?: number;
  
  /**
   * Sort field
   */
  sortBy?: string;
  
  /**
   * Sort direction
   */
  sortDirection?: 'asc' | 'desc';
}