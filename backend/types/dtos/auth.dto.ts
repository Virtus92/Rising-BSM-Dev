/**
 * Authentication-related DTOs
 */
export interface LoginDto {
  email: string;
  password: string;
  remember?: boolean;
}

export interface TokenPayloadDto {
  userId: number;
  role: string;
  email?: string;
  name?: string;
}

export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  initials?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  password: string;
  confirmPassword: string;
}
