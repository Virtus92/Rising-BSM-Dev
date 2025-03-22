import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../utils/base.repository';
import { QueryBuilder } from '../utils/query-builder';
import { FilterOptions } from '../types/controller-types';
import { NotificationRecord } from '../types/models';
import { prisma } from '../utils/prisma.utils';

export class NotificationRepository extends BaseRepository<NotificationRecord> {
  constructor() {
    super(prisma, prisma.notification);
  }
  
  protected buildFilterConditions(filters: FilterOptions): any {
    const { type, read } = filters;
    
    const builder = new QueryBuilder();
    
    if (type) {
      builder.addFilter('type', type);
    }
    
    if (read !== undefined) {
      builder.addFilter('read', read === 'true' || read === true);
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
