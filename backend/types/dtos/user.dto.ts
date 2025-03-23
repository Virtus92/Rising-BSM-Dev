/**
 * User DTOs
 * 
 * Data Transfer Objects for User entity operations.
 */
import { BaseCreateDTO, BaseUpdateDTO, BaseResponseDTO, BaseFilterDTO } from './base.dto.js';

/**
 * Enum for user status values
 */
export enum UserStatus {
  ACTIVE = 'aktiv',
  INACTIVE = 'inaktiv',
  SUSPENDED = 'gesperrt'
}

/**
 * Enum for user role values
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'mitarbeiter',
  USER = 'benutzer'
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
   * User's role (optional, defaults to 'benutzer')
   */
  role?: string;

  /**
   * User's status (optional, defaults to 'aktiv')
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
 * DTO for user login
 */
export interface UserLoginDTO {
  /**
   * User's email address
   */
  email: string;

  /**
   * User's password
   */
  password: string;

  /**
   * Remember me option
   */
  remember?: boolean;
}

/**
 * DTO for user response
 */
export interface UserResponseDTO extends BaseResponseDTO {
  /**
   * User ID
   */
  id: number;

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
   * User's role label
   */
  roleLabel: string;

  /**
   * User's status
   */
  status: string;

  /**
   * User's status label
   */
  statusLabel: string;

  /**
   * User's status CSS class
   */
  statusClass: string;

  /**
   * User's initials
   */
  initials: string;

  /**
   * User's profile picture URL
   */
  profilePicture?: string;

  /**
   * User's registration date
   */
  createdAt: string;
}

/**
 * DTO for detailed user response with related data
 */
export interface UserDetailResponseDTO extends UserResponseDTO {
  /**
   * User's activity log
   */
  activity: UserActivityDTO[];

  /**
   * User's settings
   */
  settings: UserSettingsDTO;
}

/**
 * DTO for user activity log
 */
export interface UserActivityDTO {
  /**
   * Activity ID
   */
  id: number;

  /**
   * Activity type
   */
  activity: string;

  /**
   * Activity label
   */
  activityLabel: string;

  /**
   * IP address
   */
  ipAddress?: string;

  /**
   * Timestamp
   */
  timestamp: string;

  /**
   * Formatted timestamp
   */
  formattedDate: string;
}

/**
 * DTO for user settings
 */
export interface UserSettingsDTO {
  /**
   * Language preference
   */
  language: string;

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
   * Notification interval preference
   */
  notificationInterval: string;
}

/**
 * DTO for user filtering
 */
export interface UserFilterDTO extends BaseFilterDTO {
  /**
   * Filter by status
   */
  status?: string;

  /**
   * Filter by role
   */
  role?: string;

  /**
   * Search term for name and email
   */
  search?: string;
}

/**
 * DTO for password change
 */
export interface PasswordChangeDTO {
  /**
   * Current password
   */
  current_password: string;

  /**
   * New password
   */
  new_password: string;

  /**
   * Confirm new password
   */
  confirm_password: string;
}

/**
 * DTO for password reset request
 */
export interface PasswordResetRequestDTO {
  /**
   * User's email address
   */
  email: string;
}

/**
 * DTO for password reset
 */
export interface PasswordResetDTO {
  /**
   * Reset token
   */
  token: string;

  /**
   * New password
   */
  password: string;

  /**
   * Confirm new password
   */
  confirmPassword: string;
}

/**
 * Validation schema for user creation
 */
export const userCreateSchema = {
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
    type: 'phone',
    required: false,
    messages: {
      phone: 'Invalid phone number format'
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
export const userUpdateSchema = {
  ...userCreateSchema,
  name: {
    ...userCreateSchema.name,
    required: false
  },
  email: {
    ...userCreateSchema.email,
    required: false
  },
  password: {
    ...userCreateSchema.password,
    required: false
  }
};

/**
 * Validation schema for user login
 */
export const userLoginSchema = {
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
    messages: {
      required: 'Password is required'
    }
  },
  remember: {
    type: 'boolean',
    required: false
  }
};

/**
 * Validation schema for password change
 */
export const passwordChangeSchema = {
  current_password: {
    type: 'string',
    required: true,
    messages: {
      required: 'Current password is required'
    }
  },
  new_password: {
    type: 'password',
    required: true,
    min: 8,
    messages: {
      required: 'New password is required',
      min: 'New password must be at least 8 characters long'
    }
  },
  confirm_password: {
    type: 'string',
    required: true,
    messages: {
      required: 'Confirm password is required'
    },
    validate: (value: string, data: any) => {
      return value === data.new_password ? true : 'Passwords do not match';
    }
  }
};

/**
 * Validation schema for password reset request
 */
export const passwordResetRequestSchema = {
  email: {
    type: 'email',
    required: true,
    messages: {
      required: 'Email is required',
      email: 'Invalid email format'
    }
  }
};

/**
 * Validation schema for password reset
 */
export const passwordResetSchema = {
  token: {
    type: 'string',
    required: true,
    messages: {
      required: 'Token is required'
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
  confirmPassword: {
    type: 'string',
    required: true,
    messages: {
      required: 'Confirm password is required'
    },
    validate: (value: string, data: any) => {
      return value === data.password ? true : 'Passwords do not match';
    }
  }
};