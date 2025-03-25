/**
 * Profile DTOs
 * 
 * Data Transfer Objects for User Profile operations.
 */
import { BaseDTO, BaseResponseDTO } from '../common/types.js';
import { NotificationInterval, LanguageOption } from './settings.dto.js';
import { File } from 'buffer';

/**
 * DTO for updating user profile
 */
export interface ProfileUpdateDTO extends BaseDTO {
  /**
   * User name
   */
  name: string;

  /**
   * User email
   */
  email: string;

  /**
   * User phone (optional)
   */
  phone?: string;
}

/**
 * DTO for updating user password
 */
export interface PasswordUpdateDTO extends BaseDTO {
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
 * DTO for updating notification settings
 */
export interface NotificationSettingsUpdateDTO extends BaseDTO {
  /**
   * Email notifications preference
   */
  emailNotifications?: boolean;

  /**
   * Push notifications preference
   */
  pushNotifications?: boolean;

  /**
   * Notification interval preference
   */
  notificationInterval?: string;
}

/**
 * DTO for uploading profile picture
 */
export interface ProfilePictureUpdateDTO extends BaseDTO {
  /**
   * Profile picture file
   */
  file: File;
}
/**
 * DTO for user profile response
 */
export interface UserProfileResponseDTO extends BaseResponseDTO {
  /**
   * User data
   */
  user: {
    /**
     * User ID
     */
    id: number;

    /**
     * User name
     */
    name: string;

    /**
     * User email
     */
    email: string;

    /**
     * User phone
     */
    phone?: string;

    /**
     * User role
     */
    role: string;

    /**
     * User profile picture
     */
    profilePicture?: string | null;

    /**
     * Registration date (formatted)
     */
    registeredAt: string;
  };

  /**
   * User settings
   */
  settings: {
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
  };

  /**
   * User activity log
   */
  activity: UserActivityDTO[];
}

/**
 * DTO for user activity log entry
 */
export interface UserActivityDTO {
  /**
   * Activity type
   */
  type: string;

  /**
   * IP address
   */
  ipAddress?: string;

  /**
   * Activity date (formatted)
   */
  timestamp: string;
}

/**
 * Validation schema for profile update
 */
export const profileUpdateValidation = {
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
  phone: {
    type: 'phone',
    required: false,
    messages: {
      phone: 'Invalid phone number format'
    }
  }
};

/**
 * Validation schema for password update
 */
export const passwordUpdateValidation = {
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
 * Validation schema for notification settings update
 */
export const notificationSettingsUpdateValidation = {
  emailNotifications: {
    type: 'boolean',
    required: false,
    default: true
  },
  pushNotifications: {
    type: 'boolean',
    required: false,
    default: false
  },
  notificationInterval: {
    type: 'enum',
    required: false,
    enum: Object.values(NotificationInterval),
    default: NotificationInterval.IMMEDIATE,
    messages: {
      enum: `Interval must be one of: ${Object.values(NotificationInterval).join(', ')}`
    }
  }
};

/**
 * Map activity type to readable label
 * @param type Activity type
 * @returns Human-readable activity label
 */
export function getActivityLabel(type: string): string {
  switch (type) {
    case 'login':
      return 'Login';
    case 'logout':
      return 'Logout';
    case 'password_changed':
      return 'Password Changed';
    case 'profile_updated':
      return 'Profile Updated';
    case 'settings_updated':
      return 'Settings Updated';
    case 'notification_settings_updated':
      return 'Notification Settings Updated';
    case 'password_reset':
      return 'Password Reset';
    default:
      return type.replace('_', ' ');
  }
}