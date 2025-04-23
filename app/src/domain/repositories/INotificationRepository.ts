import { IBaseRepository, PaginationResult } from './IBaseRepository';
import { Notification } from '../entities/Notification';
import { NotificationFilterParamsDto } from '../dtos/NotificationDtos';

/**
 * Repository-Interface für Benachrichtigungen
 */
export interface INotificationRepository extends IBaseRepository<Notification> {
  /**
   * Findet Benachrichtigungen für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @param unreadOnly - Nur ungelesene Benachrichtigungen
   * @param limit - Maximale Anzahl der Ergebnisse
   * @returns Benachrichtigungen
   */
  findByUser(userId: number, unreadOnly?: boolean, limit?: number): Promise<Notification[]>;
  
  /**
   * Findet Benachrichtigungen mit erweiterten Filteroptionen
   * 
   * @param filters - Filterparameter
   * @returns Gefundene Benachrichtigungen mit Paginierung
   */
  findNotifications(filters: NotificationFilterParamsDto): Promise<PaginationResult<Notification>>;
  
  /**
   * Markiert eine Benachrichtigung als gelesen
   * 
   * @param id - Benachrichtigungs-ID
   * @returns Aktualisierte Benachrichtigung
   */
  markAsRead(id: number): Promise<Notification>;
  
  /**
   * Markiert alle Benachrichtigungen eines Benutzers als gelesen
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl der aktualisierten Benachrichtigungen
   */
  markAllAsRead(userId: number): Promise<number>;
  
  /**
   * Löscht alle Benachrichtigungen eines Benutzers
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl der gelöschten Benachrichtigungen
   */
  deleteAllForUser(userId: number): Promise<number>;
  
  /**
   * Löscht alte Benachrichtigungen
   * 
   * @param olderThan - Datum, vor dem Benachrichtigungen gelöscht werden sollen
   * @returns Anzahl der gelöschten Benachrichtigungen
   */
  deleteOldNotifications(olderThan: Date): Promise<number>;
  
  /**
   * Zählt ungelesene Benachrichtigungen für einen Benutzer
   * 
   * @param userId - Benutzer-ID
   * @returns Anzahl ungelesener Benachrichtigungen
   */
  countUnread(userId: number): Promise<number>;
  
  /**
   * Erstellt Benachrichtigungen für mehrere Benutzer
   * 
   * @param userIds - Benutzer-IDs
   * @param data - Benachrichtigungsdaten
   * @returns Erstellte Benachrichtigungen
   */
  createForMultipleUsers(
    userIds: number[], 
    data: Partial<Notification>
  ): Promise<Notification[]>;
}