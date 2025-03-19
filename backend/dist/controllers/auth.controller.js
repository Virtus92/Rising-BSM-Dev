"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.resetPassword = exports.validateResetToken = exports.forgotPassword = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_utils_1 = __importDefault(require("../utils/prisma.utils"));
const validators_1 = require("../utils/validators");
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = __importDefault(require("../config"));
/**
 * Handle user login with JWT authentication
 */
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Validate input
    const { email, password, remember } = req.body;
    if (!email || !password) {
        throw new errors_1.ValidationError('Email and password are required');
    }
    // Find user in database
    const user = await prisma_utils_1.default.user.findUnique({
        where: { email: email.toLowerCase() }
    });
    if (!user) {
        throw new errors_1.UnauthorizedError('Invalid email or password');
    }
    // Verify password
    const passwordMatches = await bcryptjs_1.default.compare(password, user.password);
    if (!passwordMatches) {
        throw new errors_1.UnauthorizedError('Invalid email or password');
    }
    // Check if account is active
    if (user.status !== 'aktiv') {
        throw new errors_1.UnauthorizedError('Account is inactive or suspended');
    }
    // Generate access and refresh tokens
    const tokens = (0, jwt_1.generateAuthTokens)({
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email
    });
    // Log login activity
    await prisma_utils_1.default.userActivity.create({
        data: {
            userId: user.id,
            activity: 'login',
            ipAddress: req.ip || '0.0.0.0'
        }
    });
    // Determine token expiration based on "remember me"
    const rememberMe = remember === 'on' || remember === true;
    const expiresIn = rememberMe
        ? 30 * 24 * 60 * 60 // 30 days in seconds
        : tokens.expiresIn;
    // Store refresh token in database if token rotation is enabled
    if (config_1.default.JWT_REFRESH_TOKEN_ROTATION) {
        await prisma_utils_1.default.refreshToken.create({
            data: {
                userId: user.id,
                token: tokens.refreshToken,
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                createdByIp: req.ip || '0.0.0.0'
            }
        });
    }
    // Prepare user data for response (don't include password)
    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.name.split(' ').map((n) => n[0]).join('')
    };
    // Set user in session for backward compatibility
    if (req.session) {
        req.session.user = userData;
    }
    // Return tokens and user data
    res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn,
        user: userData,
        remember: rememberMe
    });
});
/**
 * Handle forgot password request
 */
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    // Input validation
    if (!email || typeof email !== 'string') {
        throw new errors_1.ValidationError('Please provide a valid email address');
    }
    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase();
    // Check if user exists
    const user = await prisma_utils_1.default.user.findUnique({
        where: { email: sanitizedEmail }
    });
    // For security reasons, always return success even if user not found
    if (!user) {
        res.status(200).json({
            success: true,
            message: 'If an account with this email exists, password reset instructions have been sent'
        });
        return;
    }
    // Generate token
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // Set token expiry to 1 hour
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    // Save token to database
    await prisma_utils_1.default.user.update({
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
});
/**
 * Validate reset token
 */
exports.validateResetToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.params;
    if (!token) {
        throw new errors_1.ValidationError('Invalid token');
    }
    // Hash the token from the URL
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(token)
        .digest('hex');
    // Find user with this token and valid expiry
    const user = await prisma_utils_1.default.user.findFirst({
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
        throw new errors_1.ValidationError('Invalid or expired token');
    }
    res.status(200).json({
        success: true,
        userId: user.id,
        email: user.email
    });
});
/**
 * Reset password
 */
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    // Input validation
    if (!password || !confirmPassword) {
        throw new errors_1.ValidationError('Please enter and confirm your new password');
    }
    if (password !== confirmPassword) {
        throw new errors_1.ValidationError('Passwords do not match');
    }
    // Use the comprehensive password validation function
    const passwordValidation = (0, validators_1.validatePassword)(password);
    if (!passwordValidation.isValid) {
        throw new errors_1.ValidationError(passwordValidation.errors[0]); // Use the first error message
    }
    // Hash the token from the URL
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(token)
        .digest('hex');
    // Find user with this token and valid expiry
    const user = await prisma_utils_1.default.user.findFirst({
        where: {
            resetToken: hashedToken,
            resetTokenExpiry: { gt: new Date() }
        }
    });
    if (!user) {
        throw new errors_1.ValidationError('Invalid or expired token');
    }
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
    // Update user's password and clear reset token
    await prisma_utils_1.default.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
            updatedAt: new Date()
        }
    });
    // Log password reset activity
    await prisma_utils_1.default.userActivity.create({
        data: {
            userId: user.id,
            activity: 'password_reset',
            ipAddress: req.ip || '0.0.0.0'
        }
    });
    res.status(200).json({
        success: true,
        message: 'Password has been reset successfully'
    });
});
/**
 * Refresh access token using refresh token
 */
exports.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new errors_1.ValidationError('Refresh token is required');
    }
    // Verify refresh token
    const tokenPayload = await prisma_utils_1.default.refreshToken.findFirst({
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
        throw new errors_1.UnauthorizedError('Invalid or expired refresh token');
    }
    // Generate new tokens
    const tokens = (0, jwt_1.generateAuthTokens)({
        userId: tokenPayload.user.id,
        role: tokenPayload.user.role,
        name: tokenPayload.user.name,
        email: tokenPayload.user.email
    });
    // Implement refresh token rotation for better security
    if (config_1.default.JWT_REFRESH_TOKEN_ROTATION) {
        // Invalidate the old refresh token
        await prisma_utils_1.default.refreshToken.delete({
            where: { id: tokenPayload.id }
        });
        // Store the new refresh token
        await prisma_utils_1.default.refreshToken.create({
            data: {
                userId: tokenPayload.user.id,
                token: tokens.refreshToken,
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                createdByIp: req.ip || '0.0.0.0'
            }
        });
    }
    // Return new tokens
    res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: config_1.default.JWT_REFRESH_TOKEN_ROTATION ? tokens.refreshToken : refreshToken,
        expiresIn: tokens.expiresIn
    });
});
/**
 * Log out user
 * Invalidates the refresh token to effectively log out
 */
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        // Find and remove the refresh token
        await prisma_utils_1.default.refreshToken.deleteMany({
            where: { token: refreshToken }
        });
    }
    // Log logout activity if user is in request
    if (req.user?.id) {
        await prisma_utils_1.default.userActivity.create({
            data: {
                userId: req.user.id,
                activity: 'logout',
                ipAddress: req.ip || '0.0.0.0'
            }
        });
    }
    // Clear session for backward compatibility
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});
//# sourceMappingURL=auth.controller.js.map