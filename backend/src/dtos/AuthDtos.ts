import { UserRole } from '../entities/User.js';
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
      roles: number[];
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
    token?: string;
    
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
  
  /**
   * Validation schema for login
   */
  export const loginValidationSchema = {
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
      required: false,
      default: false
    }
  };
  
  /**
   * Validation schema for token refresh
   */
  export const refreshTokenValidationSchema = {
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
  export const forgotPasswordValidationSchema = {
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
  export const resetPasswordValidationSchema = {
    password: {
      type: 'string',
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
   * Validation schema for logout
   */
  export const logoutValidationSchema = {
    refreshToken: {
      type: 'string',
      required: false,
      messages: {
        type: 'Refresh token must be a string'
      }
    }
  };