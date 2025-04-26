/**
 * Password validation utilities
 * 
 * These functions provide password validation and strength checking
 */
import { ValidationResult } from '@/core/validation';
import { generateSecureString } from '../password-utils';

/**
 * Password validation criteria
 */
export interface PasswordCriteria {
  minLength: number;
  requiresLowercase: boolean;
  requiresUppercase: boolean;
  requiresNumber: boolean;
  requiresSpecial: boolean;
}

/**
 * Default password criteria
 */
export const DEFAULT_PASSWORD_CRITERIA: PasswordCriteria = {
  minLength: 8,
  requiresLowercase: true,
  requiresUppercase: true,
  requiresNumber: true,
  requiresSpecial: true
};

/**
 * Password validation details
 */
export interface PasswordValidationDetails {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
  hasMinLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

/**
 * Password generation options
 */
export interface PasswordGenerationOptions {
  length?: number;
  includeLowercase?: boolean;
  includeUppercase?: boolean;
  includeNumbers?: boolean;
  includeSpecial?: boolean;
}

/**
 * Validate password strength against criteria
 * 
 * @param password - Password to validate
 * @param criteria - Optional custom validation criteria
 * @returns Validation result with isValid flag and errors array
 */
export function validatePasswordStrength(
  password: string,
  criteria: PasswordCriteria = DEFAULT_PASSWORD_CRITERIA
): ValidationResult {
  const errors: string[] = [];
  
  // Check minimum length
  if (password.length < criteria.minLength) {
    errors.push(`Password must be at least ${criteria.minLength} characters long`);
  }
  
  // Check for lowercase letters
  if (criteria.requiresLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter');
  }
  
  // Check for uppercase letters
  if (criteria.requiresUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter');
  }
  
  // Check for numbers
  if (criteria.requiresNumber && !/[0-9]/.test(password)) {
    errors.push('Password must include at least one number');
  }
  
  // Check for special characters
  if (criteria.requiresSpecial && !/[\W_]/.test(password)) {
    errors.push('Password must include at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get detailed password validation information
 * 
 * @param password - Password to analyze
 * @param criteria - Optional custom validation criteria
 * @returns Detailed password validation information
 */
export function getPasswordValidationDetails(
  password: string,
  criteria: PasswordCriteria = DEFAULT_PASSWORD_CRITERIA
): PasswordValidationDetails {
  const hasMinLength = password.length >= criteria.minLength;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[\W_]/.test(password);
  
  // Calculate validation errors
  const errors: string[] = [];
  
  if (!hasMinLength) {
    errors.push(`Password must be at least ${criteria.minLength} characters long`);
  }
  
  if (criteria.requiresLowercase && !hasLowercase) {
    errors.push('Password must include at least one lowercase letter');
  }
  
  if (criteria.requiresUppercase && !hasUppercase) {
    errors.push('Password must include at least one uppercase letter');
  }
  
  if (criteria.requiresNumber && !hasNumber) {
    errors.push('Password must include at least one number');
  }
  
  if (criteria.requiresSpecial && !hasSpecial) {
    errors.push('Password must include at least one special character');
  }
  
  // Calculate password score
  let score = 0;
  
  // Base score from length
  score += Math.min(2, Math.floor(password.length / 4));
  
  // Add points for variety
  if (hasLowercase) score += 1;
  if (hasUppercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;
  
  // Add points for complexity
  if (password.length >= 10) score += 1;
  if (/[0-9].*[0-9]/.test(password)) score += 1; // At least 2 numbers
  if (/[\W_].*[\W_]/.test(password)) score += 1; // At least 2 special chars
  if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) score += 1; // Mixed case
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  
  if (score < 4 || errors.length > 0) {
    strength = 'weak';
  } else if (score < 6) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecial
  };
}

/**
 * Generate a secure password that meets criteria
 * 
 * @param options - Optional generation options
 * @returns Secure password
 */
export function generateSecurePassword(options?: PasswordGenerationOptions): string {
  const {
    length = 12,
    includeLowercase = true,
    includeUppercase = true,
    includeNumbers = true,
    includeSpecial = true
  } = options || {};
  
  let charset = '';
  
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeNumbers) charset += '0123456789';
  if (includeSpecial) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';
  
  // Use the existing utility for secure string generation
  return generateSecureString(length, charset);
}

// Export the functions as the default export for compatibility
export default {
  validatePasswordStrength,
  getPasswordValidationDetails,
  generateSecurePassword
};