import { BaseService } from '../utils/base.service.js';
import { Notification } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { 
  NotificationCreateDTO, 
  NotificationResponseDTO, 
  NotificationFilterDTO,
  MarkNotificationReadDTO
} from '../types/dtos/notification.dto.js';
import { NotFoundError } from '../utils/error.utils.js';

export class NotificationService extends BaseService<
  Notification, 
  NotificationRepository, 
  NotificationFilterDTO,
  NotificationCreateDTO,
  any, 
  NotificationResponseDTO
> {
  constructor(repository: NotificationRepository) {
    super(repository);
  }

  // Map entity to response DTO
  protected mapEntityToDTO(entity: Notification): NotificationResponseDTO {
    return {
      id: entity.id,
      title: entity.title,
      message: entity.message || '',
      type: entity.type,
      read: entity.read,
      timestamp: entity.createdAt,
      time: '', // You'll want to implement a relative time formatter
      icon: '', // Implement icon determination logic
      link: '' // Implement link generation logic
    };
  }

  // Custom method to mark notifications as read
  async markNotificationsRead(
    userId: number, 
    data: MarkNotificationReadDTO
  ): Promise<number> {
    if (data.markAll) {
      return this.repository.markAsRead(userId);
    }

    if (data.notificationId) {
      // Optional: Verify notification belongs to user
      const notification = await this.repository.findById(data.notificationId);
      if (!notification || notification.userId !== userId) {
        throw new NotFoundError('Notification not found');
      }

      return this.repository.markAsRead(userId, data.notificationId);
    }

    throw new NotFoundError('No notifications specified');
  }
}