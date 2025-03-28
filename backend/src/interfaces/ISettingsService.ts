import { UserSettings } from '@prisma/client';

/**
 * Data for updating user settings
 */
export interface UpdateUserSettingsData {
  darkMode?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  language?: string;
  notificationInterval?: string;
}

/**
 * Data for system settings
 */
export interface SystemSettingData {
  key: string;
  value: string;
  description?: string;
}

/**
 * Optional context for service calls
 */
export interface ServiceContext {
  userId?: number;
  ipAddress?: string;
}

/**
 * Service options for settings operations
 */
export interface SettingsServiceOptions {
  context?: ServiceContext;
}

/**
 * Interface for Settings Service
 */
export interface ISettingsService {
  /**
   * Get user settings by user ID
   * 
   * @param userId - ID of the user
   * @returns User settings
   */
  getUserSettings(userId: number): Promise<UserSettings | null>;

  /**
   * Update user settings
   * 
   * @param userId - ID of the user
   * @param data - Settings data to update
   * @param options - Optional service options
   * @returns Updated user settings
   */
  updateUserSettings(
    userId: number, 
    data: UpdateUserSettingsData, 
    options?: SettingsServiceOptions
  ): Promise<UserSettings>;

  /**
   * Get system settings
   * 
   * @returns All system settings
   */
  getSystemSettings(): Promise<SystemSettingData[]>;

  /**
   * Get specific system setting by key
   * 
   * @param key - Setting key
   * @returns System setting
   */
  getSystemSetting(key: string): Promise<SystemSettingData | null>;

  /**
   * Update system setting
   * 
   * @param key - Setting key
   * @param value - New setting value
   * @param description - Optional setting description
   * @param options - Optional service options
   * @returns Updated system setting
   */
  updateSystemSetting(
    key: string, 
    value: string, 
    description?: string, 
    options?: SettingsServiceOptions
  ): Promise<SystemSettingData>;

  /**
   * Create system setting if it doesn't exist
   * 
   * @param key - Setting key
   * @param value - Setting value
   * @param description - Optional setting description
   * @param options - Optional service options
   * @returns Created system setting
   */
  createSystemSetting(
    key: string, 
    value: string, 
    description?: string, 
    options?: SettingsServiceOptions
  ): Promise<SystemSettingData>;
}