import { Request, Response } from 'express';
import { INotificationController } from '../interfaces/INotificationController.js';
import { INotificationService } from '../interfaces/INotificationService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  MarkNotificationReadDto, 
  NotificationFilterDto,
  NotificationType,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto
} from '../dtos/NotificationDtos.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';
import { BaseController } from '../core/BaseController.js';
import { Notification } from '../entities/Notification.js';

/**
 * Implementation of INotificationController
 */
export class NotificationController extends BaseController<Notification, CreateNotificationDto, UpdateNotificationDto, NotificationResponseDto> implements INotificationController {
  /**
   * Creates a new NotificationController instance
   * 
   * @param notificationService - Notification service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly notificationService: INotificationService,
    logger: ILoggingService,
    errorHandler: IErrorHandler
  ) {
    super(notificationService, logger, errorHandler);
    
    // Bind methods to preserve 'this' context when used as route handlers
    this.getNotifications = this.getNotifications.bind(this);
    this.markNotificationsRead = this.markNotificationsRead.bind(this);
    this.getNotificationStats = this.getNotificationStats.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.testNotification = this.testNotification.bind(this);
    
    this.logger.debug('Initialized NotificationController');
  }

  /**
   * Get user notifications
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw this.errorHandler.createUnauthorizedError('Authentication required');
      }
      
      const userId = authReq.user.id;
      
      // Get validated query params or use raw query
      const query = (req as any).validatedQuery || req.query;
      
      // Build filter parameters
      const filters: NotificationFilterDto = {
        userId,
        type: query.type as string,
        read: query.read !== undefined ? 
          (typeof query.read === 'string' ? query.read === 'true' : Boolean(query.read)) : 
          undefined,
        search: query.search as string,
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20
      };
      
      // Get notifications from service
      const result = await this.notificationService.findAll(filters);
      
      // Send paginated response
      this.sendPaginatedResponse(res, result.data, result.pagination, 'Notifications retrieved successfully');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Mark notifications as read
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async markNotificationsRead(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw this.errorHandler.createUnauthorizedError('Authentication required');
      }
      
      const userId = authReq.user.id;
      const data = (req as any).validatedData as MarkNotificationReadDto || req.body;
      
      // Mark notifications as read
      const count = await this.notificationService.markNotificationsRead(userId, data);
      
      // Send success response
      this.sendSuccessResponse(
        res,
        { count },
        'Notifications marked as read'
      );
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Get notification statistics
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw this.errorHandler.createUnauthorizedError('Authentication required');
      }
      
      const userId = authReq.user.id;
      
      // Get notification statistics
      const stats = await this.notificationService.getNotificationStats(userId);
      
      // Send success response
      this.sendSuccessResponse(res, stats, 'Notification statistics retrieved successfully');
    } catch (error) {
      this.handleError(error, res);
    }
  }

  /**
   * Delete a notification
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw this.errorHandler.createUnauthorizedError('Authentication required');
      }
      
      const userId = authReq.user.id;
      const notificationId = parseInt(req.params.id, 10);
      
      // Delete notification
      const result = await this.notificationService.deleteUserNotification(userId, notificationId);
      
      // Send success response
      this.sendSuccessResponse(res, result, 'Notification deleted successfully');
    } catch (error) {
      this.handleError(error, res);
    }
  }
  
  /**
   * Test notification creation (for development only)
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   */
  public async testNotification(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!authReq.user) {
        throw this.errorHandler.createUnauthorizedError('Authentication required');
      }
      
      const userId = authReq.user.id;
      const { type = 'info', message = 'Test notification' } = req.body;
      
      // Create a test notification directly
      let notificationType: NotificationType;
      
      switch(type.toLowerCase()) {
        case 'warning':
          notificationType = NotificationType.WARNING;
          break;
        case 'error':
          notificationType = NotificationType.ERROR;
          break;
        case 'success':
          notificationType = NotificationType.SUCCESS;
          break;
        case 'message':
          notificationType = NotificationType.MESSAGE;
          break;
        default:
          notificationType = NotificationType.INFO;
      }
      
      // Create notification using service
      const notification = await this.notificationService.createNotification({
        userId,
        title: 'Test Notification',
        message,
        type: notificationType
      });
      
      // Send success response
      this.sendSuccessResponse(
        res,
        notification,
        'Test notification created successfully'
      );
    } catch (error) {
      this.handleError(error, res);
    }
  }
}