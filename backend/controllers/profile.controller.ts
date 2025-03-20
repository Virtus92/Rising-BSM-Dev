// controllers/profile.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.utils';
import { formatDateSafely } from '../utils/formatters';
import { ValidationError, BadRequestError, NotFoundError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Get current user profile data
 */
export const getUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  
  // Get user data from database with Prisma
  const user = await prisma.user.findUnique({
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
    throw new NotFoundError('User not found');
  }
  
  // Get user settings
  const settings = await prisma.userSettings.findUnique({
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
  
  // Get user activity with type
  interface ActivityItem {
    activity: string;
    ipAddress: string | null;
    timestamp: Date | null;
    userId: number;
    id: number;
  }
  
  const activity = await prisma.userActivity.findMany({
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
      seit: formatDateSafely(user.createdAt, 'dd.MM.yyyy')
    },
    settings: {
      sprache: userSettings.language || 'de',
      dark_mode: userSettings.darkMode || false,
      benachrichtigungen_email: userSettings.emailNotifications || true,
      benachrichtigungen_push: userSettings.pushNotifications || false,
      benachrichtigungen_intervall: userSettings.notificationInterval || 'sofort'
    },
    activity: activity.map((item: { activity: string; ipAddress: string | null; timestamp: Date | null; userId: number; id: number; }) => ({
      type: item.activity,
      ip: item.ipAddress || '',
      date: formatDateSafely(item.timestamp!, 'dd.MM.yyyy, HH:mm')
    }))
  });
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  const { name, email, telefon } = req.body;
  
  // Validation
  if (!name || !email) {
    throw new ValidationError('Name and email are required fields');
  }
  
  // Check if email is unique (if changed)
  if (email !== req.user.email) {
    const emailCheck = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });
    
    if (emailCheck) {
      throw new ValidationError('Email address is already in use');
    }
  }
  
  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      phone: telefon || null,
      updatedAt: new Date()
    }
  });
  
  // Log the activity
  await prisma.userActivity.create({
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
      initials: updatedUser.name.split(' ').map((n: string) => n[0]).join('')
    },
    message: 'Profile updated successfully'
  });
});

/**
 * Update user password
 */
export const updatePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  const { current_password, new_password, confirm_password } = req.body;
  
  // Validation
  if (!current_password || !new_password || !confirm_password) {
    throw new ValidationError('All password fields are required');
  }
  
  if (new_password !== confirm_password) {
    throw new ValidationError('New passwords do not match');
  }
  
  if (new_password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  // Get current password hash
  const userQuery = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  });
  
  if (!userQuery) {
    throw new NotFoundError('User not found');
  }
  
  // Verify current password
  const passwordMatches = await bcrypt.compare(
    current_password, 
    userQuery.password
  );
  
  if (!passwordMatches) {
    throw new ValidationError('Current password is incorrect');
  }
  
  // Hash new password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(new_password, saltRounds);
  
  // Update password in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });
  
  // Log the activity
  await prisma.userActivity.create({
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
export const updateProfilePicture = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  
  // Check if file was uploaded
  if (!req.file) {
    throw new ValidationError('No image file uploaded');
  }
  
  // Image path (to be stored in database)
  const imagePath = `/uploads/profile/${req.file.filename}`;
  
  // Update profile picture in database
  await prisma.user.update({
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
export const updateNotificationSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  const userId = req.user.id;
  const { 
    benachrichtigungen_email, 
    benachrichtigungen_push, 
    benachrichtigungen_intervall 
  } = req.body;
  
  // Check if settings exist for this user
  const existingSettings = await prisma.userSettings.findUnique({
    where: { userId }
  });
  
  if (!existingSettings) {
    // Create new settings
    await prisma.userSettings.create({
      data: {
        userId,
        emailNotifications: benachrichtigungen_email === 'on' || benachrichtigungen_email === true,
        pushNotifications: benachrichtigungen_push === 'on' || benachrichtigungen_push === true,
        notificationInterval: benachrichtigungen_intervall || 'sofort'
      }
    });
  } else {
    // Update existing settings
    await prisma.userSettings.update({
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