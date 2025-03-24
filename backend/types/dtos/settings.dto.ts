/**
 * Settings DTOs
 * 
 * Data Transfer Objects for application settings operations.
 */
import { BaseFilterDTO } from '../common/types.js';

/**
 * Enum for notification interval options
 */
export enum NotificationInterval {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly'
}

/**
 * Enum for language options
 */
export enum LanguageOption {
  GERMAN = 'de',
  ENGLISH = 'en'
}

/**
 * Enum for backup interval options
 */
export enum BackupInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Enum for backup storage type options
 */
export enum BackupStorageType {
  LOCAL = 'local',
  S3 = 's3',
  FTP = 'ftp'
}

/**
 * DTO for user settings update
 */
export interface UserSettingsUpdateDTO {
  /**
   * Language preference
   */
  language?: string;

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
   * Notification interval preference
   */
  notificationInterval?: string;
}

/**
 * DTO for user settings response
 */
export interface UserSettingsResponseDTO {
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
 * DTO for system settings update
 */
export interface SystemSettingsUpdateDTO {
  /**
   * Site title
   */
  siteTitle?: string;

  /**
   * Logo URL
   */
  logo?: string;

  /**
   * Company name
   */
  companyName?: string;

  /**
   * Company address
   */
  companyAddress?: string;

  /**
   * Company phone number
   */
  companyPhone?: string;

  /**
   * Company email address
   */
  companyEmail?: string;

  /**
   * VAT number
   */
  vatNumber?: string;

  /**
   * Default language
   */
  defaultLanguage?: string;

  /**
   * Default VAT rate
   */
  defaultVatRate?: number;

  /**
   * System email address
   */
  systemEmail?: string;

  /**
   * Maintenance mode flag
   */
  maintenanceMode?: boolean;

  /**
   * Email notifications flag
   */
  emailNotifications?: boolean;
}

/**
 * DTO for system settings response
 */
export interface SystemSettingsResponseDTO {
  /**
   * Site title
   */
  siteTitle: string;

  /**
   * Logo URL
   */
  logo: string;

  /**
   * Company name
   */
  companyName: string;

  /**
   * Company address
   */
  companyAddress: string;

  /**
   * Company phone number
   */
  companyPhone: string;

  /**
   * Company email address
   */
  companyEmail: string;

  /**
   * VAT number
   */
  vatNumber: string;

  /**
   * Default language
   */
  defaultLanguage: string;

  /**
   * Default VAT rate
   */
  defaultVatRate: number;

  /**
   * System email address
   */
  systemEmail: string;

  /**
   * Maintenance mode flag
   */
  maintenanceMode: boolean;

  /**
   * Email notifications flag
   */
  emailNotifications: boolean;
}

/**
 * DTO for grouped system settings
 */
export interface GroupedSystemSettingsDTO {
  /**
   * General settings
   */
  general: SystemSettingItem[];

  /**
   * Company settings
   */
  company: SystemSettingItem[];

  /**
   * Email settings
   */
  email: SystemSettingItem[];

  /**
   * Security settings
   */
  security: SystemSettingItem[];
}

/**
 * DTO for system setting item
 */
export interface SystemSettingItem {
  /**
   * Setting key
   */
  key: string;

  /**
   * Setting value
   */
  value: string;

  /**
   * Setting description
   */
  description: string;

  /**
   * Setting input type
   */
  type: string;
}

/**
 * DTO for backup settings update
 */
export interface BackupSettingsUpdateDTO {
  /**
   * Auto backup flag
   */
  autoBackup?: boolean;

  /**
   * Backup frequency
   */
  frequency?: string;

  /**
   * Backup time
   */
  time?: string;

  /**
   * Number of backups to keep
   */
  keepCount?: number;

  /**
   * Backup storage type
   */
  storageType?: string;
}

/**
 * DTO for backup settings response
 */
export interface BackupSettingsResponseDTO {
  /**
   * Auto backup flag
   */
  autoBackup: boolean;

  /**
   * Backup frequency
   */
  frequency: string;

  /**
   * Backup time
   */
  time: string;

  /**
   * Number of backups to keep
   */
  keepCount: number;

  /**
   * Backup storage type
   */
  storageType: string;

  /**
   * Last backup timestamp
   */
  lastBackup: string;
}

/**
 * DTO for backup item
 */
export interface BackupDTO {
  /**
   * Backup ID
   */
  id: string;

  /**
   * Backup filename
   */
  filename: string;

  /**
   * Backup size in bytes
   */
  size: number;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Backup type
   */
  type: string;
}

/**
 * DTO for backup response including settings and list
 */
export interface BackupResponseDTO {
  /**
   * Backup settings
   */
  settings: BackupSettingsResponseDTO;

  /**
   * List of backups
   */
  backups: BackupDTO[];
}

/**
 * DTO for manual backup trigger
 */
export interface ManualBackupDTO {
  /**
   * Optional description
   */
  description?: string;
}

/**
 * Validation schema for user settings update
 */
export const userSettingsUpdateValidation = {
  language: {
    type: 'enum',
    required: false,
    enum: Object.values(LanguageOption),
    default: LanguageOption.GERMAN,
    messages: {
      enum: `Language must be one of: ${Object.values(LanguageOption).join(', ')}`
    }
  },
  darkMode: {
    type: 'boolean',
    required: false,
    default: false
  },
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
      enum: `Notification interval must be one of: ${Object.values(NotificationInterval).join(', ')}`
    }
  }
};

/**
 * Validation schema for system settings update
 */
export const systemSettingsUpdateValidation = {
  siteTitle: {
    type: 'string',
    required: false,
    min: 2,
    max: 100,
    messages: {
      min: 'Site title must be at least 2 characters long',
      max: 'Site title must not exceed 100 characters'
    }
  },
  logo: {
    type: 'string',
    required: false,
    max: 255,
    messages: {
      max: 'Logo URL must not exceed 255 characters'
    }
  },
  companyName: {
    type: 'string',
    required: false,
    min: 2,
    max: 100,
    messages: {
      min: 'Company name must be at least 2 characters long',
      max: 'Company name must not exceed 100 characters'
    }
  },
  companyAddress: {
    type: 'string',
    required: false,
    max: 255,
    messages: {
      max: 'Company address must not exceed 255 characters'
    }
  },
  companyPhone: {
    type: 'phone',
    required: false,
    messages: {
      phone: 'Invalid phone number format'
    }
  },
  companyEmail: {
    type: 'email',
    required: false,
    messages: {
      email: 'Invalid email format'
    }
  },
  vatNumber: {
    type: 'string',
    required: false,
    max: 50,
    messages: {
      max: 'VAT number must not exceed 50 characters'
    }
  },
  defaultLanguage: {
    type: 'enum',
    required: false,
    enum: Object.values(LanguageOption),
    default: LanguageOption.GERMAN,
    messages: {
      enum: `Language must be one of: ${Object.values(LanguageOption).join(', ')}`
    }
  },
  defaultVatRate: {
    type: 'number',
    required: false,
    min: 0,
    max: 100,
    messages: {
      min: 'VAT rate must be a non-negative number',
      max: 'VAT rate must not exceed 100',
      type: 'VAT rate must be a number'
    }
  },
  systemEmail: {
    type: 'email',
    required: false,
    messages: {
      email: 'Invalid email format'
    }
  },
  maintenanceMode: {
    type: 'boolean',
    required: false,
    default: false
  },
  emailNotifications: {
    type: 'boolean',
    required: false,
    default: true
  }
};

/**
 * Validation schema for backup settings update
 */
export const backupSettingsUpdateValidation = {
  autoBackup: {
    type: 'boolean',
    required: false,
    default: true
  },
  frequency: {
    type: 'enum',
    required: false,
    enum: Object.values(BackupInterval),
    default: BackupInterval.DAILY,
    messages: {
      enum: `Frequency must be one of: ${Object.values(BackupInterval).join(', ')}`
    }
  },
  time: {
    type: 'time',
    required: false,
    default: '02:00',
    messages: {
      time: 'Time must be in HH:MM format'
    }
  },
  keepCount: {
    type: 'number',
    required: false,
    min: 1,
    max: 100,
    default: 7,
    messages: {
      min: 'Keep count must be at least 1',
      max: 'Keep count must not exceed 100',
      type: 'Keep count must be a number'
    }
  },
  storageType: {
    type: 'enum',
    required: false,
    enum: Object.values(BackupStorageType),
    default: BackupStorageType.LOCAL,
    messages: {
      enum: `Storage type must be one of: ${Object.values(BackupStorageType).join(', ')}`
    }
  }
};