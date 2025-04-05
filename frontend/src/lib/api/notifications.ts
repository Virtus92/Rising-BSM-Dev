import { get, put, ApiResponse } from './config';

export interface Notification {
  id: number;
  userId?: number;
  type: 'anfrage' | 'termin' | 'projekt' | 'warnung' | 'system' | 'info';
  title: string;
  message?: string;
  icon?: string;
  referenceId?: number | null;
  referenceType?: 'kunde' | 'projekt' | 'termin' | 'anfrage' | 'system' | null;
  read: boolean;
  time: string;
  timestamp: string;
  link?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface NotificationCountResponse {
  total: number;
  unread: number;
  byType: {
    anfrage: number;
    termin: number;
    projekt: number;
    warnung: number;
    system: number;
    info: number;
  };
}

/**
 * Get notifications for the current user
 */
export const getNotifications = async (): Promise<ApiResponse<NotificationsResponse>> => {
  return get<NotificationsResponse>('/notifications', true);
};

/**
 * Mark notification as read
 * @param notificationId ID of the notification to mark as read
 */
export const markNotificationAsRead = async (notificationId: number): Promise<ApiResponse<{ count: number }>> => {
  return put<{ count: number }>('/notifications/read', { notificationId }, true);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<ApiResponse<{ count: number }>> => {
  return put<{ count: number }>('/notifications/read', { markAll: true }, true);
};
