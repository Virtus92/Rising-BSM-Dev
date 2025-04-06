/**
 * Settings API-Client
 * Enthält alle Funktionen für Systemeinstellungen
 */
import { get, put, ApiResponse } from './config';

/**
 * Systemeinstellungen-Modell
 */
export interface SystemSettings {
  id?: number;
  companyName: string;
  companyLogo?: string;
  primaryColor: string;
  accentColor: string;
  defaultCurrency: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  emailSignature?: string;
  contactEmail: string;
  contactPhone?: string;
  maxUploadSize: number;
  maintenanceMode: boolean;
  updatedAt?: string;
}

/**
 * Hole alle Systemeinstellungen
 */
export async function getSettings(): Promise<ApiResponse<SystemSettings>> {
  return get('/settings');
}

/**
 * Aktualisiere Systemeinstellungen
 */
export async function updateSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
  return put('/settings', settings);
}

/**
 * Hole Benutzereinstellungen für den aktuellen Benutzer
 */
export async function getUserSettings(): Promise<ApiResponse<any>> {
  return get('/settings/user');
}

/**
 * Aktualisiere Benutzereinstellungen
 */
export async function updateUserSettings(settings: any): Promise<ApiResponse<any>> {
  return put('/settings/user', settings);
}

/**
 * Hole System-Informationen (Version, Status, etc.)
 */
export async function getSystemInfo(): Promise<ApiResponse<any>> {
  return get('/settings/system-info');
}
