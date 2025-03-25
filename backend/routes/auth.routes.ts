/**
 * Authentication Routes
 * 
 * Route definitions for authentication operations with validation.
 */
import { Router } from 'express';
import { 
  login, 
  refreshToken, 
  forgotPassword, 
  validateResetToken, 
  resetPassword, 
  logout,
  getResetToken 
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { 
  loginValidation, 
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  logoutValidation
} from '../types/dtos/auth.dto.js';
import config from '../config/index.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication operations
 */

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Refresh access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenDTO'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponseDTO'
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', validateBody(refreshTokenValidation), refreshToken);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset link to user's email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordDTO'
 *     responses:
 *       200:
 *         description: Password reset instructions sent
 */
router.post('/forgot-password', validateBody(forgotPasswordValidation), forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-token/{token}:
 *   get:
 *     summary: Validate reset token
 *     description: Check if password reset token is valid
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid or expired token
 */
router.get('/reset-token/:token', validateResetToken);

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     description: Reset user password using reset token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordDTO'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       401:
 *         description: Invalid or expired token
 */
router.post('/reset-password/:token', validateBody(resetPasswordValidation), resetPassword);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Log user out and optionally invalidate refresh token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional refresh token to invalidate
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', authenticate, validateBody(logoutValidation), logout);

// Development mode only routes
if (config.IS_DEVELOPMENT) {
  /**
   * @swagger
   * /api/v1/auth/dev/reset-token:
   *   get:
   *     summary: Get reset token for testing
   *     description: Retrieve a reset token for testing (development only)
   *     tags: [Authentication, Development]
   *     parameters:
   *       - in: query
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *     responses:
   *       200:
   *         description: Reset token retrieved
   *       404:
   *         description: No active token found
   */
  router.get('/dev/reset-token', validateQuery({
    email: {
      type: 'email' as const,
      required: true,
      messages: {
        required: 'Email is required',
        email: 'Invalid email format'
      }
    }
  }), getResetToken);
}

export default router;