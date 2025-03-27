import { UserRole, UserStatus } from '../entities/User.js';

/**
 * Base interface for user DTOs
 */
interface BaseUserDto {
  /**
   * Common properties shared by all user DTOs
   */
}

/**
 * DTO for creating a new user
 */
export interface CreateUserDto extends BaseUserDto {
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
export interface UpdateUserDto extends BaseUserDto {
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
export interface ChangePasswordDto extends BaseUserDto {
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
export interface UserResponseDto extends BaseUserDto {
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

/**
 * Validation schema for creating a user
 */
export const createUserValidationSchema = {
  name: {
    type: 'string',
    required: true,
    min: 3,
    max: 50,
    pattern: '^[a-zA-Z0-9_-]+$',
    messages: {
      required: 'Name is required',
      min: 'Name must be at least 3 characters',
      max: 'Name cannot exceed 50 characters',
      pattern: 'Name can only contain letters, numbers, underscores and hyphens'
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
    type: 'string',
    required: true,
    min: 8,
    max: 100,
    messages: {
      required: 'Password is required',
      min: 'Password must be at least 8 characters',
      max: 'Password cannot exceed 100 characters'
    }
  },
  firstName: {
    type: 'string',
    required: true,
    min: 1,
    max: 50,
    messages: {
      required: 'First name is required',
      min: 'First name cannot be empty',
      max: 'First name cannot exceed 50 characters'
    }
  },
  lastName: {
    type: 'string',
    required: true,
    min: 1,
    max: 50,
    messages: {
      required: 'Last name is required',
      min: 'Last name cannot be empty',
      max: 'Last name cannot exceed 50 characters'
    }
  },
  role: {
    type: 'enum',
    required: false,
    enum: Object.values(UserRole),
    default: UserRole.USER,
    messages: {
      enum: `Role must be one of: ${Object.values(UserRole).join(', ')}`
    }
  }
};

/**
 * Validation schema for updating a user
 */
export const updateUserValidationSchema = {
  name: {
    type: 'string',
    required: false,
    min: 3,
    max: 50,
    pattern: '^[a-zA-Z0-9_-]+$',
    messages: {
      min: 'Name must be at least 3 characters',
      max: 'Name cannot exceed 50 characters',
      pattern: 'Name can only contain letters, numbers, underscores and hyphens'
    }
  },
  email: {
    type: 'email',
    required: false,
    messages: {
      email: 'Invalid email format'
    }
  },
  firstName: {
    type: 'string',
    required: false,
    min: 1,
    max: 50,
    messages: {
      min: 'First name cannot be empty',
      max: 'First name cannot exceed 50 characters'
    }
  },
  lastName: {
    type: 'string',
    required: false,
    min: 1,
    max: 50,
    messages: {
      min: 'Last name cannot be empty',
      max: 'Last name cannot exceed 50 characters'
    }
  },
  role: {
    type: 'enum',
    required: false,
    enum: Object.values(UserRole),
    messages: {
      enum: `Role must be one of: ${Object.values(UserRole).join(', ')}`
    }
  },
  status: {
    type: 'enum',
    required: false,
    enum: Object.values(UserStatus),
    messages: {
      enum: `Status must be one of: ${Object.values(UserStatus).join(', ')}`
    }
  }
};

/**
 * Validation schema for changing password
 */
export const changePasswordValidationSchema = {
  currentPassword: {
    type: 'string',
    required: true,
    messages: {
      required: 'Current password is required'
    }
  },
  newPassword: {
    type: 'string',
    required: true,
    min: 8,
    max: 100,
    messages: {
      required: 'New password is required',
      min: 'New password must be at least 8 characters',
      max: 'New password cannot exceed 100 characters'
    }
  },
  confirmPassword: {
    type: 'string',
    required: true,
    validate: (value: string, data: any) => {
      return value === data.newPassword || 'Passwords do not match';
    },
    messages: {
      required: 'Confirm password is required'
    }
  }
};