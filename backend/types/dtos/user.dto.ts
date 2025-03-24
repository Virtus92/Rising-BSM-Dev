/**
 * User DTOs
 * 
 * Data Transfer Objects for User entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, FilterParams, StatusChangeDTO, UserRole } from '../common/types.js';

/**
 * User status values
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

/**
 * DTO for creating a new user
 */
export interface UserCreateDTO extends BaseCreateDTO {
  /**
   * User's full name
   */
  name: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's password
   */
  password: string;

  /**
   * User's phone number (optional)
   */
  phone?: string;

  /**
   * User's role (optional, defaults to 'employee')
   */
  role?: string;

  /**
   * User's status (optional, defaults to 'active')
   */
  status?: string;
}

/**
 * DTO for updating an existing user
 */
export interface UserUpdateDTO extends BaseUpdateDTO {
  /**
   * User's full name
   */
  name?: string;

  /**
   * User's email address
   */
  email?: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's role
   */
  role?: string;

  /**
   * User's status
   */
  status?: string;
}

/**
 * DTO for user status update
 */
export interface UserStatusUpdateDTO extends StatusChangeDTO {
  /**
   * User ID
   */
  id: number;

  /**
   * New status
   */
  status: string;

  /**
   * Optional note about the status change
   */
  note?: string;
}

/**
 * DTO for user response
 */
export interface UserResponseDTO extends BaseResponseDTO {
  /**
   * User's full name
   */
  name: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's role
   */
  role: string;

  /**
   * User's status
   */
  status: string;

  /**
   * User's profile picture URL
   */
  profilePicture?: string;
}

/**
 * DTO for detailed user response with related data
 */
export interface UserDetailResponseDTO extends UserResponseDTO {
  /**
   * User's settings
   */
  settings?: UserSettingsResponseDTO;

  /**
   * User's recent activity
   */
  activity?: UserActivityResponseDTO[];
}

/**
 * DTO for user settings
 */
export interface UserSettingsResponseDTO {
  /**
   * Dark mode preference
   */
  darkMode: boolean;

  /**
   * Email notifications preference
   */
  emailNotifications: boolean;

  /**
   * Push notifications preference
   */
  pushNotifications: boolean;

  /**
   * Language preference
   */
  language: string;

  /**
   * Notification interval preference
   */
  notificationInterval: string;
}

/**
 * DTO for updating user settings
 */
export interface UserSettingsUpdateDTO extends BaseUpdateDTO {
  /**
   * Dark mode preference
   */
  darkMode?: boolean;

  /**
   * Email notifications preference
   */
  emailNotifications?: boolean;

  /**
   * Push notifications preference
   */
  pushNotifications?: boolean;

  /**
   * Language preference
   */
  language?: string;

  /**
   * Notification interval preference
   */
  notificationInterval?: string;
}

/**
 * DTO for user activity
 */
export interface UserActivityResponseDTO {
  /**
   * Activity ID
   */
  id: number;

  /**
   * Activity type
   */
  activity: string;

  /**
   * IP address
   */
  ipAddress?: string;

  /**
   * Timestamp
   */
  timestamp: string;
}

/**
 * DTO for user filtering
 */
export interface UserFilterParams extends FilterParams {
  /**
   * Filter by role
   */
  role?: string;

  /**
   * Filter by status
   */
  status?: string;
}

/**
 * DTO for changing password
 */
export interface PasswordChangeDTO extends BaseUpdateDTO {
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
 * Validation schema for user creation
 */
export const userCreateValidation = {
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 100,
    messages: {
      required: 'Name is required',
      min: 'Name must be at least 2 characters long',
      max: 'Name must not exceed 100 characters'
    }
  },
  email: {
    type: 'email',
    required: true,
    messages: {
      required: 'Email is required',
      email: 'Invalid email format'
    }
  },
  password: {
    type: 'password',
    required: true,
    min: 8,
    messages: {
      required: 'Password is required',
      min: 'Password must be at least 8 characters long'
    }
  },
  phone: {
    type: 'string',
    required: false,
    max: 30,
    messages: {
      max: 'Phone number must not exceed 30 characters'
    }
  },
  role: {
    type: 'enum',
    required: false,
    enum: Object.values(UserRole),
    default: UserRole.EMPLOYEE,
    messages: {
      enum: `Role must be one of: ${Object.values(UserRole).join(', ')}`
    }
  },
  status: {
    type: 'enum',
    required: false,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    messages: {
      enum: `Status must be one of: ${Object.values(UserStatus).join(', ')}`
    }
  }
};

/**
 * Validation schema for user update
 */
export const userUpdateValidation = {
  ...userCreateValidation,
  name: {
    ...userCreateValidation.name,
    required: false
  },
  email: {
    ...userCreateValidation.email,
    required: false
  },
  password: {
    ...userCreateValidation.password,
    required: false
  }
};

/**
 * Validation schema for password change
 */
export const passwordChangeValidation = {
  currentPassword: {
    type: 'string',
    required: true,
    messages: {
      required: 'Current password is required'
    }
  },
  newPassword: {
    type: 'password',
    required: true,
    min: 8,
    messages: {
      required: 'New password is required',
      min: 'New password must be at least 8 characters long'
    }
  },
  confirmPassword: {
    type: 'string',
    required: true,
    messages: {
      required: 'Confirm password is required'
    },
    validate: (value: string, data: any) => {
      return value === data.newPassword ? true : 'Passwords do not match';
    }
  }
};

/**
 * Get human-readable status label
 */
export function getUserStatusLabel(status: string): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return 'Active';
    case UserStatus.INACTIVE:
      return 'Inactive';
    case UserStatus.SUSPENDED:
      return 'Suspended';
    default:
      return status;
  }
}

/**
 * Get CSS class for status
 */
export function getUserStatusClass(status: string): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return 'success';
    case UserStatus.INACTIVE:
      return 'secondary';
    case UserStatus.SUSPENDED:
      return 'danger';
    default:
      return 'secondary';
  }
}

/**
 * Get human-readable role label
 */
export function getUserRoleLabel(role: string): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.EMPLOYEE:
      return 'Employee';
    case UserRole.USER:
      return 'User';
    default:
      return role;
  }
}