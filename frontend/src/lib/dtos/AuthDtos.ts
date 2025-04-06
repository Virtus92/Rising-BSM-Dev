/**
 * Auth DTOs
 * 
 * Data Transfer Objects for authentication operations.
 */

/**
 * DTO for user login
 */
export interface LoginDto {
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
  remember?: boolean;
}

/**
 * DTO for token payload
 */
export interface TokenPayloadDto {
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
  
  /**
   * Token ID
   */
  tokenId?: string;
}

/**
 * DTO for authentication response
 */
export interface AuthResponseDto {
  /**
   * User ID
   */
  id: number;
  
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
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * Last update timestamp
   */
  updatedAt: string;
  
  /**
   * User data
   */
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    profilePicture?: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * DTO for token refresh
 */
export interface RefreshTokenDto {
  /**
   * Refresh token
   */
  refreshToken: string;
}

/**
 * DTO for token refresh response
 */
export interface RefreshTokenResponseDto {
  /**
   * User ID
   */
  id: number;
  
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
  
  /**
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * Last update timestamp
   */
  updatedAt: string;
}

/**
 * DTO for forgot password
 */
export interface ForgotPasswordDto {
  /**
   * User email
   */
  email: string;
}

/**
 * DTO for reset password
 */
export interface ResetPasswordDto {
  /**
   * Reset token
   */
  token: string;
  
  /**
   * New password
   */
  password: string;
  
  /**
   * Confirm password
   */
  confirmPassword: string;
}

/**
 * DTO for logout
 */
export interface LogoutDto {
  /**
   * Refresh token
   */
  refreshToken?: string;
}
