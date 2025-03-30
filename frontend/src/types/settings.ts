/**
 * Settings-related interfaces
 */

export interface UserSettings {
  language: 'de' | 'en';
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationInterval: 'immediate' | 'daily' | 'weekly';
}

export interface UserSettingsUpdate {
  language?: 'de' | 'en';
  darkMode?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  notificationInterval?: 'immediate' | 'daily' | 'weekly';
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  settings: SystemSetting[];
}

export interface SystemSettingUpdate {
  key: string;
  value: string;
  description?: string;
}
