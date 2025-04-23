import { BaseResponseDto, BaseFilterParamsDto } from './BaseDto';
import { NotificationType } from '../enums/CommonEnums';

/**
 * DTO für eine Benachrichtigung
 */
export interface NotificationResponseDto extends BaseResponseDto {
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
   * Benachrichtigungsinhalt (falls 'message' nicht verfügbar ist)
   */
  content: string;
  
  /**
   * Typ der Benachrichtigung
   */
  type: NotificationType;
  
  /**
   * Ob die Benachrichtigung gelesen wurde
   */
  isRead: boolean;
  
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
  
  /**
   * Formatiertes Datum
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
 * Filterparameter für Benachrichtigungen
 */
export interface NotificationFilterParamsDto extends BaseFilterParamsDto {
  /**
   * Benutzer-ID
   */
  userId?: number;
  
  /**
   * Benachrichtigungstyp
   */
  type?: NotificationType;
  
  /**
   * Ob nur ungelesene Benachrichtigungen abgerufen werden sollen
   */
  unreadOnly?: boolean;
}
