/**
 * API-Client für Systemeinstellungen
 */
import { ApiClient, ApiResponse, apiClient } from '@/infrastructure/clients/ApiClient';

// API-URL für Einstellungen
const SETTINGS_API_URL = '/api/settings';

/**
 * Systemeinstellungen-Interface
 */
export interface SystemSettings {
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyWebsite?: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  [key: string]: any;
}

/**
 * Client für Einstellungsanfragen
 */
export class SettingsClient {
  /**
   * Singleton-Instanz des API-Clients
   */
  private static apiClient = apiClient;

  /**
   * Lädt die Systemeinstellungen
   * 
   * @returns API-Antwort mit Systemeinstellungen
   */
  static async getSettings(): Promise<ApiResponse<SystemSettings>> {
    try {
      return await SettingsClient.apiClient.get(SETTINGS_API_URL);
    } catch (error) {
      console.error('Error fetching settings:', error);
      
      // Wenn die API nicht erreichbar ist, Standard-Einstellungen zurückgeben
      return {
        success: true,
        message: 'Default settings loaded (fallback)',
        data: {
          companyName: 'Rising BSM',
          dateFormat: 'dd.MM.yyyy',
          timeFormat: 'HH:mm',
          currency: 'EUR',
          language: 'de',
          theme: 'system'
        }
      };
    }
  }

  /**
   * Aktualisiert eine Systemeinstellung
   * 
   * @param key - Schlüssel der Einstellung
   * @param value - Neuer Wert
   * @returns API-Antwort
   */
  static async updateSetting(key: string, value: any): Promise<ApiResponse<any>> {
    try {
      return await SettingsClient.apiClient.put(`${SETTINGS_API_URL}/update`, { key, value });
    } catch (error) {
      console.error('Error updating setting:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }

  /**
   * Aktualisiert mehrere Systemeinstellungen auf einmal
   * 
   * @param settings - Einstellungsobjekt mit zu aktualisierenden Werten
   * @returns API-Antwort
   */
  static async updateSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    try {
      return await SettingsClient.apiClient.put(SETTINGS_API_URL, settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }

  /**
   * Setzt die Systemeinstellungen auf die Standardwerte zurück
   * 
   * @returns API-Antwort
   */
  static async resetSettings(): Promise<ApiResponse<SystemSettings>> {
    try {
      return await SettingsClient.apiClient.post(`${SETTINGS_API_URL}/reset`, {});
    } catch (error) {
      console.error('Error resetting settings:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
}
