"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.resetPassword = exports.validateResetToken = exports.forgotPassword = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_utils_1 = require("../utils/prisma.utils");
const validators_1 = require("../utils/validators");
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = __importDefault(require("../config"));
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password, remember } = req.body;
    if (!email || !password) {
        throw new errors_1.ValidationError('Email and password are required');
    }
    const user = await prisma_utils_1.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });
    if (!user) {
        throw new errors_1.UnauthorizedError('Invalid email or password');
    }
    const passwordMatches = await bcryptjs_1.default.compare(password, user.password);
    if (!passwordMatches) {
        throw new errors_1.UnauthorizedError('Invalid email or password');
    }
    if (user.status !== 'aktiv') {
        throw new errors_1.UnauthorizedError('Account is inactive or suspended');
    }
    const tokens = (0, jwt_1.generateAuthTokens)({
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email
    });
    await prisma_utils_1.prisma.userActivity.create({
        data: {
            userId: user.id,
            activity: 'login',
            ipAddress: req.ip || '0.0.0.0'
        }
    });
    const rememberMe = remember === 'on' || remember === true;
    const expiresIn = rememberMe
        ? 30 * 24 * 60 * 60
        : tokens.expiresIn;
    if (config_1.default.JWT_REFRESH_TOKEN_ROTATION) {
        await prisma_utils_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: tokens.refreshToken,
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdByIp: req.ip || '0.0.0.0'
            }
        });
    }
    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.name.split(' ').map((n) => n[0]).join('')
    };
    if (req.session) {
        req.session.user = userData;
    }
    res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn,
        user: userData,
        remember: rememberMe
    });
});
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        throw new errors_1.ValidationError('Please provide a valid email address');
    }
    const sanitizedEmail = email.trim().toLowerCase();
    const user = await prisma_utils_1.prisma.user.findUnique({
        where: { email: sanitizedEmail }
    });
    if (!user) {
        res.status(200).json({
            success: true,
            message: 'If an account with this email exists, password reset instructions have been sent'
        });
        return;
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    await prisma_utils_1.prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: hashedToken,
            resetTokenExpiry: expiry,
            updatedAt: new Date()
        }
    });
    res.status(200).json({
        success: true,
        userId: user.id,
        email: user.email,
        token: resetToken,
        message: 'If an account with this email exists, password reset instructions have been sent'
    });
});
exports.validateResetToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.params;
    if (!token) {
        throw new errors_1.ValidationError('Invalid token');
    }
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(token)
        .digest('hex');
    const user = await prisma_utils_1.prisma.user.findFirst({
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
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
        throw new errors_1.ValidationError('Please enter and confirm your new password');
    }
    if (password !== confirmPassword) {
        throw new errors_1.ValidationError('Passwords do not match');
    }
    const passwordValidation = (0, validators_1.validatePassword)(password);
    if (!passwordValidation.isValid) {
        throw new errors_1.ValidationError(passwordValidation.errors[0]);
    }
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(token)
        .digest('hex');
    const user = await prisma_utils_1.prisma.user.findFirst({
        where: {
            resetToken: hashedToken,
            resetTokenExpiry: { gt: new Date() }
        }
    });
    if (!user) {
        throw new errors_1.ValidationError('Invalid or expired token');
    }
    const saltRounds = 10;
    const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
    await prisma_utils_1.prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
            updatedAt: new Date()
        }
    });
    await prisma_utils_1.prisma.userActivity.create({
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
exports.refreshToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new errors_1.ValidationError('Refresh token is required');
    }
    const tokenPayload = await prisma_utils_1.prisma.refreshToken.findFirst({
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
    const tokens = (0, jwt_1.generateAuthTokens)({
        userId: tokenPayload.user.id,
        role: tokenPayload.user.role,
        name: tokenPayload.user.name,
        email: tokenPayload.user.email
    });
    if (config_1.default.JWT_REFRESH_TOKEN_ROTATION) {
        await prisma_utils_1.prisma.refreshToken.delete({
            where: { id: tokenPayload.id }
        });
        await prisma_utils_1.prisma.refreshToken.create({
            data: {
                userId: tokenPayload.user.id,
                token: tokens.refreshToken,
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdByIp: req.ip || '0.0.0.0'
            }
        });
    }
    res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: config_1.default.JWT_REFRESH_TOKEN_ROTATION ? tokens.refreshToken : refreshToken,
        expiresIn: tokens.expiresIn
    });
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await prisma_utils_1.prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        });
    }
    if (req.user?.id) {
        await prisma_utils_1.prisma.userActivity.create({
            data: {
                userId: req.user.id,
                activity: 'logout',
                ipAddress: req.ip || '0.0.0.0'
            }
        });
    }
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