import { Request, Response } from 'express';
import { ForbiddenError, BadRequestError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/common/types.js';
import { ResponseFactory } from '../utils/response.factory.js';
import { UserService, userService } from '../services/user.service.js';
import { 
  UserSettingsUpdateDTO,
  SystemSettingsUpdateDTO,
  BackupSettingsUpdateDTO,
  ManualBackupDTO
} from '../types/dtos/settings.dto.js';

/**
 * Get user settings
 */
export const getUserSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Get user settings through service
  const settings = await userService.getUserSettings(req.user.id);
  
  // Send success response
  ResponseFactory.success(res, { settings });
});

/**
 * Update user settings
 */
export const updateUserSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Extract update DTO from request body
  const settingsData: UserSettingsUpdateDTO = req.body;
  
  // Update settings with user context
  await userService.updateUserSettings(req.user.id, settingsData, {
    userContext: {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    }
  });
  
  // Send success response
  ResponseFactory.success(res, {}, 'Settings updated successfully');
});

/**
 * Get system settings (admin only)
 */
export const getSystemSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to system settings');
  }
  
  // Get system settings through service
  const settings = await userService.getSystemSettings();
  
  // Send success response
  ResponseFactory.success(res, { settings });
});

/**
 * Update system settings (admin only)
 */
export const updateSystemSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to system settings');
  }
  
  // Extract settings data from request body
  const settingsData: SystemSettingsUpdateDTO = req.body.settings;
  
  // Update system settings with user context
  await userService.updateSystemSettings(settingsData, {
    userContext: {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    }
  });
  
  // Send success response
  ResponseFactory.success(res, {}, 'System settings updated successfully');
});

/**
 * Get backup settings (admin only)
 */
export const getBackupSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to backup settings');
  }
  
  // Get backup settings through service
  const result = await userService.getBackupSettings();
  
  // Send success response
  ResponseFactory.success(res, result);
});

/**
 * Update backup settings (admin only)
 */
export const updateBackupSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to backup settings');
  }
  
  // Extract settings data from request body
  const settingsData: BackupSettingsUpdateDTO = req.body;
  
  // Update backup settings with user context
  await userService.updateBackupSettings(settingsData, {
    userContext: {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    }
  });
  
  // Send success response
  ResponseFactory.success(res, {}, 'Backup settings updated successfully');
});

/**
 * Trigger manual backup (admin only)
 */
export const triggerManualBackup = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new BadRequestError('User not authenticated');
  }
  
  // Verify user is admin
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Unauthorized access to backup functionality');
  }
  
  // Extract backup data from request body
  const backupData: ManualBackupDTO = req.body;
  
  // Trigger backup with user context
  await userService.triggerManualBackup(backupData, {
    userContext: {
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      ipAddress: req.ip
    }
  });
  
  // Send success response
  ResponseFactory.success(
    res, 
    { status: 'pending' }, 
    'Backup process initiated'
  );
});