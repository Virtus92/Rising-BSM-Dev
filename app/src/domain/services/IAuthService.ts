import { ServiceOptions } from './IBaseService';
import { 
  LoginDto, 
  AuthResponseDto, 
  RefreshTokenDto, 
  RefreshTokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LogoutDto,
  RegisterDto
} from '../dtos/AuthDtos';

/**
 * Service Interface for Authentication
 */
export interface IAuthService {
  /**
   * Registers a new user
   * 
   * @param registerDto - Registration data
   * @param options - Service options
   * @returns Registration result
   */
  register(registerDto: RegisterDto, options?: ServiceOptions): Promise<{ success: boolean; message?: string; data?: any }>;
  
  /**
   * Handles user login
   * 
   * @param loginDto - Login data
   * @param options - Service options
   * @returns Authentication response
   */
  login(loginDto: LoginDto, options?: ServiceOptions): Promise<AuthResponseDto>;
  
  /**
   * Refreshes an access token
   * 
   * @param refreshTokenDto - Token refresh data
   * @param options - Service options
   * @returns Token refresh response
   */
  refreshToken(refreshTokenDto: RefreshTokenDto, options?: ServiceOptions): Promise<RefreshTokenResponseDto>;
  
  /**
   * Processes a "Forgot Password" request
   * 
   * @param forgotPasswordDto - Forgot password data
   * @param options - Service options
   * @returns Success of the operation
   */
  forgotPassword(forgotPasswordDto: ForgotPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }>;
  
  /**
   * Validates a token for password reset
   * 
   * @param token - Token
   * @param options - Service options
   * @returns Validity of the token
   */
  validateResetToken(token: string, options?: ServiceOptions): Promise<boolean>;
  
  /**
   * Resets a password
   * 
   * @param resetPasswordDto - Password reset data
   * @param options - Service options
   * @returns Success of the operation
   */
  resetPassword(resetPasswordDto: ResetPasswordDto, options?: ServiceOptions): Promise<{ success: boolean }>;
  
  /**
   * Logs out a user
   * 
   * @param userId - User ID
   * @param logoutDto - Logout data
   * @param options - Service options
   * @returns Logout result
   */
  logout(userId: number, logoutDto?: LogoutDto, options?: ServiceOptions): Promise<{ success: boolean; tokenCount: number }>;
  
  /**
   * Verifies an authentication token
   * 
   * @param token - Access token
   * @param options - Service options
   * @returns Authentication status with user ID if valid
   */
  verifyToken(token: string, options?: ServiceOptions): Promise<{ valid: boolean; userId?: number; role?: string }>;
  
  /**
   * Checks if a user has the specified role
   * 
   * @param userId - User ID
   * @param role - Role to check
   * @param options - Service options
   * @returns Whether the user has the role
   */
  hasRole(userId: number, role: string, options?: ServiceOptions): Promise<boolean>;
}