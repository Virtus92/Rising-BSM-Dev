"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationSettings = exports.updateProfilePicture = exports.updatePassword = exports.updateProfile = exports.getUserProfile = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_utils_1 = require("../utils/prisma.utils");
const formatters_1 = require("../utils/formatters");
const errors_1 = require("../utils/errors");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getUserProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const user = await prisma_utils_1.prisma.user.findUnique({
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
    const settings = await prisma_utils_1.prisma.userSettings.findUnique({
        where: { userId }
    });
    const userSettings = settings || {
        language: 'de',
        darkMode: false,
        emailNotifications: true,
        pushNotifications: false,
        notificationInterval: 'sofort'
    };
    const activity = await prisma_utils_1.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 5
    });
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
exports.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const { name, email, telefon } = req.body;
    if (!name || !email) {
        throw new errors_1.ValidationError('Name and email are required fields');
    }
    if (email !== req.user.email) {
        const emailCheck = await prisma_utils_1.prisma.user.findFirst({
            where: {
                email,
                id: { not: userId }
            }
        });
        if (emailCheck) {
            throw new errors_1.ValidationError('Email address is already in use');
        }
    }
    const updatedUser = await prisma_utils_1.prisma.user.update({
        where: { id: userId },
        data: {
            name,
            email,
            phone: telefon || null,
            updatedAt: new Date()
        }
    });
    await prisma_utils_1.prisma.userActivity.create({
        data: {
            userId,
            activity: 'profile_updated',
            ipAddress: req.ip || '0.0.0.0'
        }
    });
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
exports.updatePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;
    if (!current_password || !new_password || !confirm_password) {
        throw new errors_1.ValidationError('All password fields are required');
    }
    if (new_password !== confirm_password) {
        throw new errors_1.ValidationError('New passwords do not match');
    }
    if (new_password.length < 8) {
        throw new errors_1.ValidationError('Password must be at least 8 characters long');
    }
    const userQuery = await prisma_utils_1.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
    });
    if (!userQuery) {
        throw new errors_1.NotFoundError('User not found');
    }
    const passwordMatches = await bcryptjs_1.default.compare(current_password, userQuery.password);
    if (!passwordMatches) {
        throw new errors_1.ValidationError('Current password is incorrect');
    }
    const saltRounds = 10;
    const hashedPassword = await bcryptjs_1.default.hash(new_password, saltRounds);
    await prisma_utils_1.prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            updatedAt: new Date()
        }
    });
    await prisma_utils_1.prisma.userActivity.create({
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
exports.updateProfilePicture = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    if (!req.file) {
        throw new errors_1.ValidationError('No image file uploaded');
    }
    const imagePath = `/uploads/profile/${req.file.filename}`;
    await prisma_utils_1.prisma.user.update({
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
exports.updateNotificationSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw new errors_1.BadRequestError('User not authenticated');
    }
    const userId = req.user.id;
    const { benachrichtigungen_email, benachrichtigungen_push, benachrichtigungen_intervall } = req.body;
    const existingSettings = await prisma_utils_1.prisma.userSettings.findUnique({
        where: { userId }
    });
    if (!existingSettings) {
        await prisma_utils_1.prisma.userSettings.create({
            data: {
                userId,
                emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
                pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
                notificationInterval: benachrichtigungen_intervall || 'sofort'
            }
        });
    }
    else {
        await prisma_utils_1.prisma.userSettings.update({
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