/**
 * Notification-related DTOs
 */
export interface NotificationResponseDto {
  id: number;
  title: string;
  message: string;
  type: string;
  icon: string;
  read: boolean;
  time: string;
  timestamp: Date;
  link: string;
}

export interface MarkNotificationReadDto {
  notificationId?: number;
  markAll?: boolean;
}
