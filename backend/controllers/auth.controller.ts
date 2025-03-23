import { Request, Response } from 'express';
import { ValidationError, BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { AuthenticatedRequest } from '../types/authenticated-request.js';
import { UserService, userService } from '../services/user.service.js';
import {
  LoginDTO,
  ForgotPasswordDTO,
  ValidateResetTokenDTO,
  ResetPasswordDTO,
  RefreshTokenDTO,
  LogoutDTO
} from '../types/dtos/auth.dto.js';

/**
 * Handle user login with JWT authentication
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate input
  const loginData: LoginDTO = req.body;

  if (!loginData.email || !loginData.password) {
    throw new ValidationError('Email and password are required');
  }

  // Authenticate user through service
  const result = await userService.authenticate(loginData, {
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
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const forgotPasswordData: ForgotPasswordDTO = req.body;

  // Process password reset request through service
  const result = await userService.requestPasswordReset(forgotPasswordData.email);

  // For security reasons, always return success even if user not found
  ResponseFactory.success(
    res,
    result || { message: 'If an account with this email exists, password reset instructions have been sent' },
    'If an account with this email exists, password reset instructions have been sent'
  );
});

/**
 * Validate reset token
 */
export const validateResetToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params as ValidateResetTokenDTO;
  
  if (!token) {
    throw new ValidationError('Invalid token');
  }

  // Validate token through service
  const result = await userService.validateResetToken(token);

  if (!result) {
    throw new ValidationError('Invalid or expired token');
  }

  ResponseFactory.success(res, result);
});

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const resetData: ResetPasswordDTO = req.body;
  
  // Process password reset through service
  const result = await userService.resetPassword(token, resetData.password, resetData.confirmPassword);

  ResponseFactory.success(res, result, 'Password has been reset successfully');
});

/**
 * Refresh access token using refresh token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refreshData: RefreshTokenDTO = req.body;
  
  if (!refreshData.refreshToken) {
    throw new ValidationError('Refresh token is required');
  }
  
  // Refresh token through service
  const result = await userService.refreshToken(refreshData.refreshToken, {
    ipAddress: req.ip || '0.0.0.0'
  });

  ResponseFactory.success(res, result);
});

/**
 * Log out user
 * Invalidates the refresh token to effectively log out
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const logoutData: LogoutDTO = req.body;
  
  // Process logout through service
  await userService.logout(logoutData.refreshToken, {
    userContext: req.user ? {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    } : undefined
  });
  
  ResponseFactory.success(res, {}, 'Logged out successfully');
});