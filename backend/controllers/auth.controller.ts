import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../utils/prisma.utils';
import { validateInput, validatePassword } from '../utils/validators';
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';
import { generateAuthTokens } from '../utils/jwt';
import config from '../config';

interface LoginData {
  email: string;
  password: string;
  remember?: boolean | string;
}

interface PasswordResetData {
  password: string;
  confirmPassword: string;
}

/**
 * Handle user login with JWT authentication
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input
    const { isValid, validatedData } = validateInput<LoginData>(
      req.body, 
      {
        email: { type: 'email', required: true },
        password: { type: 'text', required: true },
        remember: { type: 'text', required: false }
      }
    );

    if (!isValid) {
      throw new ValidationError('Email and password are required');
    }

    const { email, password, remember } = validatedData;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const passwordMatches = await bcrypt.compare(password, user.password);
    
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is active
    if (user.status !== 'aktiv') {
      throw new UnauthorizedError('Account is inactive or suspended');
    }

    // Generate access and refresh tokens
    const tokens = generateAuthTokens({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email
    });

    // Log login activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activity: 'login',
        ipAddress: req.ip
      }
    });

    // Determine token expiration based on "remember me"
    const rememberMe = remember === 'on' || remember === true;
    const expiresIn = rememberMe 
      ? 30 * 24 * 60 * 60 // 30 days in seconds
      : tokens.expiresIn;

    // Prepare user data for response (don't include password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      initials: user.name.split(' ').map(n => n[0]).join('')
    };

    // Return tokens and user data
    res.status(200).json({ 
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn,
      user: userData,
      remember: rememberMe
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle forgot password request
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email || typeof email !== 'string') {
      throw new ValidationError('Please provide a valid email address');
    }

    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    // For security reasons, always return success even if user not found
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, password reset instructions have been sent'
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiry to 1 hour
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiry,
        updatedAt: new Date()
      }
    });

    // Return token and user email for the email service to handle
    res.status(200).json({
      success: true,
      userId: user.id,
      email: user.email,
      token: resetToken,
      message: 'If an account with this email exists, password reset instructions have been sent'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate reset token
 */
export const validateResetToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    
    if (!token) {
      throw new ValidationError('Invalid token');
    }

    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and valid expiry
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }
      },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired token');
    }

    res.status(200).json({
      success: true,
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body as PasswordResetData;
    
    // Input validation
    if (!password || !confirmPassword) {
      throw new ValidationError('Please enter and confirm your new password');
    }
    
    if (password !== confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }

    // Use the comprehensive password validation function
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors[0]); // Use the first error message
    }

    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and valid expiry
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired token');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    });

    // Log password reset activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        activity: 'password_reset',
        ipAddress: req.ip
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }
    
    // Verify refresh token
    const tokenPayload = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        expires: { gt: new Date() }
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
    
    if (!tokenPayload || !tokenPayload.user || tokenPayload.user.status !== 'aktiv') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    
    // Generate new tokens
    const tokens = generateAuthTokens({
      userId: tokenPayload.user.id,
      role: tokenPayload.user.role,
      name: tokenPayload.user.name,
      email: tokenPayload.user.email
    });
    
    // Optionally, implement refresh token rotation for better security
    if (config.JWT_REFRESH_TOKEN_ROTATION) {
      // Invalidate the old refresh token
      await prisma.refreshToken.delete({
        where: { id: tokenPayload.id }
      });
      
      // Store the new refresh token
      await prisma.refreshToken.create({
        data: {
          userId: tokenPayload.user.id,
          token: tokens.refreshToken,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdByIp: req.ip
        }
      });
    }
    
    // Return new tokens
    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: config.JWT_REFRESH_TOKEN_ROTATION ? tokens.refreshToken : refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user
 * Invalidates the refresh token to effectively log out
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Find and remove the refresh token
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }
    
    // Log logout activity if user is in request
    if (req.user?.id) {
      await prisma.userActivity.create({
        data: {
          userId: req.user.id,
          activity: 'logout',
          ipAddress: req.ip
        }
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};