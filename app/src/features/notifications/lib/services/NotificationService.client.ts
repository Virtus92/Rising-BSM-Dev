'use client';

import { INotificationService } from '@/domain/services/INotificationService';
import { 
  NotificationResponseDto,
  NotificationFilterParamsDto,
  CreateNotificationDto,
  UpdateNotificationDto,
  ReadAllNotificationsResponseDto,
  DeleteAllNotificationsResponseDto
} from '@/domain/dtos/NotificationDtos';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { ServiceOptions } from '@/domain/services/IBaseService';
import { PaginationResult } from '@/domain/repositories/IBaseRepository';
import NotificationClient from '../clients/NotificationClient';

/**
 * Client-side implementation of the NotificationService
 * This service communicates with the API through NotificationClient
 */
export class NotificationService implements INotificationService {
  /**
   * Constructor
   */
  constructor() {
    // Client-side implementation has no dependencies to inject
  }

  /**
   * Find notifications for a user
   */
  async findByUser(
    userId: number, 
    unreadOnly?: boolean, 
    limit?: number, 
    options?: ServiceOptions
  ): Promise<NotificationResponseDto[]> {
    try {
      const response = await NotificationClient.getNotifications({
        userId,
        unreadOnly: unreadOnly || false,
        limit: limit || 10
      });
      
      if (!response.data || !response.success) {
        return [];
      }
      
      const data = Array.isArray(response.data) ? response.data : 
                  (response.data.data || []);
      
      return data;
    } catch (error) {
      console.error('Error finding notifications for user:', error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      const response = await NotificationClient.markAsRead(id);
      
      if (!response.data || !response.success) {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: number, options?: ServiceOptions): Promise<ReadAllNotificationsResponseDto> {
    try {
      const response = await NotificationClient.markAllAsReadForUser(userId);
      
      if (!response.data || !response.success) {
        throw new Error(response.message || 'Failed to mark all notifications as read');
      }
      
      return { 
        count: response.data.count || 0
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllForUser(userId: number, options?: ServiceOptions): Promise<DeleteAllNotificationsResponseDto> {
    try {
      const response = await NotificationClient.getNotifications({
        userId,
        page: 1,
        limit: 1
      });
      
      return { 
        count: 0 // Client-side implementation can't do this operation
      };
    } catch (error) {
      console.error('Error deleting all notifications for user:', error);
      throw error;
    }
  }

  /**
   * Count unread notifications for a user
   */
  async countUnread(userId: number, options?: ServiceOptions): Promise<number> {
    try {
      const response = await NotificationClient.getUnreadCountForUser(userId);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to count unread notifications');
      }
      
      return response.data || 0;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      const response = await NotificationClient.createNotification(data);
      
      if (!response.data || !response.success) {
        throw new Error(response.message || 'Failed to create notification');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createNotificationForMultipleUsers(
    userIds: number[],
    title: string,
    message: string,
    type: NotificationType,
    referenceData?: {
      customerId?: number;
      appointmentId?: number;
      contactRequestId?: number;
      link?: string;
    },
    options?: ServiceOptions
  ): Promise<NotificationResponseDto[]> {
    try {
      // Client-side implementation can't create notifications for multiple users at once
      // Create individual notifications instead
      const results: NotificationResponseDto[] = [];
      
      for (const userId of userIds) {
        try {
          const notificationData: CreateNotificationDto = {
            userId,
            title,
            message,
            type,
            ...referenceData
          };
          
          const notification = await this.createNotification(notificationData, options);
          results.push(notification);
        } catch (error) {
          console.error(`Failed to create notification for user ${userId}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error creating notifications for multiple users:', error);
      throw error;
    }
  }

  /**
   * Find notifications with filtering
   */
  async findNotifications(filters: NotificationFilterParamsDto, options?: ServiceOptions): Promise<PaginationResult<NotificationResponseDto>> {
    try {
      const response = await NotificationClient.getNotifications(filters);
      
      if (!response.data || !response.success) {
        return {
          data: [],
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0
          }
        };
      }
      
      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: response.data.length,
            totalPages: 1
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error finding notifications:', error);
      return {
        data: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(olderThan: Date, options?: ServiceOptions): Promise<number> {
    // Client-side implementation can't clean up old notifications
    return 0;
  }

  // BaseService methods needed for INotificationService

  /**
   * Get repository instance
   */
  getRepository(): any {
    throw new Error('Repository access not available on client-side');
  }
  
  /**
   * Get all entities with pagination
   */
  async getAll(options?: ServiceOptions): Promise<PaginationResult<NotificationResponseDto>> {
    const userId = options?.context?.userId;
    
    if (!userId) {
      return {
        data: [],
        pagination: {
          page: options?.page || 1,
          limit: options?.limit || 10,
          total: 0,
          totalPages: 0
        }
      };
    }
    
    const filters: NotificationFilterParamsDto = {
      userId,
      page: options?.page || 1,
      limit: options?.limit || 10
    };
    
    return this.findNotifications(filters, options);
  }
  
  /**
   * Get entity by ID
   */
  async getById(id: number, options?: ServiceOptions): Promise<NotificationResponseDto | null> {
    try {
      const response = await NotificationClient.getNotificationById(id);
      
      if (!response.data || !response.success) {
        return null;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      return null;
    }
  }
  
  /**
   * Create entity
   */
  async create(data: CreateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto> {
    return this.createNotification(data, options);
  }
  
  /**
   * Update entity
   */
  async update(id: number, data: UpdateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto> {
    try {
      const response = await NotificationClient.updateNotification(id, data);
      
      if (!response.data || !response.success) {
        throw new Error(response.message || 'Failed to update notification');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }
  
  /**
   * Delete entity
   */
  async delete(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const response = await NotificationClient.deleteNotification(id);
      
      return response.success;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
  
  /**
   * Find entities by criteria
   */
  async findByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<NotificationResponseDto[]> {
    try {
      const response = await NotificationClient.getNotifications(criteria);
      
      if (!response.data || !response.success) {
        return [];
      }
      
      const data = Array.isArray(response.data) ? response.data : 
                  (response.data.data || []);
      
      return data;
    } catch (error) {
      console.error('Error finding notifications by criteria:', error);
      return [];
    }
  }
  
  /**
   * Find all entities
   */
  async findAll(options?: ServiceOptions): Promise<PaginationResult<NotificationResponseDto>> {
    return this.getAll(options);
  }
  
  /**
   * Count entities
   */
  async count(criteria?: Record<string, any>, options?: ServiceOptions): Promise<number> {
    try {
      const response = await NotificationClient.getNotifications({
        ...criteria,
        page: 1,
        limit: 1
      });
      
      if (!response.data || !response.success) {
        return 0;
      }
      
      // If we have pagination info, use total
      if (response.data && typeof response.data === 'object' && 'pagination' in response.data) {
        return response.data.pagination.total;
      }
      
      return 0;
    } catch (error) {
      console.error('Error counting notifications:', error);
      return 0;
    }
  }
  
  /**
   * Check if entity exists
   */
  async exists(id: number, options?: ServiceOptions): Promise<boolean> {
    try {
      const notification = await this.getById(id, options);
      return notification !== null;
    } catch (error) {
      console.error('Error checking if notification exists:', error);
      return false;
    }
  }
  
  /**
   * Check if entities matching criteria exist
   */
  async existsByCriteria(criteria: Record<string, any>, options?: ServiceOptions): Promise<boolean> {
    try {
      const count = await this.count(criteria, options);
      return count > 0;
    } catch (error) {
      console.error('Error checking if notifications exist by criteria:', error);
      return false;
    }
  }
  
  /**
   * Search entities
   */
  async search(term: string, options?: ServiceOptions): Promise<NotificationResponseDto[]> {
    try {
      const response = await NotificationClient.getNotifications({ search: term });
      
      if (!response.data || !response.success) {
        return [];
      }
      
      const data = Array.isArray(response.data) ? response.data : 
                  (response.data.data || []);
      
      return data;
    } catch (error) {
      console.error('Error searching notifications:', error);
      return [];
    }
  }
  
  /**
   * Validate entity
   */
  async validate(data: any, schema?: any): Promise<any> {
    // Client-side validation is minimal
    return { isValid: true, errors: null };
  }
  
  /**
   * Execute transaction
   */
  async transaction<T>(callback: (service: INotificationService) => Promise<T>, context?: any): Promise<T> {
    // Client-side doesn't support transactions
    return callback(this);
  }
  
  /**
   * Bulk update entities
   */
  async bulkUpdate(ids: number[], data: UpdateNotificationDto, options?: ServiceOptions): Promise<number> {
    // Client-side doesn't support bulk updates directly
    let count = 0;
    
    for (const id of ids) {
      try {
        await this.update(id, data, options);
        count++;
      } catch (error) {
        console.error(`Error updating notification ${id}:`, error);
      }
    }
    
    return count;
  }
  
  /**
   * Convert entity to DTO
   */
  toDTO(entity: any): NotificationResponseDto {
    // Client-side doesn't need to convert entities
    return entity as NotificationResponseDto;
  }
  
  /**
   * Convert DTO to entity
   */
  fromDTO(dto: any): any {
    // Client-side doesn't need to convert DTOs
    return dto;
  }
}

// Export default instance for simpler imports
export default NotificationService;
