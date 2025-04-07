import { SecureOperationOptions } from '@/types/core/auth';
import { ErrorDetails } from '@/types/core/shared';
import { 
  LoginCredentials, 
  TokenResponse, 
  PasswordResetRequest, 
  AuthStatus 
} from '@/types/core/auth';

/**
 * Authentication Service Interface
 * Defines contract for authentication-related operations
 */
export interface IAuthService {
  /**
   * Authenticate user and generate tokens
   * 
   * @param credentials - User login credentials
   * @param options - Secure operation options
   * @returns Token response with authentication details
   * @throws {ErrorDetails} Authentication error
   */
  login(
    credentials: LoginCredentials, 
    options?: SecureOperationOptions
  ): Promise<TokenResponse>;
  
  /**
   * Refresh authentication tokens
   * 
   * @param refreshToken - Current refresh token
   * @param options - Secure operation options
   * @returns New token response
   * @throws {ErrorDetails} Token refresh error
   */
  refreshToken(
    refreshToken: string, 
    options?: SecureOperationOptions
  ): Promise<TokenResponse>;
  
  /**
   * Initiate password reset process
   * 
   * @param email - User email
   * @param options - Secure operation options
   * @returns Success status
   * @throws {ErrorDetails} Password reset initiation error
   */
  initiatePasswordReset(
    email: string, 
    options?: SecureOperationOptions
  ): Promise<{ success: boolean }>;
  
  /**
   * Validate password reset token
   * 
   * @param token - Reset token
   * @returns Token validation status
   */
  validateResetToken(token: string): Promise<{ valid: boolean }>;
  
  /**
   * Complete password reset
   * 
   * @param resetRequest - Password reset details
   * @param options - Secure operation options
   * @returns Success status
   * @throws {ErrorDetails} Password reset error
   */
  resetPassword(
    resetRequest: PasswordResetRequest, 
    options?: SecureOperationOptions
  ): Promise<{ success: boolean }>;
  
  /**
   * Logout user and invalidate tokens
   * 
   * @param userId - User ID
   * @param refreshToken - Refresh token to invalidate
   * @param options - Secure operation options
   * @returns Logout result
   * @throws {ErrorDetails} Logout error
   */
  logout(
    userId: number, 
    refreshToken?: string, 
    options?: SecureOperationOptions
  ): Promise<{ 
    success: boolean; 
    tokenCount: number 
  }>;
  
  /**
   * Get current authentication status
   * 
   * @param token - Access token
   * @returns Authentication status
   */
  getAuthStatus(token?: string): Promise<AuthStatus>;
  
  /**
   * Development/Testing: Get reset token
   * 
   * @param email - User email
   * @returns Reset token details
   */
  getResetTokenForTesting(email: string): Promise<{ token: string }>;
}
