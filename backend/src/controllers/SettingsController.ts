import { Request, Response } from 'express';
import { ISettingsService, UpdateUserSettingsData } from '../interfaces/ISettingsService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { BaseController } from '../core/BaseController.js';
import { ISettingsController } from '../interfaces/ISettingsController.js';

/**
 * SettingsController
 * 
 * Controller for handling user and system settings-related HTTP requests.
 */
export class SettingsController extends BaseController implements ISettingsController {
  /**
   * Creates a new SettingsController instance
   * 
   * @param settingsService - Settings service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly settingsService: ISettingsService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(logger, errorHandler);
    
    // Bind methods to preserve 'this' context when used as route handlers
    this.getMySettings = this.getMySettings.bind(this);
    this.updateMySettings = this.updateMySettings.bind(this);
    this.getSystemSettings = this.getSystemSettings.bind(this);
    this.updateSystemSettings = this.updateSystemSettings.bind(this);
    
    this.logger.debug('Initialized SettingsController');
  }

  /**
   * Get settings of the current user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getMySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      // Get user settings from service
      const settings = await this.settingsService.getUserSettings(userId);
      
      if (!settings) {
        // Create default settings if they don't exist
        const defaultSettings = await this.settingsService.updateUserSettings(userId, {}, {
          context: {
            userId,
            ipAddress: req.ip
          }
        });
        
        // Send default settings
        this.sendSuccessResponse(res, defaultSettings, 'Default settings created successfully');
        return;
      }
      
      // Send existing settings
      this.sendSuccessResponse(res, settings, 'Settings retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Update settings of the current user
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateMySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const settingsData: UpdateUserSettingsData = req.body;
      
      // Update settings with context
      const settings = await this.settingsService.updateUserSettings(userId, settingsData, {
        context: {
          userId,
          ipAddress: req.ip
        }
      });
      
      // Send response
      this.sendSuccessResponse(res, settings, 'Settings updated successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Get system settings (admin only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async getSystemSettings(req: Request, res: Response): Promise<void> {
    try {
      // Get system settings from service
      const settings = await this.settingsService.getSystemSettings();
      
      // Send response
      this.sendSuccessResponse(res, settings, 'System settings retrieved successfully');
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  /**
   * Update system settings (admin only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  async updateSystemSettings(req: Request, res: Response): Promise<void> {
    try {
      const { key, value, description } = req.body;
      
      if (!key || value === undefined) {
        throw this.errorHandler.createValidationError('Invalid settings data', ['Key and value are required']);
      }
      
      const userId = (req as any).user.id;
      
      // Try to get existing setting
      const existingSetting = await this.settingsService.getSystemSetting(key);
      
      let setting;
      
      if (existingSetting) {
        // Update existing setting
        setting = await this.settingsService.updateSystemSetting(key, value, description, {
          context: {
            userId,
            ipAddress: req.ip
          }
        });
      } else {
        // Create new setting
        setting = await this.settingsService.createSystemSetting(key, value, description, {
          context: {
            userId,
            ipAddress: req.ip
          }
        });
      }
      
      // Send response
      this.sendSuccessResponse(
        res, 
        setting, 
        existingSetting ? 'System setting updated successfully' : 'System setting created successfully'
      );
    } catch (error) {
      this.handleError(error, req, res);
    }
  }
}