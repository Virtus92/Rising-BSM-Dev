"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationSettings = exports.updateProfilePicture = exports.updatePassword = exports.updateProfile = exports.getUserProfile = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_utils_1 = __importDefault(require("../utils/prisma.utils"));
const formatters_1 = require("../utils/formatters");
const errors_1 = require("../utils/errors");
const asyncHandler_1 = require("../utils/asyncHandler");
/**
 * Get current user profile data
 */
exports.getUserProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    // Get user data from database with Prisma
    const user = await prisma_utils_1.default.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            profilePicture: true,
            createdAt: true,
            updatedAt: true
        }
    });
    if (!user) {
        throw new errors_1.NotFoundError('User not found');
    }
    // Get user settings
    const settings = await prisma_utils_1.default.userSettings.findUnique({
        where: { userId }
    });
    // Default settings if none exist
    const userSettings = settings || {
        language: 'de',
        darkMode: false,
        emailNotifications: true,
        pushNotifications: false,
        notificationInterval: 'sofort'
    };
    const activity = await prisma_utils_1.default.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 5
    });
    // Format data for response with explicit typing
    res.status(200).json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            telefon: user.phone || '',
            rolle: user.role,
            profilbild: user.profilePicture || null,
            seit: (0, formatters_1.formatDateSafely)(user.createdAt, 'dd.MM.yyyy')
        },
        settings: {
            sprache: userSettings.language || 'de',
            dark_mode: userSettings.darkMode || false,
            benachrichtigungen_email: userSettings.emailNotifications || true,
            benachrichtigungen_push: userSettings.pushNotifications || false,
            benachrichtigungen_intervall: userSettings.notificationInterval || 'sofort'
        },
        activity: activity.map((item) => ({
            type: item.activity,
            ip: item.ipAddress || '',
            date: (0, formatters_1.formatDateSafely)(item.timestamp, 'dd.MM.yyyy, HH:mm')
        }))
    });
});
/**
 * Update user profile
 */
exports.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const { name, email, telefon } = req.body;
    // Validation
    if (!name || !email) {
        throw new errors_1.ValidationError('Name and email are required fields');
    }
    // Check if email is unique (if changed)
    if (email !== req.user.email) {
        const emailCheck = await prisma_utils_1.default.user.findFirst({
            where: {
                email,
                id: { not: userId }
            }
        });
        if (emailCheck) {
            throw new errors_1.ValidationError('Email address is already in use');
        }
    }
    // Update user in database
    const updatedUser = await prisma_utils_1.default.user.update({
        where: { id: userId },
        data: {
            name,
            email,
            phone: telefon || null,
            updatedAt: new Date()
        }
    });
    // Log the activity
    await prisma_utils_1.default.userActivity.create({
        data: {
            userId,
            activity: 'profile_updated',
            ipAddress: req.ip || '0.0.0.0'
        }
    });
    // Return updated user data for session
    res.status(200).json({
        success: true,
        user: {
            id: userId,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            initials: updatedUser.name.split(' ').map((n) => n[0]).join('')
        },
        message: 'Profile updated successfully'
    });
});
/**
 * Update user password
 */
exports.updatePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;
    // Validation
    if (!current_password || !new_password || !confirm_password) {
        throw new errors_1.ValidationError('All password fields are required');
    }
    if (new_password !== confirm_password) {
        throw new errors_1.ValidationError('New passwords do not match');
    }
    if (new_password.length < 8) {
        throw new errors_1.ValidationError('Password must be at least 8 characters long');
    }
    // Get current password hash
    const userQuery = await prisma_utils_1.default.user.findUnique({
        where: { id: userId },
        select: { password: true }
    });
    if (!userQuery) {
        throw new errors_1.NotFoundError('User not found');
    }
    // Verify current password
    const passwordMatches = await bcryptjs_1.default.compare(current_password, userQuery.password);
    if (!passwordMatches) {
        throw new errors_1.ValidationError('Current password is incorrect');
    }
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcryptjs_1.default.hash(new_password, saltRounds);
    // Update password in database
    await prisma_utils_1.default.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            updatedAt: new Date()
        }
    });
    // Log the activity
    await prisma_utils_1.default.userActivity.create({
        data: {
            userId,
            activity: 'password_changed',
            ipAddress: req.ip || '0.0.0.0'
        }
    });
    res.status(200).json({
        success: true,
        message: 'Password updated successfully'
    });
});
/**
 * Update profile picture
 */
exports.updateProfilePicture = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    // Check if file was uploaded
    if (!req.file) {
        throw new errors_1.ValidationError('No image file uploaded');
    }
    // Image path (to be stored in database)
    const imagePath = `/uploads/profile/${req.file.filename}`;
    // Update profile picture in database
    await prisma_utils_1.default.user.update({
        where: { id: userId },
        data: {
            profilePicture: imagePath,
            updatedAt: new Date()
        }
    });
    res.status(200).json({
        success: true,
        imagePath: imagePath,
        message: 'Profile picture updated successfully'
    });
});
/**
 * Update notification settings
 */
exports.updateNotificationSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const { benachrichtigungen_email, benachrichtigungen_push, benachrichtigungen_intervall } = req.body;
    // Check if settings exist for this user
    const existingSettings = await prisma_utils_1.default.userSettings.findUnique({
        where: { userId }
    });
    if (!existingSettings) {
        // Create new settings
        await prisma_utils_1.default.userSettings.create({
            data: {
                userId,
                emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
                pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
                notificationInterval: benachrichtigungen_intervall || 'sofort'
            }
        });
    }
    else {
        // Update existing settings
        await prisma_utils_1.default.userSettings.update({
            where: { userId },
            data: {
                emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
                pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
                notificationInterval: benachrichtigungen_intervall || 'sofort',
                updatedAt: new Date()
            }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Notification settings updated successfully'
    });
});
//# sourceMappingURL=profile.controller.js.map