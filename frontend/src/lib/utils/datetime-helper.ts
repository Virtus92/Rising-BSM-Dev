/**
 * DateTimeHelper
 * 
 * Utility class for date and time operations.
 * Provides standardized formatting and manipulation functions.
 */
export class DateTimeHelper {
  /**
   * Format a date
   * 
   * @param date - Date to format
   * @param format - Format string (simple format options)
   * @returns Formatted date string
   */
  static formatDate(date: Date | string | null | undefined, format: string = 'yyyy-MM-dd'): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Simple formatting based on format string
    switch (format) {
      case 'yyyy-MM-dd':
        return d.toISOString().split('T')[0];
      case 'dd.MM.yyyy':
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
      case 'yyyy-MM-dd HH:mm':
        return `${d.toISOString().split('T')[0]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      case 'dd.MM.yyyy HH:mm':
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      case 'ISO':
        return d.toISOString();
      default:
        return d.toISOString();
    }
  }

  /**
   * Format a date relative to current time (e.g., "5 minutes ago")
   * 
   * @param date - Date to format
   * @returns Formatted relative time
   */
  static formatRelativeTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Format a date as a duration from now
   * 
   * @param date - Future date
   * @returns Formatted duration
   */
  static formatDuration(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'past date';
    }
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Get start of day
   * 
   * @param date - Date to get start of day for
   * @returns Date at start of day
   */
  static startOfDay(date: Date = new Date()): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Get end of day
   * 
   * @param date - Date to get end of day for
   * @returns Date at end of day
   */
  static endOfDay(date: Date = new Date()): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  /**
   * Get start of month
   * 
   * @param date - Date to get start of month for
   * @returns Date at start of month
   */
  static startOfMonth(date: Date = new Date()): Date {
    const newDate = new Date(date);
    newDate.setDate(1);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Get end of month
   * 
   * @param date - Date to get end of month for
   * @returns Date at end of month
   */
  static endOfMonth(date: Date = new Date()): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    newDate.setDate(0);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  /**
   * Format currency
   * 
   * @param amount - Amount to format
   * @param locale - Locale string (default: 'de-DE')
   * @param currency - Currency code (default: 'EUR')
   * @returns Formatted currency string
   */
  static formatCurrency(amount: number, locale: string = 'de-DE', currency: string = 'EUR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format percentage
   * 
   * @param value - Value to format as percentage
   * @param locale - Locale string (default: 'de-DE')
   * @param digits - Decimal digits (default: 2)
   * @returns Formatted percentage string
   */
  static formatPercentage(value: number, locale: string = 'de-DE', digits: number = 2): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value / 100);
  }
}

export default DateTimeHelper;