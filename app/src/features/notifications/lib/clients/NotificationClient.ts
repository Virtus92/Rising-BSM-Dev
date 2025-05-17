/**
 * API-Client for notification management
 */
import { 
  NotificationResponseDto, 
  NotificationFilterParamsDto, 
  CreateNotificationDto,
  UpdateNotificationDto
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
   * @param options - Request options like signal for AbortController
   * @returns API response
   */
  static async getNotifications(
    params: Record<string, any> = {}, 
    options: { signal?: AbortSignal } = {}
  ): Promise<ApiResponse<any>> {
    try {
      // Pass both params and any options (like AbortController signal) to the API Client
      return await ApiClient.get(NOTIFICATIONS_API_URL, { 
        params, 
        headers: options.signal ? { 'X-Request-ID': `notifications-${Date.now()}` } : undefined,
        signal: options.signal
      });
    } catch (error: unknown) {
      // Don't throw for aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Notification request was aborted intentionally');
        return {
          success: false,
          data: [],
          error: error instanceof Error ? error.message : 'Request aborted',
          message: 'Request aborted',
          statusCode: 499 // Nginx's status code for client closed request
        };
      }
      
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

  /**
   * Gets unread notification count for a specific user
   * 
   * @param userId - User ID
   * @returns API response
   */
  static async getUnreadCountForUser(userId: number): Promise<ApiResponse<number>> {
    try {
      return await ApiClient.get(`${NOTIFICATIONS_API_URL}/unread-count`, { params: { userId } });
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to get unread notification count',
        500
      );
    }
  }

  /**
   * Updates a notification
   * 
   * @param id - Notification ID
   * @param data - Update data
   * @returns API response
   */
  static async updateNotification(id: number | string, data: UpdateNotificationDto): Promise<ApiResponse<NotificationResponseDto>> {
    try {
      const validatedId = validateId(id);
      if (validatedId === null) {
        throw new ApiRequestError('Invalid notification ID format', 400);
      }
      return await ApiClient.put(`${NOTIFICATIONS_API_URL}/${validatedId}`, data);
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : `Failed to update notification with ID ${id}`,
        500
      );
    }
  }

  /**
   * Marks all notifications as read for a specific user
   * 
   * @param userId - User ID
   * @returns API response
   */
  static async markAllAsReadForUser(userId: number): Promise<ApiResponse<{ count: number }>> {
    try {
      return await ApiClient.post(`${NOTIFICATIONS_API_URL}/read-all`, { userId });
    } catch (error: unknown) {
      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Failed to mark all notifications as read',
        500
      );
    }
  }
}

export default NotificationClient;