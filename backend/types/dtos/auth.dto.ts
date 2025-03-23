/**
 * Auth DTOs
 * 
 * Data Transfer Objects for Authentication operations.
 */
import { BaseDTO, BaseResponseDTO } from './base.dto.js';
import { UserResponseDTO } from './user.dto.js';

/**
 * DTO for user login request
 */
export interface LoginDTO extends BaseDTO {
  /**
   * User email
   */
  email: string;

  /**
   * User password
   */
  password: string;

  /**
   * Remember me option
   */
  remember?: boolean | string;
}

/**
 * DTO for token payload
 */
export interface TokenPayloadDTO {
  /**
   * User ID
   */
  userId: number;

  /**
   * User role
   */
  role: string;

  /**
   * User email
   */
  email?: string;

  /**
   * User name
   */
  name?: string;
}

/**
 * DTO for authentication response
 */
export interface AuthResponseDTO extends BaseResponseDTO {
  /**
   * Access token
   */
  accessToken: string;

  /**
   * Refresh token
   */
  refreshToken: string;

  /**
   * Token expiration in seconds
   */
  expiresIn: number;

  /**
   * User data
   */
  user: UserResponseDTO;

  /**
   * Remember me flag
   */
  remember?: boolean;
}

/**
 * DTO for token refresh request
 */
export interface RefreshTokenDTO extends BaseDTO {
  /**
   * Refresh token
   */
  refreshToken: string;
}

/**
 * DTO for token refresh response
 */
export interface RefreshTokenResponseDTO extends BaseResponseDTO {
  /**
   * New access token
   */
  accessToken: string;

  /**
   * New refresh token (if rotation is enabled)
   */
  refreshToken: string;

  /**
   * Token expiration in seconds
   */
  expiresIn: number;
}

/**
 * DTO for logout request
 */
export interface LogoutDTO extends BaseDTO {
  /**
   * Refresh token to invalidate
   */
  refreshToken?: string;
}

/**
 * DTO for forgot password request
 */
export interface ForgotPasswordDTO extends BaseDTO {
  /**
   * User email
   */
  email: string;
}

/**
 * DTO for reset token validation
 */
export interface ValidateResetTokenDTO extends BaseDTO {
  /**
   * Reset token
   */
  token: string;
}

/**
 * DTO for reset token validation response
 */
export interface ValidateResetTokenResponseDTO extends BaseResponseDTO {
  /**
   * User ID
   */
  userId: number;

  /**
   * User email
   */
  email: string;
}

/**
 * DTO for password reset request
 */
export interface ResetPasswordDTO extends BaseDTO {
  /**
   * New password
   */
  password: string;

  /**
   * Confirm new password
   */
  confirmPassword: string;
}

/**
 * Validation schema for login request
 */
export const loginSchema = {
  email: {
    type: 'email',
    required: true,
    messages: {
      required: 'Email is required',
      email: 'Invalid email format'
    }
  },
  password: {
    type: 'string',
    required: true,
    messages: {
      required: 'Password is required'
    }
  },
  remember: {
    type: 'boolean',
    required: false
  }
};

/**
 * Validation schema for token refresh
 */
export const refreshTokenSchema = {
  refreshToken: {
    type: 'string',
    required: true,
    messages: {
      required: 'Refresh token is required'
    }
  }
};

/**
 * Validation schema for forgot password
 */
export const forgotPasswordSchema = {
  email: {
    type: 'email',
    required: true,
    messages: {
      required: 'Email is required',
      email: 'Invalid email format'
    }
  }
};

/**
 * Validation schema for reset password
 */
export const resetPasswordSchema = {
  password: {
    type: 'password',
    required: true,
    min: 8,
    messages: {
      required: 'Password is required',
      min: 'Password must be at least 8 characters long'
    }
  },
  confirmPassword: {
    type: 'string',
    required: true,
    messages: {
      required: 'Confirm password is required'
    },
    validate: (value: string, data: any) => {
      return value === data.password ? true : 'Passwords do not match';
    }
  }
};

/**
 * Get error message for authentication errors
 * @param errorCode Error code
 * @returns Human-readable error message
 */
export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'invalid_credentials':
      return 'Invalid email or password';
    case 'account_inactive':
      return 'Account is inactive or suspended';
    case 'invalid_token':
      return 'Invalid authentication token';
    case 'expired_token':
      return 'Authentication token has expired';
    case 'invalid_refresh_token':
      return 'Invalid refresh token';
    case 'expired_refresh_token':
      return 'Refresh token has expired';
    case 'reset_token_invalid':
      return 'Password reset token is invalid';
    case 'reset_token_expired':
      return 'Password reset token has expired';
    default:
      return 'Authentication error';
  }
}