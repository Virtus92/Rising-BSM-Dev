/**
 * API-Client for System Settings
 */
import { ApiClient, ApiResponse, apiClient } from '@/core/api/ApiClient';

// API-URL for settings
const SETTINGS_API_URL = '/settings';

/**
 * System Settings Interface
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
 * Client for settings requests
 */
export class SettingsClient {
  /**
   * Singleton instance of the API client
   */
  private static apiClient = apiClient;

  /**
   * Loads the system settings
   * 
   * @returns API response with system settings
   */
  static async getSettings(): Promise<ApiResponse<SystemSettings>> {
    try {
      return await SettingsClient.apiClient.get(SETTINGS_API_URL);
    } catch (error) {
      console.error('Error fetching settings:', error as Error);
      
      // Return default settings if API is not reachable
      return {
        success: true,
        message: 'Default settings loaded (fallback)',
        data: {
          companyName: 'Rising BSM',
          dateFormat: 'dd.MM.yyyy',
          timeFormat: 'HH:mm',
          currency: 'EUR',
          language: 'en',
          theme: 'system'
        }
      };
    }
  }

  /**
   * Updates a system setting
   * 
   * @param key - Key of the setting
   * @param value - New value
   * @returns API response
   */
  static async updateSetting(key: string, value: any): Promise<ApiResponse<any>> {
    try {
      return await SettingsClient.apiClient.put(`${SETTINGS_API_URL}/update`, { key, value });
    } catch (error) {
      console.error('Error updating setting:', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
        data: null
      };
    }
  }

  /**
   * Updates multiple system settings at once
   * 
   * @param settings - Settings object with values to update
   * @returns API response
   */
  static async updateSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    try {
      return await SettingsClient.apiClient.put(SETTINGS_API_URL, settings);
    } catch (error) {
      console.error('Error updating settings:', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
        data: null
      };
    }
  }

  /**
   * Resets the system settings to default values
   * 
   * @returns API response
   */
  static async resetSettings(): Promise<ApiResponse<SystemSettings>> {
    try {
      return await SettingsClient.apiClient.post(`${SETTINGS_API_URL}/reset`, {});
    } catch (error) {
      console.error('Error resetting settings:', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
        data: null
      };
    }
  }
}