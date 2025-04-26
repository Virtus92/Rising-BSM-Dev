/**
 * User validation utilities
 * 
 * Contains common validation functions and formatters for user-related data.
 */

/**
 * Validates an email address format
 * 
 * @param email - Email address to validate
 * @returns Whether the email is valid
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password strength
 * 
 * @param password - Password to validate
 * @returns Validation result with errors
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a phone number format
 * 
 * @param phone - Phone number to validate
 * @returns Whether the phone number is valid
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove all non-digit characters for validation
  const digits = phone.replace(/\D/g, '');
  
  // Check if we have enough digits for a valid phone number (at least 8)
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * Formats a phone number for display
 * 
 * @param phone - Raw phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Keep only digits
  const digits = phone.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  } else if (digits.length > 10) {
    // International format: +X XXX XXX-XXXX
    return `+${digits.substring(0, digits.length-10)} ${digits.substring(digits.length-10, digits.length-7)} ${digits.substring(digits.length-7, digits.length-4)}-${digits.substring(digits.length-4)}`;
  } else {
    // Just add hyphens for shorter numbers
    return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
  }
}

/**
 * Validates a name
 * 
 * @param name - Name to validate
 * @returns Whether the name is valid
 */
export function validateName(name: string): boolean {
  return !!name && name.trim().length >= 2;
}

/**
 * Validates user data
 * 
 * @param userData - User data to validate
 * @returns Validation result
 */
export function validateUserData(userData: { 
  name?: string; 
  email?: string; 
  phone?: string;
  password?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Validate name
  if (userData.name !== undefined && !validateName(userData.name)) {
    errors.name = 'Name must be at least 2 characters long';
  }
  
  // Validate email
  if (userData.email !== undefined && !validateEmail(userData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Validate phone
  if (userData.phone !== undefined && userData.phone && !validatePhone(userData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  // Validate password
  if (userData.password !== undefined) {
    const passwordResult = validatePassword(userData.password);
    if (!passwordResult.valid) {
      errors.password = passwordResult.errors.join('. ');
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  formatPhoneNumber,
  validateName,
  validateUserData
};
