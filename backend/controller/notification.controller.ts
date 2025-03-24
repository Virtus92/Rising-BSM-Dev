import { Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { AuthenticatedRequest } from '../types/common/types.js';
import { 
  MarkNotificationReadDTO, 
  NotificationFilterDTO 
} from '../types/dtos/notification.dto.js';
import { ResponseFactory } from '../utils/http.utils.js';
import { processPagination } from '../utils/http.utils.js';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const filters: NotificationFilterDTO = {
      ...req.validatedQuery,
      userId
    };

    const pagination = processPagination(req.validatedQuery);

    const result = await this.notificationService.findAll(filters, pagination);

    ResponseFactory.paginated(res, result.data, {
      ...result.pagination,
      skip: pagination.skip,
    });
  }

  async markNotificationsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const data: MarkNotificationReadDTO = req.validatedData;

    const count = await this.notificationService.markNotificationsRead(userId, data);

    ResponseFactory.success(res, { count }, 'Notifications marked as read');
  }
}