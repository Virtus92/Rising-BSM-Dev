/**
 * API-Client for notification management
 */
import { 
  NotificationResponseDto, 
  NotificationFilterParamsDto, 
  CreateNotificationDto
} from '@/domain/dtos/NotificationDtos';
import ApiClient, { ApiResponse, ApiRequestError } from '@/core/api/ApiClient';
import { validateId } from '@/shared/utils/validation-utils';

// API base URL for notifications
const NOTIFICATIONS_API_URL = '/notifications';

/**
 * Client for notification API requests
 */
export class NotificationClient {
  /**
   * Gets all notifications with optional filtering
   * 
   * @param params - Optional filter parameters
   * @returns API response
   */
  static async getNotifications(params: NotificationFilterParamsDto = {}): Promise<ApiResponse<NotificationResponseDto[]>> {
    try {
      return await ApiClient.get(NOTIFICATIONS_API_URL, { params });
    } catch (error: unknown) {
      console.error('Failed to fetch notifications:', error as Error);
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to fetch notifications',
        500
      );
    }
  }

  /**
   * Gets a notification by ID
   * 
   * @param id - Notification ID
   * @returns API response
   */
  static async getNotificationById(id: number | string): Promise<ApiResponse<NotificationResponseDto>> {
    try {
      // Use the validateId utility function for consistent ID validation
      const validatedId = validateId(id);
      
      // Check if ID is valid
      if (validatedId === null) {
        throw new ApiRequestError('Invalid notification ID format - must be a positive number', 400);
      }
      
      return await ApiClient.get(`${NOTIFICATIONS_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to fetch notification with ID ${id}`,
        500
      );
    }
  }

  /**
   * Creates a new notification
   * 
   * @param data - Notification data
   * @returns API response
   */
  static async createNotification(data: CreateNotificationDto): Promise<ApiResponse<NotificationResponseDto>> {
    try {
      return await ApiClient.post(NOTIFICATIONS_API_URL, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to create notification',
        500
      );
    }
  }

  /**
   * Marks a notification as read
   * 
   * @param id - Notification ID
   * @returns API response
   */
  static async markAsRead(id: number | string): Promise<ApiResponse<NotificationResponseDto>> {
    try {
      // Use the validateId utility function for consistent ID validation
      const validatedId = validateId(id);
      
      // Check if ID is valid
      if (validatedId === null) {
        throw new ApiRequestError('Invalid notification ID format - must be a positive number', 400);
      }
      
      return await ApiClient.put(`${NOTIFICATIONS_API_URL}/${validatedId}/read`, {});
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to mark notification with ID ${id} as read`,
        500
      );
    }
  }

  /**
   * Marks all notifications as read
   * 
   * @returns API response
   */
  static async markAllAsRead(): Promise<ApiResponse<void>> {
    try {
      return await ApiClient.put(`${NOTIFICATIONS_API_URL}/mark-all-read`, {});
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to mark all notifications as read',
        500
      );
    }
  }

  /**
   * Deletes a notification
   * 
   * @param id - Notification ID
   * @returns API response
   */
  static async deleteNotification(id: number | string): Promise<ApiResponse<void>> {
    try {
      // Use the validateId utility function for consistent ID validation
      const validatedId = validateId(id);
      
      // Check if ID is valid
      if (validatedId === null) {
        throw new ApiRequestError('Invalid notification ID format - must be a positive number', 400);
      }
      
      return await ApiClient.delete(`${NOTIFICATIONS_API_URL}/${validatedId}`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to delete notification with ID ${id}`,
        500
      );
    }
  }

  /**
   * Gets unread notification count
   * 
   * @returns API response
   */
  static async getUnreadCount(): Promise<ApiResponse<number>> {
    try {
      return await ApiClient.get(`${NOTIFICATIONS_API_URL}/unread-count`);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to get unread notification count',
        500
      );
    }
  }
}

export default NotificationClient;