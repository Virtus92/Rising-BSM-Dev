/**
 * Validation rules for user-related operations
 */
import { getPasswordValidationDetails } from '@/core/security/validation/password-validation';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

/**
 * Validates user creation data
 * 
 * @param data - User creation data
 * @returns Validation result
 */
export function validateUserCreation(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }
  
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Email format is invalid');
  }
  
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  } else if (!getPasswordValidationDetails(data.password)) {
    errors.push('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
  }
  
  // Role validation
  if (data.role) {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }
  
  // Phone validation (if provided and not empty)
  if (data.phone !== undefined && data.phone !== '' && typeof data.phone === 'string' && !isValidPhone(data.phone)) {
    errors.push('Phone number format is invalid');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user update data
 * 
 * @param data - User update data
 * @returns Validation result
 */
export function validateUserUpdate(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // For profile updates, the data object should exist
  if (!data || typeof data !== 'object') {
    errors.push('Invalid update data provided');
    return { isValid: false, errors };
  }

  // Optional fields validation - only validate if they're defined
  if (data.name !== undefined && data.name !== null) {
    if (typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
  }
  
  if (data.email !== undefined && data.email !== null) {
    if (typeof data.email !== 'string' || !isValidEmail(data.email)) {
      errors.push('Email format is invalid');
    }
  }
  
  // Only validate password if it's actually provided (not empty string)
  if (data.password !== undefined && data.password !== null && data.password !== '') {
    if (typeof data.password !== 'string' || !getPasswordValidationDetails(data.password)) {
      errors.push('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
    }
  }
  
  // Role validation
  if (data.role !== undefined && data.role !== null) {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }
  
  // Status validation
  if (data.status !== undefined && data.status !== null) {
    const validStatuses = Object.values(UserStatus);
    if (!validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }
  
  // Phone validation - accept any string, including empty
  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    if (typeof data.phone !== 'string' || !isValidPhone(data.phone)) {
      errors.push('Phone number format is invalid');
    }
  }
  
  // Profile picture - don't validate, accept any string
  
  // If there are no validation errors, it's valid
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates password change data
 * 
 * @param data - Password change data
 * @returns Validation result
 */
export function validatePasswordChange(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!data.currentPassword || typeof data.currentPassword !== 'string') {
    errors.push('Current password is required');
  }
  
  if (!data.newPassword || typeof data.newPassword !== 'string') {
    errors.push('New password is required');
  } else if (!getPasswordValidationDetails(data.newPassword)) {
    errors.push('New password must be at least 8 characters and include uppercase, lowercase, number, and special character');
  }
  
  if (!data.confirmPassword || typeof data.confirmPassword !== 'string') {
    errors.push('Password confirmation is required');
  } else if (data.newPassword !== data.confirmPassword) {
    errors.push('New password and confirmation do not match');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates an email address format
 * 
 * @param email - Email to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates a phone number format
 * 
 * @param phone - Phone number to validate
 * @returns Whether the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Empty is valid (optional field)
  
  // More flexible phone regex that supports various international formats
  // Supports formats:
  // - International: +XX XXX XXX XXXX
  // - European: +XX XXX XXXXXX
  // - German: +49 123 456789 or 0123 456789
  // - US/Standard: (XXX) XXX-XXXX or XXX-XXX-XXXX
  // - Simple: XXXXXXXXXX
  const phoneRegex = /^(\+?\d{1,3}[- .]?)?\(?(?:\d{1,5})\)?[- .]?(?:\d{1,5})[- .]?(?:\d{1,9})$/;
  
  // Remove any extension part (x12345)
  const cleanPhone = phone.split(/\s*x\d+/).join('');
  return phoneRegex.test(cleanPhone);
}

/**
 * Formats a phone number to ensure consistent display
 * 
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove any extension parts
  return phone.split(/\s*x\d+/).join('').trim();
}
