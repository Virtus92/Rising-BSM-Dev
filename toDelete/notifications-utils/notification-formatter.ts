import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { NotificationType } from '@/domain/enums/CommonEnums';
import { formatDistance } from 'date-fns';

/**
 * Format a notification's time relative to current time
 * 
 * @param notification The notification to format
 * @returns Formatted time string (e.g., "2 hours ago")
 */
export function formatNotificationTime(notification: NotificationResponseDto): string {
  return formatDistance(
    new Date(notification.createdAt),
    new Date(),
    { addSuffix: true }
  );
}

/**
 * Get the appropriate icon name for a notification type
 * 
 * @param type The notification type
 * @returns Icon name for Lucide icons
 */
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.APPOINTMENT:
      return 'calendar';
    case NotificationType.MESSAGE:
      return 'message-square';
    case NotificationType.ALERT:
      return 'alert-circle';
    case NotificationType.INFO:
      return 'info';
    case NotificationType.SUCCESS:
      return 'check-circle';
    case NotificationType.WARNING:
      return 'alert-triangle';
    case NotificationType.ERROR:
      return 'x-circle';
    case NotificationType.SYSTEM:
      return 'cpu';
    case NotificationType.REQUEST:
      return 'file-text';
    case NotificationType.TASK:
      return 'check-square';
    default:
      return 'bell';
  }
}

/**
 * Get the appropriate color for a notification type
 * 
 * @param type The notification type
 * @returns Tailwind color class
 */
export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case NotificationType.APPOINTMENT:
      return 'text-blue-500';
    case NotificationType.MESSAGE:
      return 'text-purple-500';
    case NotificationType.ALERT:
      return 'text-amber-500';
    case NotificationType.INFO:
      return 'text-blue-500';
    case NotificationType.SUCCESS:
      return 'text-green-500';
    case NotificationType.WARNING:
      return 'text-amber-500';
    case NotificationType.ERROR:
      return 'text-red-500';
    case NotificationType.SYSTEM:
      return 'text-gray-500';
    case NotificationType.REQUEST:
      return 'text-indigo-500';
    case NotificationType.TASK:
      return 'text-emerald-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Create a summarized notification title
 * 
 * @param notification The notification
 * @returns Summarized title
 */
export function getNotificationTitle(notification: NotificationResponseDto): string {
  // If there's already a title, use it
  if (notification.title) {
    return notification.title;
  }
  
  // Otherwise, generate a title based on the type
  switch (notification.type) {
    case NotificationType.APPOINTMENT:
      return 'New Appointment';
    case NotificationType.MESSAGE:
      return 'New Message';
    case NotificationType.ALERT:
      return 'Alert';
    case NotificationType.INFO:
      return 'Information';
    case NotificationType.SUCCESS:
      return 'Success';
    case NotificationType.WARNING:
      return 'Warning';
    case NotificationType.ERROR:
      return 'Error';
    case NotificationType.SYSTEM:
      return 'System Notification';
    case NotificationType.REQUEST:
      return 'New Request';
    case NotificationType.TASK:
      return 'Task Update';
    default:
      return 'Notification';
  }
}