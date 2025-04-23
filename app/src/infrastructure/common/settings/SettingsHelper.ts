/**
 * Utility functions for system settings
 */
import { SystemSettings } from '@/infrastructure/api/SettingsClient';

// Global settings for utility functions
let globalSettings: SystemSettings = {
  companyName: 'Rising BSM',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  currency: 'EUR',
  language: 'de',
  theme: 'system'
};

/**
 * Initializes the client settings
 * 
 * @param settings - Global settings
 */
export function initializeClientSettings(settings: SystemSettings): void {
  globalSettings = {
    ...globalSettings,
    ...settings
  };
  
  // Apply settings with system-wide effects
  if (typeof window !== 'undefined') {
    // Set language
    document.documentElement.lang = settings.language || 'de';
    
    // Apply theme
    applyTheme(settings.theme);
  }
}

/**
 * Gets a specific setting
 * 
 * @param key - Setting key
 * @param defaultValue - Default value if setting is not found
 * @returns Setting value
 */
export function getSetting<T>(key: string, defaultValue?: T): T {
  return (globalSettings[key] !== undefined ? globalSettings[key] : defaultValue) as T;
}

/**
 * Applies the selected theme to the application
 * 
 * @param theme - Theme ('light', 'dark' or 'system')
 */
export function applyTheme(theme: string): void {
  if (typeof window === 'undefined') return;
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (theme === 'system') {
    // Use system setting
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

/**
 * Formats a date according to settings
 * 
 * @param date - Date to format
 * @param format - Optional format
 * @returns Formatted date
 */
export function formatDate(date: Date | string, format?: string): string {
  if (!date) return '';
  
  // Convert date
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use format or get from settings
  const dateFormat = format || globalSettings.dateFormat || 'dd.MM.yyyy';
  
  try {
    // Implement simple formatting
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    // Apply format
    return dateFormat
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year.toString())
      .replace('yy', year.toString().slice(-2));
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toString();
  }
}

/**
 * Formats a time according to settings
 * 
 * @param time - Time to format
 * @param format - Optional format
 * @returns Formatted time
 */
export function formatTime(time: Date | string, format?: string): string {
  if (!time) return '';
  
  // Convert time
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  
  // Use format or get from settings
  const timeFormat = format || globalSettings.timeFormat || 'HH:mm';
  
  try {
    // Implement simple formatting
    const hours = timeObj.getHours().toString().padStart(2, '0');
    const minutes = timeObj.getMinutes().toString().padStart(2, '0');
    const seconds = timeObj.getSeconds().toString().padStart(2, '0');
    
    // Apply format
    return timeFormat
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  } catch (error) {
    console.error('Error formatting time:', error);
    return time.toString();
  }
}

/**
 * Formats a currency amount according to settings
 * 
 * @param amount - Amount to format
 * @param currency - Optional currency
 * @returns Formatted amount
 */
export function formatCurrency(amount: number, currency?: string): string {
  const currencyCode = currency || globalSettings.currency || 'EUR';
  
  try {
    // Use Intl API for currency formatting
    return new Intl.NumberFormat(globalSettings.language || 'de-DE', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount} ${currencyCode}`;
  }
}
