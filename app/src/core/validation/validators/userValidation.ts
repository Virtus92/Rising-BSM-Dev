/**
 * User validation schemas
 * This file contains schemas for user-related data validation
 */

import { SchemaDefinition } from '../IValidationService';
import { UserRole, UserStatus } from '@/domain/enums/UserEnums';

/**
 * Schema for user creation
 */
export const createUserSchema: SchemaDefinition = {
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    type: 'string',
    format: 'email',
    required: true,
    maxLength: 255
  },
  password: {
    type: 'string',
    minLength: 8,
    maxLength: 100,
    required: true
  },
  confirmPassword: {
    type: 'string',
    required: true
  },
  role: {
    type: 'string',
    enum: Object.values(UserRole),
    required: false
  },
  status: {
    type: 'string',
    enum: Object.values(UserStatus),
    required: false
  },
  phone: {
    type: 'string',
    format: 'phone',
    required: false,
    maxLength: 20
  },
  profilePicture: {
    type: 'string',
    format: 'url',
    required: false,
    maxLength: 2000
  }
};

/**
 * Schema for user update
 */
export const updateUserSchema: SchemaDefinition = {
  name: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 100
  },
  email: {
    type: 'string',
    format: 'email',
    required: false,
    maxLength: 255
  },
  role: {
    type: 'string',
    enum: Object.values(UserRole),
    required: false
  },
  status: {
    type: 'string',
    enum: Object.values(UserStatus),
    required: false
  },
  phone: {
    type: 'string',
    format: 'phone',
    required: false,
    maxLength: 20
  },
  profilePicture: {
    type: 'string',
    required: false,
    maxLength: 2000
  }
};

/**
 * Schema for password change
 */
export const changePasswordSchema: SchemaDefinition = {
  currentPassword: {
    type: 'string',
    required: true
  },
  newPassword: {
    type: 'string',
    minLength: 8,
    maxLength: 100,
    required: true
  },
  confirmPassword: {
    type: 'string',
    required: true
  }
};

/**
 * Schema for login
 */
export const loginSchema: SchemaDefinition = {
  email: {
    type: 'string',
    format: 'email',
    required: true
  },
  password: {
    type: 'string',
    required: true
  },
  remember: {
    type: 'boolean',
    required: false
  }
};

/**
 * Validate user password strength
 * 
 * @param password Password to validate
 * @returns Validation result with isValid flag and errors array
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
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
    isValid: errors.length === 0,
    errors
  };
}
