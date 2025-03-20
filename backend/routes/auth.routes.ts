import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Authentication routes
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-token/:token', authController.validateResetToken);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/logout', authenticate, authController.logout);

export default router;