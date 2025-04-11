import { UserRole } from '../enums/UserEnums';

export interface LoginDto {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  terms?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export interface ResetPasswordDto {
  email: string;
  token?: string;
  password?: string;
  confirmPassword?: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequestDto {
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponseDto {
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    profilePicture?: string;
    createdAt: string;
    updatedAt: string;
  };
  id: number;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  id: number;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface LogoutDto {
  refreshToken: string;
  allDevices?: boolean;
}

export interface TokenPayloadDto {
  sub: number;
  name: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
