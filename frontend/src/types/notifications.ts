/**
 * Notification-related interfaces
 */

export type NotificationType = 'anfrage' | 'termin' | 'projekt' | 'warnung' | 'system' | 'info';
export type ReferenceType = 'kunde' | 'projekt' | 'termin' | 'anfrage' | 'system';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  referenceId: number | null;
  referenceType: ReferenceType | null;
  read: boolean;
  time: string; // Relative time (e.g., "2 hours ago")
  timestamp: string; // ISO date string
  link: string;
}

export interface NotificationCreate {
  userId?: number;
  type: NotificationType;
  title: string;
  message?: string;
  referenceId?: number | null;
  referenceType?: ReferenceType | null;
}

export interface MarkNotificationReadRequest {
  notificationId?: number;
  markAll?: boolean;
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
  }
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface MarkNotificationsReadResponse {
  count: number;
}
