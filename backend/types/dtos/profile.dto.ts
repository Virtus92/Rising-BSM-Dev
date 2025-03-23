/**
 * Profile DTOs
 * 
 * Data Transfer Objects for User Profile operations.
 */
import { BaseDTO, BaseResponseDTO } from './base.dto.js';
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
  telefon?: string;
}

/**
 * DTO for updating user password
 */
export interface PasswordUpdateDTO extends BaseDTO {
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
 * DTO for updating notification settings
 */
export interface NotificationSettingsUpdateDTO extends BaseDTO {
  /**
   * Email notifications preference
   */
  benachrichtigungen_email?: boolean;

  /**
   * Push notifications preference
   */
  benachrichtigungen_push?: boolean;

  /**
   * Notification interval preference
   */
  benachrichtigungen_intervall?: string;
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
    telefon: string;

    /**
     * User role
     */
    rolle: string;

    /**
     * User profile picture
     */
    profilbild: string | null;

    /**
     * Registration date (formatted)
     */
    seit: string;
  };

  /**
   * User settings
   */
  settings: {
    /**
     * Language preference
     */
    sprache: string;

    /**
     * Dark mode preference
     */
    dark_mode: boolean;

    /**
     * Email notifications preference
     */
    benachrichtigungen_email: boolean;

    /**
     * Push notifications preference
     */
    benachrichtigungen_push: boolean;

    /**
     * Notification interval preference
     */
    benachrichtigungen_intervall: string;
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
  ip: string;

  /**
   * Activity date (formatted)
   */
  date: string;
}

/**
 * Available notification interval options
 */
export enum NotificationInterval {
  IMMEDIATE = 'sofort',
  HOURLY = 'stuendlich',
  DAILY = 'taeglich',
  WEEKLY = 'woechentlich'
}

/**
 * Available language options
 */
export enum LanguageOption {
  GERMAN = 'de',
  ENGLISH = 'en'
}

/**
 * Validation schema for profile update
 */
export const profileUpdateSchema = {
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
  telefon: {
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
export const passwordUpdateSchema = {
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
 * Validation schema for notification settings update
 */
export const notificationSettingsUpdateSchema = {
  benachrichtigungen_email: {
    type: 'boolean',
    required: false,
    default: true
  },
  benachrichtigungen_push: {
    type: 'boolean',
    required: false,
    default: false
  },
  benachrichtigungen_intervall: {
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
      return 'Anmeldung';
    case 'logout':
      return 'Abmeldung';
    case 'password_changed':
      return 'Passwort geändert';
    case 'profile_updated':
      return 'Profil aktualisiert';
    case 'settings_updated':
      return 'Einstellungen aktualisiert';
    case 'notification_settings_updated':
      return 'Benachrichtigungseinstellungen aktualisiert';
    case 'password_reset':
      return 'Passwort zurückgesetzt';
    default:
      return type.replace('_', ' ');
  }
}