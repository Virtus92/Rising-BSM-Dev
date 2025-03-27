import { Request, Response } from 'express';
import { INotificationController } from '../interfaces/INotificationController.js';
import { INotificationService } from '../interfaces/INotificationService.js';
import { ILoggingService } from '../interfaces/ILoggingService.js';
import { IErrorHandler } from '../interfaces/IErrorHandler.js';
import { 
  MarkNotificationReadDto, 
  NotificationFilterDto
} from '../dtos/NotificationDtos.js';
import { AuthenticatedRequest } from '../interfaces/IAuthTypes.js';

/**
 * Implementation of INotificationController
 */
export class NotificationController implements INotificationController {
  /**
   * Creates a new NotificationController instance
   * 
   * @param notificationService - Notification service
   * @param logger - Logging service
   * @param errorHandler - Error handler
   */
  constructor(
    private readonly notificationService: INotificationService,
    private readonly logger: ILoggingService,
    private readonly errorHandler: IErrorHandler
  ) {
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
      this.handleError(error, req, res);
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
      this.handleError(error, req, res);
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
      this.handleError(error, req, res);
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
      this.handleError(error, req, res);
    }
  }

  /**
   * Send success response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param message - Success message
   */
  private sendSuccessResponse(res: Response, data: any, message?: string): void {
    res.status(200).json({
      success: true,
      data,
      message: message || 'Operation successful'
    });
  }

  /**
   * Send paginated response
   * 
   * @param res - HTTP response
   * @param data - Response data
   * @param pagination - Pagination information
   * @param message - Success message
   */
  private sendPaginatedResponse(res: Response, data: any[], pagination: any, message?: string): void {
    res.status(200).json({
      success: true,
      data,
      meta: {
        pagination
      },
      message: message || 'Operation successful'
    });
  }

  /**
   * Handle and format errors
   * 
   * @param error - Error object
   * @param req - HTTP request
   * @param res - HTTP response
   */
  private handleError(error: any, req: Request, res: Response): void {
    this.errorHandler.handleError(error, req, res);
  }
}