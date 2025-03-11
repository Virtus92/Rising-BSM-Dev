/**
 * Formatter utilities
 * Functions for consistent data formatting across the application
 */
const { format, formatDistanceToNow, isToday, isTomorrow } = require('date-fns');
const { de } = require('date-fns/locale');

/**
 * Format a date safely to a specific format
 * @param {string|Date} date - The date to format
 * @param {string} formatString - Format string for date-fns
 * @param {string} defaultValue - Value to return if date is invalid
 * @returns {string} Formatted date or default value
 */
exports.formatDateSafely = (date, formatString, defaultValue = 'Unbekannt') => {
  try {
    if (!date) return defaultValue;
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.error(`Invalid date format: ${date} with format: ${formatString}`);
      return defaultValue;
    }
    
    return format(parsedDate, formatString, { locale: de });
  } catch (error) {
    console.error('Error formatting date:', error);
    return defaultValue;
  }
};

/**
 * Format a date as a relative time string
 * @param {string|Date} date - The date to format
 * @param {object} options - Options for formatDistanceToNow
 * @returns {string} Relative time string
 */
exports.formatRelativeTime = (date, options = {}) => {
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
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unbekannt';
  }
};

/**
 * Format a date with a special label for today/tomorrow
 * @param {string|Date} date - The date to format
 * @param {string} formatString - Format for other dates
 * @returns {object} Date information with label and class
 */
exports.formatDateWithLabel = (date) => {
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
    
    return { 
      label: format(parsedDate, 'dd.MM.yyyy'),
      fullDate: format(parsedDate, 'dd.MM.yyyy'),
      class: 'secondary' 
    };
  } catch (error) {
    console.error('Error formatting date with label:', error);
    return { label: 'Unbekannt', class: 'secondary' };
  }
};

/**
 * Format a currency amount
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: EUR)
 * @returns {string} Formatted currency string
 */
exports.formatCurrency = (amount, currency = 'EUR') => {
  try {
    if (amount === null || amount === undefined) return '-';
    
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '-';
  }
};

/**
 * Format a number with thousand separators
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
exports.formatNumber = (number, decimals = 2) => {
  try {
    if (number === null || number === undefined) return '-';
    
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '-';
  }
};

/**
 * Format a percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
exports.formatPercentage = (value, decimals = 1) => {
  try {
    if (value === null || value === undefined) return '-';
    
    return new Intl.NumberFormat('de-DE', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '-';
  }
};

/**
 * Format a file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
exports.formatFileSize = (bytes) => {
  try {
    if (bytes === null || bytes === undefined) return '-';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
    
    return `${formattedSize} ${sizes[i]}`;
  } catch (error) {
    console.error('Error formatting file size:', error);
    return '-';
  }
};

/**
 * Format a phone number
 * @param {string} number - Phone number to format
 * @returns {string} Formatted phone number
 */
exports.formatPhone = (number) => {
  try {
    if (!number) return '-';
    
    // Basic phone formatting - this could be improved with libphonenumber
    // For now, just ensure consistency and readability
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
    console.error('Error formatting phone number:', error);
    return number || '-';
  }
};