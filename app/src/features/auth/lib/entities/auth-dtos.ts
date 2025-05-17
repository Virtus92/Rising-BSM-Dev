/**
 * Auth Module DTOs
 * 
 * Feature-specific data transfer objects that extend core domain DTOs
 */

// Import DTOs from domain
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  TokenPayloadDto,
  LogoutDto,
  ChangePasswordDto
} from '@/domain/dtos/AuthDtos';
import { UserRole } from '@/domain/enums/UserEnums';

/**
 * Extended login DTO with additional client information
 */
export interface EnhancedLoginDto extends LoginDto {
  deviceIdentifier?: string;
  clientVersion?: string;
  loginSource?: 'web' | 'mobile' | 'desktop' | 'api';
}

/**
 * Enhanced auth response with additional security information
 */
export interface EnhancedAuthResponseDto extends AuthResponseDto {
  lastLogin?: string;
  requiresMfa?: boolean;
  passwordChangeRequired?: boolean;
  permissionGroups?: string[];
}

/**
 * Auth context providing information about the authentication request
 */
export interface AuthContextDto {
  ipAddress?: string;
  userAgent?: string;
  deviceIdentifier?: string;
  requestId?: string;
}

/**
 * Re-export domain DTOs for convenience
 */
export type {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  TokenPayloadDto,
  LogoutDto,
  ChangePasswordDto
};

// Create alias to avoid ambiguity
export type ChangePasswordRequestDto = ChangePasswordDto;

/**
 * Re-export relevant enums
 */
export { UserRole };
