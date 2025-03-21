import { Router } from 'express';
import { login, refreshToken, forgotPassword, validateResetToken, resetPassword, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.get('/reset-token/:token', validateResetToken);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', authenticate, logout);

export default router;