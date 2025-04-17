/**
 * Utility functions for password management
 */

/**
 * Generates a secure random password
 * 
 * @param length - Length of the password (default: 12)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  // No I or O (can be confused with 1 and 0)
  const lowercaseChars = 'abcdefghijkmnpqrstuvwxyz';  // No l (can be confused with 1)
  const numberChars = '23456789';  // No 0 or 1 (can be confused with O and l)
  const specialChars = '!@#$%^&*()_-+=<>?';
  
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Ensure at least one of each character type
  let password = '';
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return shuffleString(password);
}

/**
 * Fisher-Yates shuffle algorithm for strings
 * 
 * @param str - String to shuffle
 * @returns Shuffled string
 */
function shuffleString(str: string): string {
  const arr = str.split('');
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr.join('');
}

/**
 * Validates that a password meets security requirements
 * 
 * @param password - Password to validate
 * @returns Whether the password is valid
 */
export function isPasswordValid(password: string): boolean {
  // At least 8 characters
  if (password.length < 8) {
    return false;
  }
  
  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  
  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }
  
  // Must contain at least one digit
  if (!/[0-9]/.test(password)) {
    return false;
  }
  
  // Must contain at least one special character
  if (!/[!@#$%^&*()_\-+=<>?]/.test(password)) {
    return false;
  }
  
  return true;
}

/**
 * Gets detailed password validation results
 * 
 * @param password - Password to validate
 * @returns Object with validation results
 */
export function getPasswordValidationDetails(password: string): Record<string, boolean> {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_\-+=<>?]/.test(password),
    isValid: isPasswordValid(password)
  };
}
