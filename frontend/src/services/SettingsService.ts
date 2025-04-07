import { PrismaClient, UserSettings } from '@prisma/client';
import { ILoggingService } from '../lib/interfaces/ILoggingService.js';
import { IErrorHandler } from '../lib/interfaces/IErrorHandler.js';
import { 
  ISettingsService, 
  UpdateUserSettingsData, 
  SystemSettingData, 
  SettingsServiceOptions 
} from '../lib/interfaces/ISettingsService.js';

/**
 * Service for managing user and system settings
 */
export class SettingsService implements ISettingsService {
  /**
   * Creates a new SettingsService instance
   * 
   * @param prisma - Prisma client
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
    this.logger.debug('Initialized SettingsService');
  }

  /**
   * Get user settings by user ID
   * 
   * @param userId - ID of the user
   * @returns User settings
   */
  async getUserSettings(userId: number): Promise<UserSettings | null> {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }

      // Get user settings
      const settings = await this.prisma.userSettings.findUnique({
        where: { userId }
      });

      return settings;
    } catch (error) {
      this.logger.error(`Error getting user settings for user ${userId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Update user settings
   * 
   * @param userId - ID of the user
   * @param data - Settings data to update
   * @param options - Optional service options
   * @returns Updated user settings
   */
  async updateUserSettings(
    userId: number, 
    data: UpdateUserSettingsData, 
    options?: SettingsServiceOptions
  ): Promise<UserSettings> {
    try {
      const context = options?.context;
      
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw this.errorHandler.createNotFoundError(`User with ID ${userId} not found`);
      }

      // Attempt to update existing settings, or create if they don't exist
      const settings = await this.prisma.userSettings.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data
        }
      });

      this.logger.info(
        `User settings updated for user ${userId}`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return settings;
    } catch (error) {
      this.logger.error(`Error updating user settings for user ${userId}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get all system settings
   * 
   * @returns All system settings
   */
  async getSystemSettings(): Promise<SystemSettingData[]> {
    try {
      const settings = await this.prisma.systemSettings.findMany();
      
      return settings.map(setting => ({
        key: setting.key,
        value: setting.value,
        description: setting.description || undefined
      }));
    } catch (error) {
      this.logger.error('Error getting system settings', error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Get specific system setting by key
   * 
   * @param key - Setting key
   * @returns System setting
   */
  async getSystemSetting(key: string): Promise<SystemSettingData | null> {
    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: { key }
      });

      if (!setting) {
        return null;
      }

      return {
        key: setting.key,
        value: setting.value,
        description: setting.description || undefined
      };
    } catch (error) {
      this.logger.error(`Error getting system setting: ${key}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Update system setting
   * 
   * @param key - Setting key
   * @param value - New setting value
   * @param description - Optional setting description
   * @param options - Optional service options
   * @returns Updated system setting
   */
  async updateSystemSetting(
    key: string, 
    value: string, 
    description?: string, 
    options?: SettingsServiceOptions
  ): Promise<SystemSettingData> {
    try {
      const context = options?.context;
      
      const setting = await this.prisma.systemSettings.findUnique({
        where: { key }
      });

      if (!setting) {
        throw this.errorHandler.createNotFoundError(`System setting with key ${key} not found`);
      }

      const updatedSetting = await this.prisma.systemSettings.update({
        where: { key },
        data: { 
          value,
          description: description !== undefined ? description : setting.description
        }
      });

      this.logger.info(
        `System setting ${key} updated`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return {
        key: updatedSetting.key,
        value: updatedSetting.value,
        description: updatedSetting.description || undefined
      };
    } catch (error) {
      this.logger.error(`Error updating system setting: ${key}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }

  /**
   * Create system setting if it doesn't exist
   * 
   * @param key - Setting key
   * @param value - Setting value
   * @param description - Optional setting description
   * @param options - Optional service options
   * @returns Created system setting
   */
  async createSystemSetting(
    key: string, 
    value: string, 
    description?: string, 
    options?: SettingsServiceOptions
  ): Promise<SystemSettingData> {
    try {
      const context = options?.context;
      
      // Check if setting already exists
      const existingSetting = await this.prisma.systemSettings.findUnique({
        where: { key }
      });

      if (existingSetting) {
        throw this.errorHandler.createError(`System setting with key ${key} already exists`, 400);
      }

      // Create new setting
      const setting = await this.prisma.systemSettings.create({
        data: {
          key,
          value,
          description
        }
      });

      this.logger.info(
        `System setting ${key} created`, 
        { userId: context?.userId, ipAddress: context?.ipAddress }
      );

      return {
        key: setting.key,
        value: setting.value,
        description: setting.description || undefined
      };
    } catch (error) {
      this.logger.error(`Error creating system setting: ${key}`, error instanceof Error ? error : String(error));
      throw error;
    }
  }
}