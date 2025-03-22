/**
 * Settings-related DTOs
 */
export interface UserSettingsUpdateDto {
  sprache?: string;
  dark_mode?: boolean;
  benachrichtigungen_email?: boolean;
  benachrichtigungen_push?: boolean;
  benachrichtigungen_intervall?: string;
}

export interface UserSettingsResponseDto {
  sprache: string;
  dark_mode: boolean;
  benachrichtigungen_email: boolean;
  benachrichtigungen_push: boolean;
  benachrichtigungen_intervall: string;
}

export interface SystemSettingsResponseDto {
  siteTitle: string;
  logo: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  vatNumber: string;
  defaultLanguage: string;
  defaultVatRate: number;
  systemEmail: string;
  maintenanceMode: boolean;
  emailNotifications: boolean;
}

export interface SystemSettingsUpdateDto {
  siteTitle?: string;
  logo?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  vatNumber?: string;
  defaultLanguage?: string;
  defaultVatRate?: number;
  systemEmail?: string;
  maintenanceMode?: boolean;
  emailNotifications?: boolean;
}

export interface BackupSettingsResponseDto {
  autoBackup: boolean;
  frequency: string;
  time: string;
  keepCount: number;
  storageType: string;
  lastBackup: string;
}

export interface BackupSettingsUpdateDto {
  autoBackup?: boolean;
  frequency?: string;
  time?: string;
  keepCount?: number;
  storageType?: string;
}

export interface BackupResponseDto {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  type: string;
}
