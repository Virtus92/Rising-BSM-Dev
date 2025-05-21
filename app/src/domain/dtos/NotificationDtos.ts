import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';
import { NotificationType } from '../enums/CommonEnums';

/**
 * DTO for a notification response
 */
export interface NotificationResponseDto extends BaseResponseDto {
  /**
   * User ID of the recipient
   */
  userId: number;
  
  /**
   * Title of the notification
   */
  title: string;
  
  /**
   * Message content of the notification
   */
  message: string;
  
  /**
   * Type of the notification
   */
  type: NotificationType;
  
  /**
   * Whether the notification has been read
   */
  isRead: boolean;
  
  /**
   * Referenced customer ID
   */
  customerId?: number;
  
  /**
   * Referenced appointment ID
   */
  appointmentId?: number;
  
  /**
   * Referenced contact request ID
   */
  contactRequestId?: number;
  
  /**
   * Optional link for further actions
   */
  link?: string;
  
  /**
   * Formatted date for display
   */
  formattedDate?: string;
}

/**
 * DTO zum Erstellen einer Benachrichtigung
 */
export interface CreateNotificationDto {
  /**
   * Benutzer-ID des Empfängers
   */
  userId: number;
  
  /**
   * Titel der Benachrichtigung
   */
  title: string;
  
  /**
   * Nachrichtentext
   */
  message: string;
  
  /**
   * Typ der Benachrichtigung
   */
  type: NotificationType;
  
  /**
   * ID des referenzierten Kunden
   */
  customerId?: number;
  
  /**
   * ID des referenzierten Termins
   */
  appointmentId?: number;
  
  /**
   * ID der referenzierten Kontaktanfrage
   */
  contactRequestId?: number;
  
  /**
   * Optionaler Link für weitere Aktionen
   */
  link?: string;
}

/**
 * DTO zum Aktualisieren einer Benachrichtigung
 */
export interface UpdateNotificationDto {
  /**
   * Titel der Benachrichtigung
   */
  title?: string;
  
  /**
   * Nachrichtentext
   */
  message?: string;
  
  /**
   * Ob die Benachrichtigung gelesen wurde
   */
  isRead?: boolean;
}

/**
 * Antwort-DTO für das Markieren aller Benachrichtigungen als gelesen
 */
export interface ReadAllNotificationsResponseDto {
  /**
   * Anzahl der markierten Benachrichtigungen
   */
  count: number;
}

/**
 * Antwort-DTO für das Löschen einer Benachrichtigung
 */
export interface DeleteNotificationResponseDto {
  /**
   * Erfolgsstatus
   */
  success: boolean;
}

/**
 * Antwort-DTO für das Löschen aller Benachrichtigungen
 */
export interface DeleteAllNotificationsResponseDto {
  /**
   * Anzahl der gelöschten Benachrichtigungen
   */
  count: number;
}

/**
 * Filter parameters for notifications
 */
export interface NotificationFilterParamsDto extends BaseFilterParamsDto {
  /**
   * User ID
   */
  userId?: number;
  
  /**
   * Notification type
   */
  type?: NotificationType;
  
  /**
   * Whether to retrieve only unread notifications
   */
  unreadOnly?: boolean;
  
  /**
   * Cursor for pagination (typically the ID of the last item in previous page)
   */
  cursor?: string;
  
  /**
   * Direction of sorting: 'asc' or 'desc'
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * Field to sort by
   */
  sortField?: string;
}
