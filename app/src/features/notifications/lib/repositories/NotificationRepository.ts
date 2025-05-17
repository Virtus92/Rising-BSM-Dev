 /**
 * Notification Repository
 * Client-side repository for notification management
 */
import { INotificationRepository } from '@/domain/repositories/INotificationRepository';
import { Notification } from '@/domain/entities/Notification';
import { NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import { ServiceOptions } from '@/domain/services/IBaseService';
import NotificationClient from '../clients/NotificationClient';
import { CreateNotificationDto } from '@/domain/dtos/NotificationDtos';
import { NotificationType } from '@/domain';

export class NotificationRepository implements INotificationRepository {
   /**
   * Helper method to convert DTO to domain entity
   */
  private convertToEntity(dto: any): Notification {
    if (!dto) return new Notification();
    
    // Map DTO properties to entity properties
    return new Notification({
      id: dto.id,
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message || dto.content,
      isRead: dto.isRead,
      customerId: dto.customerId,
      appointmentId: dto.appointmentId,
      contactRequestId: dto.contactRequestId,
      link: dto.link,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy
    });
  }
  /**
   * Find one by criteria
   */
  async findOneByCriteria(criteria: Record<string, any>): Promise<Notification | null> {
    try {
      const response = await NotificationClient.getNotifications({
        ...criteria,
        limit: 1
      });
      return response.data?.data?.[0] ? this.convertToEntity(response.data.data[0]) : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Find by ID
   */
  async findById(id: number): Promise<Notification | null> {
    try {
      const response = await NotificationClient.getNotificationById(id);
      return response.data ? this.convertToEntity(response.data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find all with pagination
   */
  async findAll(params: Record<string, any>): Promise<PaginationResult<Notification>> {
    const response = await NotificationClient.getNotifications(params);
    if (!response.data) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
    const data = response.data;
    return {
      data: data.data.map((item: any) => this.convertToEntity(item)),
      pagination: data.pagination
    };
  }

  /**
   * Create a notification
   */
  async create(entity: Partial<Notification>): Promise<Notification> {
    // Convert the Notification entity to CreateNotificationDto
    const createDto: CreateNotificationDto = {
      userId: entity.userId || 0,
      title: entity.title || '',
      message: entity.message || '',
      type: entity.type || NotificationType.INFO,
      customerId: entity.customerId,
      appointmentId: entity.appointmentId,
      contactRequestId: entity.contactRequestId,
      link: entity.link
    };
    
    const response = await NotificationClient.createNotification(createDto);
    return response.data ? this.convertToEntity(response.data) : new Notification();
  } 

  /**
   * Update a notification
   */
  async update(id: number, entity: Partial<Notification>): Promise<Notification> {
    const response = await NotificationClient.updateNotification(id, entity);
    return response.data ? this.convertToEntity(response.data) : new Notification();
  }

  /**
   * Delete a notification
   */
  async delete(id: number): Promise<boolean> {
    const response = await NotificationClient.deleteNotification(id);
    return response.success;
  }

  /**
   * Find by user
   */
  async findByUser(userId: number, unreadOnly?: boolean, limit?: number): Promise<Notification[]> {
    const response = await NotificationClient.getNotifications({
      userId,
      unreadOnly,
      limit
    });
    if (!response.data || !('data' in response.data)) {
      return [];
    }
    return response.data.data.map((item: any) => this.convertToEntity(item));
  }

  /**
   * Mark as read
   */
  async markAsRead(id: number): Promise<Notification> {
    const response = await NotificationClient.markAsRead(id);
    return response.data ? this.convertToEntity(response.data) : new Notification();
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: number): Promise<number> {
    const response = await NotificationClient.markAllAsReadForUser(userId);
    return (response.data && typeof response.data === 'object' && 'count' in response.data) ? response.data.count : 0;
  }

  /**
   * Delete all for user
   */
  async deleteAllForUser(userId: number): Promise<number> {
    // Implement if needed
    throw new Error('Not implemented on client side');
  }

  /**
   * Count unread
   */
  async countUnread(userId: number): Promise<number> {
    const response = await NotificationClient.getUnreadCountForUser(userId);
    return response.data ?? 0;
  }

  /**
   * Create for multiple users
   */
  async createForMultipleUsers(userIds: number[], notificationData: Partial<Notification>): Promise<Notification[]> {
    // Implement if needed
    throw new Error('Not implemented on client side');
  }

  /**
   * Find notifications with filtering
   */
  async findNotifications(filters: NotificationFilterParamsDto): Promise<PaginationResult<Notification>> {
    const response = await NotificationClient.getNotifications(filters);
    if (!response.data) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
    const data = response.data;
    return {
      data: data.data.map((item: any) => this.convertToEntity(item)),
      pagination: data.pagination
    };
  }

  /**
   * Delete old notifications
   */
  async deleteOldNotifications(olderThan: Date): Promise<number> {
    // Implement if needed
    throw new Error('Not implemented on client side');
  }

  /**
   * Find by criteria
   */
  async findByCriteria(criteria: Record<string, any>): Promise<Notification[]> {
    const response = await NotificationClient.getNotifications(criteria);
    if (!response.data || !('data' in response.data)) {
      return [];
    }
    return response.data.data.map((item: any) => this.convertToEntity(item));
  }

  /**
   * Count notifications
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    // Simulate count by fetching minimal data
    const response = await NotificationClient.getNotifications({
      ...criteria,
      limit: 1
    });
    if (!response.data || !('pagination' in response.data)) {
      return 0;
    }
    return response.data.pagination?.total || 0;
  }

  /**
   * Check if exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const notification = await this.findById(id);
      return notification !== null;
    } catch {
      return false;
    }
  }

  /**
   * Check if exists by criteria
   */
  async existsByCriteria(criteria: Record<string, any>): Promise<boolean> {
    const count = await this.count(criteria);
    return count > 0;
  }

  /**
   * Search notifications
   */
  async search(params: { term: string; filters?: Record<string, any> }): Promise<Notification[]> {
    const response = await NotificationClient.getNotifications({
      search: params.term,
      ...params.filters
    });
    if (!response.data || !('data' in response.data)) {
      return [];
    }
    return response.data.data.map((item: any) => this.convertToEntity(item));
  }

  /**
   * Bulk update notifications
   */
  async bulkUpdate(ids: number[], data: Partial<Notification>): Promise<number> {
    // Not supported on client side
    throw new Error('Bulk update not supported on client side');
  }

  /**
   * Save a notification
   */
  async save(entity: Notification): Promise<Notification> {
    if (entity.id) {
      return this.update(entity.id, entity);
    }
    return this.create(entity);
  }

  /**
   * Execute within transaction
   */
  async transaction<T>(work: (repository: INotificationRepository) => Promise<T>): Promise<T> {
    // Transactions are handled server-side
    return work(this);
  }
}

export default NotificationRepository;
