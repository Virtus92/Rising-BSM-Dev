import { SystemSettings } from '@/contexts/SettingsContext';

/**
 * Initialize global settings for client-side access
 * This is used by utilities like date-formatter that don't have direct access to the settings context
 */
export function initializeClientSettings(settings: SystemSettings): void {
  try {
    if (typeof window !== 'undefined') {
      (window as any).__SETTINGS__ = settings;
    }
  } catch (error) {
    console.error('Failed to initialize client settings:', error);
  }
}

/**
 * Get global settings (used by utilities without direct context access)
 */
export function getClientSettings(): Partial<SystemSettings> {
  try {
    if (typeof window !== 'undefined' && (window as any).__SETTINGS__) {
      return (window as any).__SETTINGS__;
    }
  } catch (error) {
    console.error('Failed to get client settings:', error);
  }
  
  return {};
}
