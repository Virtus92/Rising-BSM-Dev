import { IBaseService, ServiceOptions } from './IBaseService';
import { Notification } from '../entities/Notification';
import { 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  NotificationResponseDto,
  NotificationFilterParamsDto,
  ReadAllNotificationsResponseDto,
  DeleteAllNotificationsResponseDto
} from '../dtos/NotificationDtos';
import { PaginationResult } from '../repositories/IBaseRepository';
import { NotificationType } from '../enums/CommonEnums';

/**
 * Service-Interface für Benachrichtigungen
 */
export interface INotificationService extends IBaseService<
  Notification, 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  NotificationResponseDto
> {
  /**
   * Findet Benachrichtigungen für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param unreadOnly - Nur ungelesene Benachrichtigungen
   * @param limit - Maximale Anzahl der Ergebnisse
   * @param options - Service-Optionen
   * @returns Benachrichtigungen
   */
  findByUser(
    userId: number, 
    unreadOnly?: boolean, 
    limit?: number, 
    options?: ServiceOptions
  ): Promise<NotificationResponseDto[]>;
  
  /**
   * Markiert eine Benachrichtigung als gelesen
   * 
   * @param id - Benachrichtigungs-ID
   * @param options - Service-Optionen
   * @returns Aktualisierte Benachrichtigung
   */
  markAsRead(id: number, options?: ServiceOptions): Promise<NotificationResponseDto>;
  
  /**
   * Markiert alle Benachrichtigungen eines Benutzers als gelesen
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Ergebnis der Operation
   */
  markAllAsRead(userId: number, options?: ServiceOptions): Promise<ReadAllNotificationsResponseDto>;
  
  /**
   * Löscht alle Benachrichtigungen eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Ergebnis der Operation
   */
  deleteAllForUser(userId: number, options?: ServiceOptions): Promise<DeleteAllNotificationsResponseDto>;
  
  /**
   * Zählt ungelesene Benachrichtigungen für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param options - Service-Optionen
   * @returns Anzahl ungelesener Benachrichtigungen
   */
  countUnread(userId: number, options?: ServiceOptions): Promise<number>;
  
  /**
   * Erstellt eine Benachrichtigung
   * 
   * @param data - Benachrichtigungsdaten
   * @param options - Service-Optionen
   * @returns Erstellte Benachrichtigung
   */
  createNotification(data: CreateNotificationDto, options?: ServiceOptions): Promise<NotificationResponseDto>;
  
  /**
   * Erstellt Benachrichtigungen für mehrere Benutzer
   * 
   * @param userIds - Benutzer-IDs
   * @param title - Titel
   * @param message - Nachricht
   * @param type - Typ
   * @param referenceData - Referenzdaten
   * @param options - Service-Optionen
   * @returns Erstellte Benachrichtigungen
   */
  createNotificationForMultipleUsers(
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
  ): Promise<NotificationResponseDto[]>;
  
  /**
   * Findet Benachrichtigungen mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @param options - Service-Optionen
   * @returns Gefundene Benachrichtigungen mit Paginierung
   */
  findNotifications(
    filters: NotificationFilterParamsDto, 
    options?: ServiceOptions
  ): Promise<PaginationResult<NotificationResponseDto>>;
  
  /**
   * Bereinigt alte Benachrichtigungen
   * 
   * @param olderThan - Datum, vor dem Benachrichtigungen gelöscht werden sollen
   * @param options - Service-Optionen
   * @returns Anzahl der gelöschten Benachrichtigungen
   */
  cleanupOldNotifications(olderThan: Date, options?: ServiceOptions): Promise<number>;
}