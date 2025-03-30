/**
 * Utility class for validating input data
 */
export class ValidationUtils {
  /**
   * Validate and sanitize filter parameters
   */
  static sanitizeFilters<T extends Record<string, any>>(
    filters: Partial<T>,
    allowedFilters: string[],
    defaults?: Record<string, any>
  ): Partial<T> {
    const sanitized: Partial<T> = { ...(defaults as Partial<T>) };
    
    for (const key of allowedFilters) {
      if (filters[key] !== undefined) {
        sanitized[key as keyof T] = filters[key];
      }
    }
    
    return sanitized;
  }

  /**
   * Parse numeric parameter safely
   */
  static parseNumericParam(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Parse date parameter safely
   */
  static parseDateParam(value: string | undefined): Date | undefined {
    if (!value) return undefined;
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validate phone number format (basic validation)
   */
  static isValidPhone(phone: string): boolean {
    // This is a simple validation, a more comprehensive one might be needed
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  }
  
  /**
   * Validate if a string is within min and max length
   */
  static isValidLength(str: string, min: number, max: number): boolean {
    return str.length >= min && str.length <= max;
  }
}