/**
 * Interface für das Notification-Repository
 */
export interface INotificationRepository {
  /**
   * Erstellt eine neue Benachrichtigung
   */
  create(data: any): Promise<any>;

  /**
   * Findet eine Benachrichtigung anhand ihrer ID
   */
  findById(id: number): Promise<any | null>;

  /**
   * Findet alle Benachrichtigungen für einen Benutzer
   */
  findByUser(userId: number, options?: {
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    notifications: any[];
    total: number;
  }>;

  /**
   * Markiert Benachrichtigungen als gelesen
   */
  markAsRead(ids: number[]): Promise<number>;

  /**
   * Markiert alle Benachrichtigungen eines Benutzers als gelesen
   */
  markAllAsRead(userId: number): Promise<number>;

  /**
   * Löscht Benachrichtigungen
   */
  delete(ids: number[]): Promise<number>;

  /**
   * Löscht alle Benachrichtigungen eines Benutzers
   */
  deleteAll(userId: number): Promise<number>;

  /**
   * Zählt ungelesene Benachrichtigungen eines Benutzers
   */
  countUnread(userId: number): Promise<number>;

  /**
   * Erstellt System-Benachrichtigungen für alle Benutzer mit bestimmten Rollen
   */
  createSystemNotifications(data: any, roles?: string[]): Promise<number>;
}
