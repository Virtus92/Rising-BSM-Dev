/**
 * Token Manager Interface
 * Defines the contract for token management
 */
import { TokenPayloadDto } from '@/domain/dtos/AuthDtos';

/**
 * User information from token
 */
export interface TokenUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: any;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  expired?: boolean;
  reason?: string;
  payload?: TokenPayloadDto;
}

/**
 * Token status information
 */
export interface TokenStatus {
  hasAuthToken: boolean;
  hasRefreshToken: boolean;
  authExpiration: string | null;
}

/**
 * Interface for token management
 * Both client and server implementations must adhere to this interface
 */
export interface ITokenManager {
  /**
   * Get the current access token
   * @returns Access token or null if not available
   */
  getToken(): Promise<string | null>;
  
  /**
   * Validate a token
   * @param token Token to validate (optional, uses current token if not provided)
   * @returns Token validation result
   */
  validateToken(token?: string): Promise<TokenValidationResult>;
  
  /**
   * Refresh the access token using the refresh token
   * @returns Token refresh result
   */
  refreshToken(): Promise<TokenRefreshResult>;
  
  /**
   * Clear all tokens
   */
  clearTokens(): Promise<void>;
  
  /**
   * Extract user information from a token
   * @param token Token to extract from
   * @returns User information or null
   */
  getUserFromToken(token: string): TokenUser | null;
  
  /**
   * Get current token status
   * @returns Token status information
   */
  getTokenStatus(): Promise<TokenStatus>;
  
  /**
   * Notify about authentication state changes
   * @param isAuthenticated Whether user is authenticated
   */
  notifyAuthChange(isAuthenticated: boolean): Promise<void>;
  
  /**
   * Notify about user logout
   */
  notifyLogout(): Promise<void>;
}
