import { getClientSettings } from './settings-helper';

/**
 * Consistent date formatting utilities
 * These utilities will respect the global settings for date format.
 */

// Default date format if settings are not available
const DEFAULT_DATE_FORMAT = 'de-DE';
const DEFAULT_TIME_FORMAT = { hour: '2-digit', minute: '2-digit' };

// Function to get date format from settings or use default
const getDateFormat = (): string => {
  try {
    // Use the settings helper
    const settings = getClientSettings();
    return settings.dateFormat || DEFAULT_DATE_FORMAT;
  } catch (e) {
    console.error('Error accessing settings:', e);
  }
  return DEFAULT_DATE_FORMAT;
};

/**
 * Format a date with or without time
 * @param date Date string or Date object
 * @param includeTime Whether to include time in the output
 * @param useLocale Locale to use for formatting (default: from settings)
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | null | undefined, includeTime = false, useLocale?: string): string => {
  if (!date) return 'Keine Zeit angegeben';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum';
    }
    
    // Get locale from settings or use default
    const locale = useLocale || getDateFormat();
    
    const dateOptions: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    
    if (includeTime) {
      return dateObj.toLocaleString(locale, {
        ...dateOptions,
        ...DEFAULT_TIME_FORMAT
      });
    }
    
    return dateObj.toLocaleDateString(locale, dateOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fehler bei der Datumsformatierung';
  }
};

/**
 * Format a time string from a date
 * @param date Date string or Date object
 * @returns Formatted time string
 */
export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Keine Zeit angegeben';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Ungültige Zeit';
    }
    
    // Get locale from settings or use default
    const locale = getDateFormat();
    
    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Fehler bei der Zeitformatierung';
  }
};

/**
 * Format a date range
 * @param startDate Start date string or Date object
 * @param endDate End date string or Date object
 * @param includeTime Whether to include time in the output
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startDate: string | Date | null | undefined, 
  endDate: string | Date | null | undefined,
  includeTime = false
): string => {
  if (!startDate) return 'Kein Zeitraum angegeben';
  
  const formattedStart = formatDate(startDate, includeTime);
  
  if (!endDate) return formattedStart;
  
  const formattedEnd = formatDate(endDate, includeTime);
  return `${formattedStart} - ${formattedEnd}`;
};

/**
 * Formats a date relative to now (today, yesterday, tomorrow, or formatted date)
 * @param date Date string or Date object
 * @param includeTime Whether to include time in the output
 * @returns Relative formatted date string
 */
export const formatRelativeDate = (date: string | Date | null | undefined, includeTime = false): string => {
  if (!date) return 'Keine Zeit angegeben';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum';
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset hours for comparison
    const compareDate = new Date(dateObj);
    compareDate.setHours(0, 0, 0, 0);
    
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    
    const tomorrowDate = new Date(tomorrow);
    tomorrowDate.setHours(0, 0, 0, 0);
    
    const yesterdayDate = new Date(yesterday);
    yesterdayDate.setHours(0, 0, 0, 0);
    
    let prefix = '';
    
    if (compareDate.getTime() === todayDate.getTime()) {
      prefix = 'Heute';
    } else if (compareDate.getTime() === tomorrowDate.getTime()) {
      prefix = 'Morgen';
    } else if (compareDate.getTime() === yesterdayDate.getTime()) {
      prefix = 'Gestern';
    } else {
      return formatDate(dateObj, includeTime);
    }
    
    if (includeTime) {
      return `${prefix}, ${formatTime(dateObj)}`;
    }
    
    return prefix;
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Fehler bei der Datumsformatierung';
  }
};
