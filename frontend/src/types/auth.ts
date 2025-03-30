/**
 * Authentication related types
 */

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface ResetTokenRequest {
  token: string;
}

export interface ResetTokenResponse {
  valid: boolean;
  userId: number;
  email: string;
}

export interface LogoutRequest {
  refreshToken: string;
}
