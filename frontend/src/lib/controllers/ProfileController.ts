import { Request, Response } from 'express';
import { IProfileService } from '../interfaces/IProfileService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { BaseController } from '../core/BaseController.js';
import { IProfileController } from '../interfaces/IProfileController.js';
import { UpdateProfileDto, ChangeMyPasswordDto, ActivityLogFilterParams, ProfileResponseDto } from '../dtos/ProfileDtos.js';
import { ChangePasswordDto } from '../dtos/UserDtos.js';
import { User } from '../entities/User.js';

/**
 * ProfileController
 * 
 * Controller for handling user profile-related HTTP requests.
 * This controller allows users to manage their own profiles.
 */
export class ProfileController extends BaseController<User, any, UpdateProfileDto, ProfileResponseDto> implements IProfileController {
  /**
   * Creates a new ProfileController instance
   * 
   * @param profileService - Profile service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly profileService: IProfileService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(profileService as any, logger, errorHandler);
    
    // Bind methods to preserve 'this' context when used as route handlers
    this.getMyProfile = this.getMyProfile.bind(this);
    this.updateMyProfile = this.updateMyProfile.bind(this);
    this.changeMyPassword = this.changeMyPassword.bind(this);
    this.uploadProfilePicture = this.uploadProfilePicture.bind(this);
    this.deleteProfilePicture = this.deleteProfilePicture.bind(this);
    this.getMyActivityLog = this.getMyActivityLog.bind(this);
    
    this.logger.debug('Initialized ProfileController');
  }

  /**
   * Get the profile of the current user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      // Get user details from service
      const user = await this.profileService.getProfileDetails(userId);
      
      if (!user) {
        throw this.errorHandler.createNotFoundError(`User profile not found`);
      }
      
      // Send response
      this.sendSuccessResponse(res, user, 'Profile retrieved successfully');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Update the profile of the current user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const profileData: UpdateProfileDto = req.body;
      
      // Ensure name is set if firstName and lastName are provided
      if (profileData.firstName && profileData.lastName) {
        profileData.name = `${profileData.firstName} ${profileData.lastName}`;
      }
      
      // Update user with context
      const user = await this.profileService.updateProfile(userId, profileData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Change the password of the current user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async changeMyPassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const passwordData: ChangeMyPasswordDto = req.body;
      
      // Validate password confirmation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw this.errorHandler.createValidationError('Password confirmation does not match', ['New password and confirmation must match']);
      }
      
      // Create ChangePasswordDto with all required fields
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      };
      
      // Change password with context
      const success = await this.profileService.changePassword(userId, changePasswordDto, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(
        res, 
        { changed: success }, 
        'Password changed successfully'
      );
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Upload a profile picture for the current user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async uploadProfilePicture(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      // Check if file exists in the request
      if (!req.file) {
        throw this.errorHandler.createValidationError('No file uploaded', ['Please provide a profile picture']);
      }
      
      // Get file path from multer
      const filePath = (req.file as Express.Multer.File).path;
      
      // Update user profile picture
      const user = await this.profileService.updateProfilePicture(userId, filePath, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, {
        profilePicture: user.profilePicture
      }, 'Profile picture uploaded successfully');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Delete the profile picture of the current user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async deleteProfilePicture(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      // Remove profile picture
      const user = await this.profileService.removeProfilePicture(userId, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, {
        success: true
      }, 'Profile picture removed successfully');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get the activity log of the current user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getMyActivityLog(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      // Extract query parameters
      const filters: ActivityLogFilterParams = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortDirection: req.query.sortDirection as 'asc' | 'desc'
      };
      
      // Get user activity logs
      const result = await this.profileService.getUserActivityLogs(userId, filters);
      
      // Send response
      this.sendPaginatedResponse(
        res, 
        result.data, 
        result.pagination, 
        'Activity logs retrieved successfully'
      );
    } catch (error) {
      this.handleError(error, res);
    }
  }
}