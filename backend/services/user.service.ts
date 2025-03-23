/**
 * User Service
 * 
 * Service for User entity operations providing business logic and validation.
 */
import { format } from 'date-fns';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { BaseService } from '../utils/base.service.js';
import { UserRepository, User, userRepository } from '../repositories/user.repository.js';
import { 
  ProfileUpdateDTO,
  PasswordUpdateDTO,
  UserProfileResponseDTO,
  NotificationSettingsUpdateDTO
} from '../types/dtos/profile.dto.js';
import { UserFilterDTO } from '../types/dtos/user.dto.js';
import { 
  NotFoundError, 
  ValidationError, 
  ConflictError,
  UnauthorizedError
} from '../utils/errors.js';
import { 
  CreateOptions, 
  UpdateOptions, 
  FindOneOptions
} from '../types/service.types.js';
import { validateEmail, validateRequired } from '../utils/common-validators.js';
import logger from '../utils/logger.js';

/**
 * Service for User entity operations
 */
export class UserService extends BaseService<
  User,
  UserRepository,
  UserFilterDTO,
  any,  // No standard create DTO
  ProfileUpdateDTO,
  UserProfileResponseDTO
> {
  /**
   * Creates a new UserService instance
   * @param repository - UserRepository instance
   */
  constructor(repository: UserRepository = userRepository) {
    super(repository);
  }

  /**
   * Get user profile by ID
   * @param id - User ID
   * @param options - Find options
   * @returns User profile or null if not found
   */
  async getProfile(
    id: number,
    options: FindOneOptions = {}
  ): Promise<UserProfileResponseDTO | null> {
    try {
      // Get user from repository
      const user = await this.repository.findById(id, {
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
      
      // Return null if user not found
      if (!user) {
        if (options.throwIfNotFound) {
          throw new NotFoundError(`User with ID ${id} not found`);
        }
        return null;
      }
      
      // Get user settings
      const settings = await this.repository.getUserSettings(id);
      
      // Default settings if none exist
      const userSettings = settings || {
        language: 'de',
        darkMode: false,
        emailNotifications: true,
        pushNotifications: false,
        notificationInterval: 'sofort'
      };
      
      // Get user activity with type
      const activity = await this.repository.getUserActivity(id);
      
      // Format profile data
      return {
        id: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          telefon: user.phone || '',
          rolle: user.role,
          profilbild: user.profilePicture || null,
          seit: format(user.createdAt, 'dd.MM.yyyy')
        },
        settings: {
          sprache: userSettings.language || 'de',
          dark_mode: userSettings.darkMode || false,
          benachrichtigungen_email: userSettings.emailNotifications || true,
          benachrichtigungen_push: userSettings.pushNotifications || false,
          benachrichtigungen_intervall: userSettings.notificationInterval || 'sofort'
        },
        activity: activity.map((item: any) => ({
          type: item.activity,
          ip: item.ipAddress || '',
          date: format(item.timestamp, 'dd.MM.yyyy, HH:mm')
        }))
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, `Error fetching profile for user with ID ${id}`);
    }
  }

  /**
 * Update user profile picture
 * @param userId - User ID
 * @param file - Uploaded file
 * @param options - Update options
 * @returns Path to the updated profile picture
 */
async updateProfilePicture(
  userId: number,
  file: Express.Multer.File,
  options: UpdateOptions = {}
): Promise<{ imagePath: string }> {
  try {
    // Validate file
    if (!file) {
      throw new ValidationError('No file uploaded');
    }
    
    // Check allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Invalid file type. Only JPG, PNG, and GIF images are allowed');
    }
    
    // Check file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new ValidationError('File too large. Maximum file size is 2MB');
    }
    
    // Get user to verify existence
    const user = await this.repository.findById(userId);
    
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }
    
    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    const filePath = path.join(uploadDir, fileName);
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    // Update user profile picture in database
    const imagePath = `/uploads/profiles/${fileName}`;
    await this.repository.update(userId, {
      profilePicture: imagePath,
      updatedAt: new Date()
    });
    
    // Log activity
    if (options.userContext?.userId) {
      await this.repository.logSimpleActivity(
        userId,
        'profile_picture_updated',
        options.userContext.ipAddress || null
      );
    }
    
    return { imagePath };
  } catch (error) {
    this.handleError(error, `Error updating profile picture for user with ID ${userId}`);
  }
}

  /**
   * Update user profile
   * @param id - User ID
   * @param data - Profile update DTO
   * @param options - Update options
   * @returns Updated user profile
   */
  async updateProfile(
    id: number,
    data: ProfileUpdateDTO,
    options: UpdateOptions = {}
  ): Promise<{ id: number; name: string; email: string; role: string; initials: string }> {
    try {
      // Validate update data
      await this.validateProfileUpdate(id, data);
      
      // Update user in database
      const updatedUser = await this.repository.update(id, {
        name: data.name,
        email: data.email,
        phone: data.telefon || null,
        updatedAt: new Date()
      });
      
      // Log the activity
      if (options.userContext?.userId || options.userId) {
        await this.repository.logSimpleActivity(
          id,
          'profile_updated',
          options.userContext?.ipAddress || null
        );
      }
      
      // Return simplified user data
      return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        initials: updatedUser.name.split(' ').map((n: string) => n[0]).join('')
      };
    } catch (error) {
      this.handleError(error, `Error updating profile for user with ID ${id}`, { id, data });
    }
  }

  /**
   * Update user password
   * @param id - User ID
   * @param data - Password update DTO
   * @param options - Update options
   * @returns Success message
   */
  async updatePassword(
    id: number,
    data: PasswordUpdateDTO,
    options: UpdateOptions = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate password data
      const { current_password, new_password, confirm_password } = data;
      
      validateRequired(current_password, 'Current password');
      validateRequired(new_password, 'New password', 8);
      validateRequired(confirm_password, 'Confirm password');
      
      if (new_password !== confirm_password) {
        throw new ValidationError('New passwords do not match');
      }
      
      // Get user with password
      const user = await this.repository.findById(id, {
        select: {
          id: true,
          password: true
        }
      });
      
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      
      // Verify current password
      const passwordMatches = await bcrypt.compare(
        current_password, 
        user.password
      );
      
      if (!passwordMatches) {
        throw new UnauthorizedError('Current password is incorrect');
      }
      
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);
      
      // Update password in database
      await this.repository.update(id, {
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      // Log the activity
      if (options.userContext?.userId || options.userId) {
        await this.repository.logSimpleActivity(
          id,
          'password_changed',
          options.userContext?.ipAddress || null
        );
      }
      
      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      this.handleError(error, `Error updating password for user with ID ${id}`, { id });
    }
  }

  /**
   * Update notification settings
   * @param id - User ID
   * @param data - Notification settings update DTO
   * @param options - Update options
   * @returns Success message
   */
  async updateNotificationSettings(
    id: number,
    data: NotificationSettingsUpdateDTO,
    options: UpdateOptions = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get user
      const user = await this.repository.findById(id);
      
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      
      // Helper function to convert to boolean
      const toBool = (value: any): boolean => {
        return value === true || 
              (typeof value === 'string' && (
                value === 'on' || 
                value === 'true' || 
                value === '1'
              ));
      };
      
      // Prepare settings data
      const settingsData = {
        emailNotifications: toBool(data.benachrichtigungen_email),
        pushNotifications: toBool(data.benachrichtigungen_push),
        notificationInterval: data.benachrichtigungen_intervall || 'sofort'
      };
      
      // Update settings
      await this.repository.updateUserSettings(id, settingsData);
      
      // Log activity
      if (options.userContext?.userId || options.userId) {
        await this.repository.logSimpleActivity(
          id,
          'notification_settings_updated',
          options.userContext?.ipAddress || null
        );
      }
      
      return {
        success: true,
        message: 'Notification settings updated successfully'
      };
    } catch (error) {
      this.handleError(error, `Error updating notification settings for user with ID ${id}`, { id, data });
    }
  }

  /**
   * Request password reset
   * @param email - User email
   * @returns Reset token info or null if user not found
   */
  async requestPasswordReset(email: string): Promise<{ token: string; userId: number; email: string } | null> {
    try {
      // Find user by email
      const user = await this.repository.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      // Generate token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      // Set token expiry to 1 hour
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);
      
      // Save token to database
      await this.repository.createPasswordResetToken(
        user.id,
        hashedToken,
        expiry
      );
      
      return {
        userId: user.id,
        email: user.email,
        token: resetToken
      };
    } catch (error) {
      this.handleError(error, `Error requesting password reset for email ${email}`);
    }
  }

  /**
   * Validate reset token
   * @param token - Reset token
   * @returns User ID and email if token is valid
   */
  async validateResetToken(token: string): Promise<{ userId: number; email: string } | null> {
    try {
      // Hash the token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      // Find user with this token and valid expiry
      const user = await this.repository.findByResetToken(hashedToken);
      
      if (!user) {
        return null;
      }
      
      return {
        userId: user.id,
        email: user.email
      };
    } catch (error) {
      this.handleError(error, 'Error validating reset token');
    }
  }

  /**
   * Reset password using token
   * @param token - Reset token
   * @param password - New password
   * @param confirmPassword - Confirm new password
   * @returns Success message
   */
  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate passwords
      if (!password || !confirmPassword) {
        throw new ValidationError('Please enter and confirm your new password');
      }
      
      if (password !== confirmPassword) {
        throw new ValidationError('Passwords do not match');
      }
      
      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
      }
      
      // Hash the token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      
      // Find user with this token and valid expiry
      const user = await this.repository.findByResetToken(hashedToken);
      
      if (!user) {
        throw new ValidationError('Invalid or expired token');
      }
      
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Update user's password and clear reset token
      await this.repository.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      });
      
      // Log activity
      await this.repository.logSimpleActivity(
        user.id,
        'password_reset',
        null
      );
      
      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      this.handleError(error, 'Error resetting password');
    }
  }

  /**
   * Validate profile update data
   * @param id - User ID
   * @param data - Profile update data
   * @throws ValidationError if validation fails
   */
  protected async validateProfileUpdate(id: number, data: ProfileUpdateDTO): Promise<void> {
    // Validate required fields
    validateRequired(data.name, 'Name');
    validateEmail(data.email);
    
    // Get current user data for comparison
    const user = await this.repository.findById(id);
    
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    
    // Check if email is unique (if changed)
    if (data.email !== user.email) {
      const emailExists = await this.repository.findByEmail(data.email);
      
      if (emailExists && emailExists.id !== id) {
        throw new ConflictError('Email address is already in use');
      }
    }
  }

  /**
   * Map entity to DTO - not used for this service
   */
  protected mapEntityToDTO(entity: User): any {
    // No standard DTO mapping needed
    return entity;
  }
}



// Export singleton instance
export const userService = new UserService();
export default userService;