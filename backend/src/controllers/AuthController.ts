/**
 * AuthController
 * 
 * Handles authentication-related HTTP requests.
 * Implements the IAuthController interface.
 */
import { Request, Response } from 'express';
import { IAuthController } from '../interfaces/IAuthController.js';
import { IAuthService } from '../interfaces/IAuthService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  LoginDto, 
  RefreshTokenDto, 
  ForgotPasswordDto, 
  ResetPasswordDto 
} from '../dtos/AuthDtos.js';
import { AuthenticatedRequest } from '../types/RequestTypes.js';

export class AuthController implements IAuthController {
  /**
   * Creates a new AuthController instance
   * 
   * @param authService - Authentication service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly authService: IAuthService,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized AuthController');
  }

  /**
   * Handle user login
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData = req.body as LoginDto;
      
      // Authenticate user
      const result = await this.authService.login(loginData, { ipAddress: req.ip });
      
      // Send response
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Handle token refresh
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshTokenData = req.body as RefreshTokenDto;
      
      // Refresh token
      const result = await this.authService.refreshToken(refreshTokenData, { ipAddress: req.ip });
      
      // Send response
      res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Handle forgot password request
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const forgotPasswordData = req.body as ForgotPasswordDto;
      
      // Process forgot password request
      const result = await this.authService.forgotPassword(forgotPasswordData, {
        ipAddress: req.ip,
        origin: req.headers.origin || `${req.protocol}://${req.get('host')}`
      });
      
      // Send response
      res.status(200).json({
        success: true,
        data: result,
        message: 'If the email exists in our system, password reset instructions have been sent'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Validate reset token
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async validateResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      
      // Validate token
      const isValid = await this.authService.validateResetToken(token);
      
      // Send response
      res.status(200).json({
        success: true,
        data: { valid: isValid },
        message: isValid ? 'Token is valid' : 'Token is invalid or has expired'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Reset password
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const resetPasswordData = req.body as ResetPasswordDto;
      
      // Reset password
      const result = await this.authService.resetPassword({
        token,
        ...resetPasswordData
      }, { ipAddress: req.ip });
      
      // Send response
      res.status(200).json({
        success: true,
        data: result,
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Handle user logout
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw this.errorHandler.createUnauthorizedError('Authentication required');
      }
      
      // Get refresh token from body
      const { refreshToken } = req.body;
      
      // Logout user
      const result = await this.authService.logout(authReq.user.id, refreshToken, { ipAddress: req.ip });
      
      // Send response
      res.status(200).json({
        success: true,
        data: result,
        message: 'Logout successful'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }

  /**
   * Get reset token for testing (development only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getResetToken(req: Request, res: Response): Promise<void> {
    try {
      // Check if we're in development mode
      if (process.env.NODE_ENV !== 'development') {
        throw this.errorHandler.createForbiddenError('This endpoint is only available in development mode');
      }
      
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        throw this.errorHandler.createValidationError('Validation failed', ['Email is required']);
      }
      
      // Get reset token for testing
      const result = await this.authService.getResetTokenForTesting(email);
      
      // Send response
      res.status(200).json({
        success: true,
        data: result,
        message: 'Reset token retrieved for testing'
      });
    } catch (error) {
      this.errorHandler.handleError(error, req, res);
    }
  }
}