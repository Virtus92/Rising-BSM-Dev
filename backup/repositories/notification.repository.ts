import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../backend/utils/base.repository.js';
import { QueryBuilder } from '../utils_bak/query-builder.js';
import { NotificationFilterDTO } from '../../backend/types/dtos/notification.dto.js';
import { NotificationRecord } from '../types/models.js';
import { prisma } from '../../backend/utils/prisma.utils.js';

/**
 * Notification entity type
 */
export interface Notification {
  id: number;
  userId: number | null;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  referenceId: number | null;
  referenceType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationRepository extends BaseRepository<NotificationRecord, NotificationFilterDTO> {
  constructor() {
    super(prisma, prisma.notification);
  }
  
  protected buildFilterConditions(filters: NotificationFilterDTO): any {
    const { type, read, userId } = filters;
    
    const builder = new QueryBuilder();
    
    if (userId) {
      builder.addFilter('userId', Number(userId));
    }
    
    if (type) {
      builder.addFilter('type', type);
    }
    
    if (read !== undefined) {
      const readValue = read === 'true' || read === true;
      builder.addFilter('read', readValue);
    }
    
    return builder.build();
  }
  
  async getUserNotifications(userId: number, options: { limit?: number, unreadOnly?: boolean } = {}): Promise<any> {
    const { limit = 10, unreadOnly = false } = options;
    
    const where: any = { userId };
    
    if (unreadOnly) {
      where.read = false;
    }
    
    return this.model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
  
  async countUnreadNotifications(userId: number): Promise<number> {
    return this.model.count({
      where: {
        userId,
        read: false
      }
    });
  }
  
  async markAsRead(userId: number, notificationId?: number): Promise<number> {
    const where: any = {
      userId,
      read: false
    };
    
    if (notificationId) {
      where.id = notificationId;
    }
    
    const result = await this.model.updateMany({
      where,
      data: {
        read: true,
        updatedAt: new Date()
      }
    });
    
    return result.count;
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
