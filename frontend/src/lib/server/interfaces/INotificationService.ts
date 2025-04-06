/**
 * Interface für den Notification-Service
 */
export interface INotificationService {
  /**
   * Erstellt eine neue Benachrichtigung für einen Benutzer
   */
  createForUser(userId: number, data: {
    title: string;
    message: string;
    type: string;
    referenceId?: number;
    referenceType?: string;
    description?: string;
  }): Promise<any>;

  /**
   * Erstellt Benachrichtigungen für mehrere Benutzer
   */
  createForUsers(userIds: number[], data: {
    title: string;
    message: string;
    type: string;
    referenceId?: number;
    referenceType?: string;
    description?: string;
  }): Promise<any[]>;

  /**
   * Erstellt eine System-Benachrichtigung für alle Benutzer
   */
  createSystemNotification(data: {
    title: string;
    message: string;
    type: string;
    description?: string;
  }, roles?: string[]): Promise<number>;

  /**
   * Holt eine Benachrichtigung anhand ihrer ID
   */
  findById(id: number): Promise<any | null>;

  /**
   * Holt alle Benachrichtigungen für einen Benutzer
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
   * Erstellt eine Benachrichtigung für ein Projekt
   */
  createProjectNotification(projectId: number, title: string, message: string, createdBy?: number): Promise<any>;

  /**
   * Erstellt eine Benachrichtigung für einen Termin
   */
  createAppointmentNotification(appointmentId: number, title: string, message: string, createdBy?: number): Promise<any>;

  /**
   * Validiert Benachrichtigungsdaten
   */
  validateNotificationData(data: any): { isValid: boolean; errors?: any };
}
