import { PrismaClient, Notification } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository.js';
import { FindManyOptions } from '../types/repository.types.js';
import { NotificationFilterDTO } from '../types/dtos/notification.dto.js';

export class NotificationRepository extends BaseRepository<Notification, NotificationFilterDTO> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.notification);
  }

  // Override filter conditions for notifications
  protected buildFilterConditions(filters: NotificationFilterDTO): any {
    const conditions: any = {};

    if (filters.userId) {
      conditions.userId = filters.userId;
    }

    if (filters.type) {
      conditions.type = filters.type;
    }

    if (filters.read !== undefined) {
      conditions.read = filters.read === 'true' || filters.read === true;
    }

    return conditions;
  }

  // Custom method to mark notifications as read
  async markAsRead(userId: number, notificationId?: number): Promise<number> {
    if (notificationId) {
      return this.prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { read: true }
      }).then(result => result.count);
    }

    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    }).then(result => result.count);
  }
}