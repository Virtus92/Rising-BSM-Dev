import { Request, Response } from 'express';
import { ValidationError, BadRequestError } from '../../backup/utils_bak/errors.js';
import { asyncHandler } from '../../backup/utils_bak/asyncHandler.js';
import { ResponseFactory } from '../../backup/utils_bak/response.factory.js';
import { AuthService, authService } from '../services/auth.service.js';
import {
  LoginDTO,
  ForgotPasswordDTO,
  ValidateResetTokenDTO,
  ResetPasswordDTO,
  RefreshTokenDTO,
  LogoutDTO
} from '../types/dtos/auth.dto.js';
import { AuthenticatedRequest } from '../types/common/types.js';

/**
 * Authentication Controller
 * Handles user authentication and related operations
 */
export class AuthController {
  constructor(private readonly authService: AuthService = authService) {}

  /**
   * Handle user login
   * @route POST /api/v1/auth/login
   * @access Public
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate input
    const loginData: LoginDTO = req.body;

    // Validate required fields
    if (!loginData.email || !loginData.password) {
      throw new ValidationError('Email and password are required');
    }

    // Authenticate user through service
    const result = await this.authService.authenticate(loginData, {
      ipAddress: req.ip || '0.0.0.0'
    });

    // Send success response
    ResponseFactory.success(
      res,
      result,
      'Login successful',
      200
    );
  });

  /**
   * Handle forgot password request
   * @route POST /api/v1/auth/forgot-password
   * @access Public
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const forgotPasswordData: ForgotPasswordDTO = req.body;

    // Process password reset request through service
    const result = await this.authService.requestPasswordReset(forgotPasswordData.email);

    // For security reasons, always return success even if user not found
    ResponseFactory.success(
      res,
      result || { message: 'If an account with this email exists, password reset instructions have been sent' },
      'If an account with this email exists, password reset instructions have been sent'
    );
  });

  /**
   * Validate reset token
   * @route GET /api/v1/auth/reset-token/:token
   * @access Public
   */
  validateResetToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.params.token;
    
    if (!token) {
      throw new ValidationError('Invalid token');
    }

    // Validate token through service
    const result = await this.authService.validateResetToken(token);

    if (!result) {
      throw new ValidationError('Invalid or expired token');
    }

    ResponseFactory.success(res, result);
  });

  /**
   * Reset password
   * @route POST /api/v1/auth/reset-password/:token
   * @access Public
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    const resetData: ResetPasswordDTO = req.body;
    
    // Process password reset through service
    const result = await this.authService.resetPassword(
      token, 
      resetData.password, 
      resetData.confirmPassword
    );

    ResponseFactory.success(res, result, 'Password has been reset successfully');
  });

  /**
   * Refresh access token using refresh token
   * @route POST /api/v1/auth/refresh-token
   * @access Private
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshData: RefreshTokenDTO = req.body;
    
    if (!refreshData.refreshToken) {
      throw new ValidationError('Refresh token is required');
    }
    
    // Refresh token through service
    const result = await this.authService.refreshToken(refreshData.refreshToken, {
      ipAddress: req.ip || '0.0.0.0'
    });

    ResponseFactory.success(res, result);
  });

  /**
   * Log out user
   * @route POST /api/v1/auth/logout
   * @access Private
   */
  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // We can safely use AuthenticatedRequest here as logout requires authentication
    const logoutData: LogoutDTO = req.body;
    
    // Process logout through service
    await this.authService.logout(logoutData.refreshToken || '', {
      userContext: req.user ? {
        userId: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        ipAddress: req.ip
      } : undefined
    });
    
    ResponseFactory.success(res, {}, 'Logged out successfully');
  });
}

// Create and export controller instance
export const authController = new AuthController();

// Export individual methods for route binding
export const {
  login,
  forgotPassword,
  validateResetToken,
  resetPassword,
  refreshToken,
  logout
} = authController;

export default authController;