/**
 * Format Utilities
 * 
 * Functions for consistent data formatting across the application.
 * Centralizes all formatting logic for dates, numbers, currency, etc.
 */
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Format a date safely to a specific format
 * @param date The date to format
 * @param formatString Format string for date-fns
 * @param defaultValue Value to return if date is invalid
 * @returns Formatted date or default value
 */
export const formatDateSafely = (
  date: string | Date | null | undefined, 
  formatString: string = 'dd.MM.yyyy', 
  defaultValue: string = 'Unbekannt'
): string => {
  try {
    if (!date) return defaultValue;
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return defaultValue;
    }
    
    return format(parsedDate, formatString, { locale: de });
  }
  catch (error) {
    return defaultValue;
  }
};

/**
 * Format a date as a relative time string
 * @param date The date to format
 * @param options Options for formatDistanceToNow
 * @returns Relative time string
 */
export const formatRelativeTime = (
  date: string | Date | null | undefined, 
  options: Record<string, any> = {}
): string => {
  try {
    if (!date) return 'Unbekannt';
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Ungültiges Datum';
    }
    
    return formatDistanceToNow(parsedDate, { 
      addSuffix: true, 
      locale: de,
      ...options
    });
  }
  catch (error) {
    return 'Unbekannt';
  }
};

/**
 * Format a date with a special label for today/tomorrow
 * @param date The date to format
 * @returns Date information with label and class
 */
export const formatDateWithLabel = (
  date: string | Date | null | undefined
): { label: string; fullDate?: string; class: string } => {
  try {
    if (!date) return { label: 'Unbekannt', class: 'secondary' };
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return { label: 'Ungültiges Datum', class: 'danger' };
    }
    
    if (isToday(parsedDate)) {
      return { 
        label: 'Heute', 
        fullDate: format(parsedDate, 'dd.MM.yyyy'),
        class: 'primary' 
      };
    }
    
    if (isTomorrow(parsedDate)) {
      return { 
        label: 'Morgen', 
        fullDate: format(parsedDate, 'dd.MM.yyyy'),
        class: 'success' 
      };
    }

    if (isYesterday(parsedDate)) {
      return { 
        label: 'Gestern', 
        fullDate: format(parsedDate, 'dd.MM.yyyy'),
        class: 'warning' 
      };
    }
    
    return { 
      label: format(parsedDate, 'dd.MM.yyyy'),
      fullDate: format(parsedDate, 'dd.MM.yyyy'),
      class: 'secondary' 
    };
  } catch (error) {
    return { label: 'Unbekannt', class: 'secondary' };
  }
};

/**
 * Format a currency amount
 * @param amount The amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | Decimal | null | undefined, 
  currency: string = 'EUR'
): string => {
  try {
    if (amount === null || amount === undefined) return '-';
    
    // Handle Prisma Decimal type
    const numericAmount = amount instanceof Decimal ? 
      parseFloat(amount.toString()) : amount;
    
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency
    }).format(numericAmount);
  } catch (error) {
    return '-';
  }
};

/**
 * Format a number with thousand separators
 * @param number The number to format
 * @param decimals Number of decimal places
 * @returns Formatted number
 */
export const formatNumber = (
  number: number | Decimal | null | undefined, 
  decimals: number = 2
): string => {
  try {
    if (number === null || number === undefined) return '-';
    
    // Handle Prisma Decimal type
    const numericValue = number instanceof Decimal ? 
      parseFloat(number.toString()) : number;
    
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(numericValue);
  } catch (error) {
    return '-';
  }
};

/**
 * Format a percentage
 * @param value Value to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage
 */
export const formatPercentage = (
  value: number | Decimal | null | undefined, 
  decimals: number = 1
): string => {
  try {
    if (value === null || value === undefined) return '-';
    
    // Handle Prisma Decimal type
    const numericValue = value instanceof Decimal ? 
      parseFloat(value.toString()) : value;
    
    return new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(numericValue / 100);
  } catch (error) {
    return '-';
  }
};

/**
 * Format a file size
 * @param bytes Size in bytes
 * @returns Formatted file size
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  try {
    if (bytes === null || bytes === undefined) return '-';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
    
    return `${formattedSize} ${sizes[i]}`;
  } catch (error) {
    return '-';
  }
};

/**
 * Format a phone number
 * @param number Phone number to format
 * @returns Formatted phone number
 */
export const formatPhone = (number: string | null | undefined): string => {
  try {
    if (!number) return '-';
    
    // Basic phone formatting
    const digits = number.replace(/\D/g, '');
    
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 7) {
      return digits.replace(/(\d{3})(\d+)/, '$1 $2');
    } else if (digits.length <= 10) {
      return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
    } else {
      return digits.replace(/(\d{3})(\d{3})(\d{2})(\d+)/, '$1 $2 $3 $4');
    }
  } catch (error) {
    return number || '-';
  }
};

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export const truncateText = (
  text: string | null | undefined, 
  maxLength: number = 100
): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Convert string to title case
 * @param text Text to convert
 * @returns Title cased text
 */
export const toTitleCase = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};