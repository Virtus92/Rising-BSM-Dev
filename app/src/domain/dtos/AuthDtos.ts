/**
 * Authentication DTOs
 */
import { UserDto } from './UserDtos';

export interface LoginDto {
  email: string;
  password: string;
  remember?: boolean;
  ipAddress?: string;
  userAgent?: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  terms?: boolean;
  phone?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  confirmPassword: string;
  email?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface LoginResponseDto {
  success: boolean;
  data?: {
    user: UserDto;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  message?: string;
}

export interface TokenResponseDto {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    expiresIn: number;
    user?: UserDto;
  };
  message?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
  ipAddress?: string;
}

export interface TokenPayloadDto {
  sub: string | number;
  email?: string;
  name?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface LoginCredentialsDto {
  email: string;
  password: string;
  remember?: boolean;
  ipAddress?: string;
  userAgent?: string;
  rememberMe?: boolean;
}

// AuthResponseDto with all required properties
export interface AuthResponseDto {
  success: boolean;
  data?: {
    user: UserDto;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  message?: string;
  // Additional properties used by login route
  accessExpiration?: number;
  refreshExpiration?: number;
  user?: UserDto; // Direct user property for backward compatibility
  accessToken?: string; // Direct accessToken property for backward compatibility
  refreshToken?: string; // Direct refreshToken property for backward compatibility
}

// RefreshTokenResponseDto with all required properties
export interface RefreshTokenResponseDto {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    expiresIn: number;
    user?: UserDto;
  };
  message?: string;
  // Additional properties used by routes
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LogoutDto {
  userId?: number;
  refreshToken?: string;
  logoutAll?: boolean;
  allDevices?: boolean; // Alternative name used in routes
}

// Add missing DTO alias
export type ChangePasswordRequestDto = ChangePasswordDto;
