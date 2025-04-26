/**
 * Auth API Models
 * 
 * This file exports API models/schemas for authentication endpoints
 */

/**
 * Login Request Model
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register Request Model
 */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role?: string;
}

/**
 * Refresh Token Request Model
 */
export interface RefreshTokenRequest {
  refreshToken?: string;
}

/**
 * Forgot Password Request Model
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset Password Request Model
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
  email?: string;
}

/**
 * Change Password Request Model
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Validate Token Request Model
 */
export interface ValidateTokenRequest {
  token: string;
}

/**
 * Verify User Request Model
 */
export interface VerifyUserRequest {
  userId: number;
  token?: string;
}
