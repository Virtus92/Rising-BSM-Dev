/**
 * Auth module types
 */

// Form data types
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
  email?: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

// Validation types for auth forms
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: {
    score: number;
    feedback: string;
  };
}
