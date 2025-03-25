/**
 * IAuthService
 * 
 * Interface for authentication service.
 * Defines methods for handling authentication-related operations.
 */
import { 
    LoginDto, 
    AuthResponseDto, 
    RefreshTokenDto, 
    RefreshTokenResponseDto,
    ForgotPasswordDto,
    ResetPasswordDto
  } from '../dtos/AuthDtos.js';
  import { ServiceOptions } from './IBaseService.js';
  
  export interface IAuthService {
    /**
     * Login a user
     * 
     * @param loginDto - Login data
     * @param options - Service options
     * @returns Authentication response with tokens and user data
     */
    login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto>;
    
    /**
     * Refresh access token
     * 
     * @param refreshTokenDto - Refresh token data
     * @param options - Service options
     * @returns Refresh token response with new tokens
     */
    refreshToken(refreshTokenDto: RefreshTokenDto, options?: ServiceOptions): Promise<RefreshTokenResponseDto>;
    
    /**
     * Handle forgot password request
     * 
     * @param forgotPasswordDto - Forgot password data
     * @param options - Service options
     * @returns Success indicator
     */
    forgotPassword(forgotPasswordDto: ForgotPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }>;
    
    /**
     * Validate reset token
     * 
     * @param token - Reset token
     * @returns Whether token is valid
     */
    validateResetToken(token: string): Promise<boolean>;
    
    /**
     * Reset password
     * 
     * @param resetPasswordDto - Reset password data
     * @param options - Service options
     * @returns Success indicator
     */
    resetPassword(resetPasswordDto: ResetPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }>;
    
    /**
     * Logout a user
     * 
     * @param userId - User ID
     * @param refreshToken - Refresh token to invalidate (optional)
     * @param options - Service options
     * @returns Logout result
     */
    logout(userId: number, refreshToken?: string, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }>;
    
    /**
     * Get reset token for testing (development only)
     * 
     * @param email - User email
     * @returns Reset token information
     */
    getResetTokenForTesting(email: string): Promise<any>;
  }