import { Router } from 'express';
import { isNotAuthenticated } from '../middleware/auth.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

/**
 * @route   GET /login
 * @desc    Render login page
 */
router.get('/login', isNotAuthenticated, (req, res) => {
  res.render('login', {
    title: 'Login - Rising BSM',
    error: req.flash('error')[0] || null,
    success: req.flash('success')[0] || null,
    csrfToken: req.csrfToken()
  });
});

/**
 * @route   POST /login
 * @desc    Process login
 */
router.post('/login', isNotAuthenticated, authController.login);

/**
 * @route   GET /logout
 * @desc    Process logout
 */
router.get('/logout', authController.logout);

/**
 * @route   GET /forgot-password
 * @desc    Render forgot password page
 */
router.get('/forgot-password', isNotAuthenticated, (req, res) => {
  res.render('forgot-password', {
    title: 'Passwort vergessen - Rising BSM',
    error: req.flash('error')[0] || null,
    success: req.flash('success')[0] || null,
    csrfToken: req.csrfToken()
  });
});

/**
 * @route   POST /forgot-password
 * @desc    Process forgot password request
 */
router.post('/forgot-password', isNotAuthenticated, authController.forgotPassword);

/**
 * @route   GET /reset-password/:token
 * @desc    Render reset password page
 */
router.get('/reset-password/:token', isNotAuthenticated, authController.validateResetToken);

/**
 * @route   POST /reset-password/:token
 * @desc    Process reset password
 */
router.post('/reset-password/:token', isNotAuthenticated, authController.resetPassword);

/**
 * @route   POST /refresh-token
 * @desc    Refresh access token
 */
router.post('/refresh-token', authController.refreshToken);

export default router;