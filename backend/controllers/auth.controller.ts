/**
 * Authentication Controller
 * 
 * Handles user authentication operations such as login, logout, and token refresh.
 */
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, CustomRequest } from '../types/controller.types.js';
import { 
  LoginDTO, 
  AuthResponseDTO, 
  RefreshTokenDTO,
  RefreshTokenResponseDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO
} from '../types/dtos/auth.dto.js';
import { 
  generateAuthTokens, 
  comparePassword, 
  verifyRefreshToken,
  isTokenRotationEnabled,
  generateSecureToken,
  hashPassword
} from '../utils/security.utils.js';
import { prisma } from '../utils/prisma.utils.js';
import { asyncHandler } from '../utils/error.utils.js';
import { UnauthorizedError, NotFoundError, ValidationError, ForbiddenError } from '../utils/error.utils.js';
import { logger } from '../utils/common.utils.js';
import { ResponseFactory } from '../utils/http.utils.js';
import crypto from 'crypto';
import config from '../config/index.js';

/**
 * Handle user login
 * @route POST /api/v1/auth/login
 */
export const login = asyncHandler(async (
  req: CustomRequest, 
  res: Response
): Promise<void> => {
  const { email, password, remember = false } = req.validatedData as LoginDTO;
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
      status: true,
      profilePicture: true
    }
  });
  
  // Check if user exists
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Check if user is active
  if (user.status !== 'active') {
    throw new UnauthorizedError('Account is inactive or suspended');
  }
  
  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Generate tokens
  const tokenId = crypto.randomUUID();
  const tokens = generateAuthTokens({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name
  }, tokenId);
  
  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      expires: new Date(Date.now() + tokens.expiresIn * 1000),
      createdByIp: req.ip || 'unknown',
      userId: user.id
    }
  });
  
  // Log successful login
  await prisma.userActivity.create({
    data: {
      userId: user.id,
      activity: 'login',
      ipAddress: req.ip
    }
  });
  
  // Prepare response
  const response: AuthResponseDTO = {
    id: user.id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
  
  // Send response
  ResponseFactory.success(
    res,
    response,
    'Login successful'
  );
});

/**
 * Handle token refresh
 * @route POST /api/v1/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (
  req: CustomRequest, 
  res: Response
): Promise<void> => {
  const { refreshToken: token } = req.validatedData as RefreshTokenDTO;
  
  // Verify refresh token
  const payload = verifyRefreshToken(token);
  
  // Find refresh token in database
  const refreshTokenDoc = await prisma.refreshToken.findFirst({
    where: {
      token,
      revoked: false
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true
        }
      }
    }
  });
  
  // Check if token exists
  if (!refreshTokenDoc) {
    throw new UnauthorizedError('Invalid refresh token');
  }
  
  // Check if token has expired
  if (new Date() > refreshTokenDoc.expires) {
    await prisma.refreshToken.update({
      where: { id: refreshTokenDoc.id },
      data: { revoked: true, revokedAt: new Date(), revokedByIp: req.ip }
    });
    throw new UnauthorizedError('Refresh token expired');
  }
  
  // Check if user is active
  if (refreshTokenDoc.user.status !== 'active') {
    throw new UnauthorizedError('User account is inactive or suspended');
  }
  
  // Generate new tokens
  const newTokenId = crypto.randomUUID();
  const newTokens = generateAuthTokens({
    userId: refreshTokenDoc.user.id,
    role: refreshTokenDoc.user.role,
    email: refreshTokenDoc.user.email,
    name: refreshTokenDoc.user.name
  }, newTokenId);
  
  // Handle token rotation if enabled
  if (isTokenRotationEnabled()) {
    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: refreshTokenDoc.id },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedByIp: req.ip,
        replacedByToken: newTokens.refreshToken
      }
    });
    
    // Create new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newTokens.refreshToken,
        expires: new Date(Date.now() + newTokens.expiresIn * 1000),
        createdByIp: req.ip || 'unknown',
        userId: refreshTokenDoc.user.id
      }
    });
  }
  
  // Prepare response
  const response: RefreshTokenResponseDTO = {
    id: refreshTokenDoc.user.id,
    accessToken: newTokens.accessToken,
    refreshToken: isTokenRotationEnabled() ? newTokens.refreshToken : token,
    expiresIn: newTokens.expiresIn,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Send response
  ResponseFactory.success(
    res,
    response,
    'Token refreshed successfully'
  );
});

/**
 * Handle forgot password request
 * @route POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (
  req: CustomRequest, 
  res: Response
): Promise<void> => {
  const { email } = req.validatedData as ForgotPasswordDTO;
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  // Always return success even if user not found (security)
  if (!user) {
    ResponseFactory.success(
      res,
      { success: true },
      'Password reset instructions sent, if the email exists in our system'
    );
    return;
  }
  
  // Check if user is active
  if (user.status !== 'active') {
    ResponseFactory.success(
      res,
      { success: true },
      'Password reset instructions sent, if the email exists in our system'
    );
    return;
  }
  
  // Generate reset token
  const resetToken = generateSecureToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  // Store reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry
    }
  });
  
  // Log activity
  await prisma.userActivity.create({
    data: {
      userId: user.id,
      activity: 'password_reset_request',
      ipAddress: req.ip
    }
  });
  
  // In a real application, you would send an email with the reset link
  // For now, just log it
  logger.info('Password reset link', {
    userId: user.id,
    email: user.email,
    resetToken,
    resetLink: `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`
  });
  
  // Send response
  const responseData: any = { success: true };
  
  // Only include the reset token in development environment
  if (config.IS_DEVELOPMENT) {
    responseData.resetToken = resetToken;
    responseData.resetLink = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
  }
  
  // Send response
  ResponseFactory.success(
    res,
    responseData,
    'Password reset instructions sent, if the email exists in our system'
  );
});

/**
 * Get reset token for testing (Development only)
 * @route GET /api/v1/auth/dev/reset-token
 */
export const getResetToken = asyncHandler(async (
  req: Request, 
  res: Response
): Promise<void> => {
  // Only allow in development mode
  if (!config.IS_DEVELOPMENT) {
    throw new ForbiddenError('This endpoint is only available in development mode');
  }
  
  const { email } = req.query;
  
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required', ['Email is required']);
  }
  
  // Find user with active reset token
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      resetToken: { not: null },
      resetTokenExpiry: { gt: new Date() }
    },
    select: {
      id: true,
      email: true,
      resetToken: true,
      resetTokenExpiry: true
    }
  });
  
  if (!user || !user.resetToken) {
    throw new NotFoundError('No active reset token found for this email');
  }
  
  // Return reset token info
  ResponseFactory.success(
    res,
    {
      email: user.email,
      resetToken: user.resetToken,
      resetTokenExpiry: user.resetTokenExpiry,
      resetLink: `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${user.resetToken}`
    },
    'Reset token retrieved for testing'
  );
});

/**
 * Validate reset token
 * @route GET /api/v1/auth/reset-token/:token
 */
export const validateResetToken = asyncHandler(async (
  req: CustomRequest, 
  res: Response
): Promise<void> => {
  const { token } = req.params;
  
  // Find user with this token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date()
      }
    }
  });
  
  // Check if token is valid
  if (!user) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }
  
  // Send response
  ResponseFactory.success(
    res,
    { valid: true },
    'Reset token is valid'
  );
});

/**
 * Reset password
 * @route POST /api/v1/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (
  req: CustomRequest, 
  res: Response
): Promise<void> => {
  const { token } = req.params;
  const { password, confirmPassword } = req.validatedData as ResetPasswordDTO;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    throw new ValidationError('Password validation failed', ['Passwords do not match']);
  }
  
  // Find user with this token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: {
        gt: new Date()
      }
    }
  });
  
  // Check if token is valid
  if (!user) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }
  
  // Hash new password
  const hashedPassword = await hashPassword(password);
  
  // Update user password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  });
  
  // Revoke all refresh tokens for this user
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revoked: false },
    data: { revoked: true, revokedAt: new Date(), revokedByIp: req.ip }
  });
  
  // Log activity
  await prisma.userActivity.create({
    data: {
      userId: user.id,
      activity: 'password_reset',
      ipAddress: req.ip
    }
  });
  
  // Send response
  ResponseFactory.success(
    res,
    { success: true },
    'Password has been reset successfully'
  );
});

/**
 * Logout user
 * @route POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (
  req: AuthenticatedRequest, 
  res: Response
): Promise<void> => {
  // Check if user is authenticated
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  // Get refresh token if provided
  const { refreshToken } = req.body;
  
  // Log activity
  await prisma.userActivity.create({
    data: {
      userId: req.user.id,
      activity: 'logout',
      ipAddress: req.ip
    }
  });
  
  // Revoke all tokens
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId: req.user.id,
      revoked: false
    },
    data: { 
      revoked: true, 
      revokedAt: new Date(), 
      revokedByIp: req.ip 
    }
  });
  
  logger.info(`User logged out, revoked ${result.count} refresh tokens`, { 
    userId: req.user.id
  });
  
  // Send response
  ResponseFactory.success(
    res,
    { 
      success: true,
      tokenCount: result.count,
      message: "Alle Sessions wurden beendet. Bitte entfernen Sie alle gespeicherten Tokens im Client."
    },
    'Logout erfolgreich durchgeführt'
  );
});