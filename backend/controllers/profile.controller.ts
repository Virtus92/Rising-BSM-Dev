import { Request, Response } from 'express';
import { BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/common/types.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { UserService, userService } from '../services/user.service.js';
import { 
  ProfileUpdateDTO,
  PasswordUpdateDTO,
  NotificationSettingsUpdateDTO
} from '../types/dtos/profile.dto.js';

/**
 * Get current user profile data
 */
export const getUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Get user profile through service
  const profileData = await userService.getProfile(req.user.id);
  
  // Send success response
  ResponseFactory.success(res, profileData);
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Extract update DTO from request body
  const profileData: ProfileUpdateDTO = req.body;
  
  // Update profile with user context
  const result = await userService.updateProfile(req.user.id, profileData, {
    userContext: {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    }
  });
  
  // Send success response
  ResponseFactory.success(res, { user: result }, 'Profile updated successfully');
});

/**
 * Update user password
 */
export const updatePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Extract password data from request body
  const passwordData: PasswordUpdateDTO = req.body;
  
  // Update password with user context
  await userService.updatePassword(req.user.id, passwordData, {
    userContext: {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    }
  });
  
  // Send success response
  ResponseFactory.success(res, {}, 'Password updated successfully');
});

/**
 * Update profile picture
 */
export const updateProfilePicture = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Check if file was uploaded
  if (!req.file) {
    throw new BadRequestError('No image file uploaded');
  }
  
  // Update profile picture with user context
  const result = await userService.updateProfilePicture(req.user.id, req.file, {
    userContext: {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    }
  });
  
  // Send success response
  ResponseFactory.success(res, { imagePath: result.imagePath }, 'Profile picture updated successfully');
});

/**
 * Update notification settings
 */
export const updateNotificationSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Extract settings data from request body
  const settingsData: NotificationSettingsUpdateDTO = req.body;
  
  // Update settings with user context
  await userService.updateNotificationSettings(req.user.id, settingsData, {
    userContext: {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    }
  });
  
  // Send success response
  ResponseFactory.success(res, {}, 'Notification settings updated successfully');
});