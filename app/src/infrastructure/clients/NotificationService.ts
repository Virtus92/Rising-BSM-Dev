'use client';

import { 
  NotificationResponseDto,
  NotificationFilterParamsDto,
  CreateNotificationDto
} from '@/domain/dtos/NotificationDtos';
import { NotificationClient } from '@/infrastructure/api/NotificationClient';

/**
 * Service for managing notifications
 * Acts as a wrapper around the NotificationClient with additional functionality
 */
export class NotificationService {
  /**
   * Get notifications with filtering and pagination
   */
  static async getNotifications(filters: NotificationFilterParamsDto = {}) {
    try {
      // Map filters to client parameters, removing undefined and null values
      const clientParams: any = {};
      
      // Only include defined parameters
      if (filters.page !== undefined) clientParams.page = filters.page;
      if (filters.limit !== undefined) clientParams.limit = filters.limit;
      if (filters.unreadOnly !== undefined) clientParams.unreadOnly = filters.unreadOnly;
      if (filters.search !== undefined && filters.search !== '') clientParams.search = filters.search;
      if (filters.sortBy !== undefined) clientParams.sortBy = filters.sortBy;
      if (filters.sortDirection !== undefined) clientParams.sortDirection = filters.sortDirection;
      
      // Make API call
      return await NotificationClient.getNotifications(clientParams);
    } catch (error) {
      console.error('Error in NotificationService.getNotifications:', error);
      
      // Return formatted error with empty data structure that matches the expected interface
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
        data: {
          data: [],
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0
          }
        }
      };
    }
  }

  /**
   * Get a single notification by ID
   */
  static async getNotification(id: number) {
    return await NotificationClient.getNotification(id);
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: number) {
    return await NotificationClient.markNotificationAsRead(id);
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead() {
    return await NotificationClient.markAllNotificationsAsRead();
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(id: number) {
    return await NotificationClient.deleteNotification(id);
  }

  /**
   * Delete all notifications
   */
  static async deleteAllNotifications() {
    return await NotificationClient.deleteAllNotifications();
  }

  /**
   * Create a notification
   */
  static async createNotification(notification: CreateNotificationDto) {
    return await NotificationClient.createNotification(notification);
  }
}
