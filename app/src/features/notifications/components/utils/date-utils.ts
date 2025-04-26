/**
 * Date utilities for formatting dates consistently across the application
 */

/**
 * Format a date object or string into a localized string
 * 
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions to customize the output
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check for invalid date
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDate:', date);
    return 'Invalid date';
  }
  
  try {
    return new Intl.DateTimeFormat('de-DE', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error as Error);
    return String(dateObj);
  }
}

/**
 * Format a date as a relative time (e.g., "2 hours ago", "yesterday")
 * 
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check for invalid date
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatRelativeTime:', date);
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'gerade eben';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `vor ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    
    if (days === 1) {
      return 'gestern';
    }
    
    return `vor ${days} Tagen`;
  }
  
  // Less than a month
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `vor ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`;
  }
  
  // Less than a year
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `vor ${months} ${months === 1 ? 'Monat' : 'Monaten'}`;
  }
  
  // More than a year
  const years = Math.floor(diffInSeconds / 31536000);
  return `vor ${years} ${years === 1 ? 'Jahr' : 'Jahren'}`;
}

/**
 * Format a date as a short date string (DD.MM.YYYY)
 * 
 * @param date - Date to format
 * @returns Short date string
 */
export function formatShortDate(date: Date | string): string {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a date as a time string (HH:MM)
 * 
 * @param date - Date to format
 * @returns Time string
 */
export function formatTime(date: Date | string): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default {
  formatDate,
  formatRelativeTime,
  formatShortDate,
  formatTime
};