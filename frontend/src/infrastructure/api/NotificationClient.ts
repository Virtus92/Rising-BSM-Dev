'use client';

/**
 * API-Client für Benachrichtigungen
 */
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { 
  NotificationResponseDto,
  CreateNotificationDto,
  ReadAllNotificationsResponseDto,
  DeleteNotificationResponseDto,
  DeleteAllNotificationsResponseDto
} from '@/domain/dtos/NotificationDtos';

/**
 * Client für Benachrichtigungsanfragen
 */
export class NotificationClient {
  private static readonly API_URL = '/notifications';

  /**
   * Hole Benachrichtigungen für den aktuellen Benutzer
   * 
   * @param options - Optionale Parameter (Limit, Seite, nur ungelesene)
   * @returns API-Antwort mit Benachrichtigungsliste
   */
  static async getNotifications(
    options: { limit?: number; page?: number; unreadOnly?: boolean } = {}
  ) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.page) params.append('page', options.page.toString());
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      return await ApiClient.get(`${this.API_URL}${queryString}`);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }

  /**
   * Hole eine einzelne Benachrichtigung nach ID
   * 
   * @param id - Benachrichtigungs-ID
   * @returns API-Antwort mit Benachrichtigung
   */
  static async getNotification(id: number) {
    try {
      return await ApiClient.get(`${this.API_URL}/${id}`);
    } catch (error) {
      console.error(`Error fetching notification with ID ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }

  /**
   * Markiere eine Benachrichtigung als gelesen
   * 
   * @param id - Benachrichtigungs-ID
   * @returns API-Antwort mit aktualisierter Benachrichtigung
   */
  static async markNotificationAsRead(id: number) {
    try {
      return await ApiClient.put(`${this.API_URL}/${id}/read`, {});
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }

  /**
   * Markiere alle Benachrichtigungen als gelesen
   * 
   * @returns API-Antwort mit Anzahl der markierten Benachrichtigungen
   */
  static async markAllNotificationsAsRead() {
    try {
      return await ApiClient.put(`${this.API_URL}/read-all`, {});
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }

  /**
   * Lösche eine Benachrichtigung
   * 
   * @param id - Benachrichtigungs-ID
   * @returns API-Antwort mit Erfolgsstatus
   */
  static async deleteNotification(id: number) {
    try {
      return await ApiClient.delete(`${this.API_URL}/${id}`);
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }

  /**
   * Lösche alle Benachrichtigungen
   * 
   * @returns API-Antwort mit Anzahl der gelöschten Benachrichtigungen
   */
  static async deleteAllNotifications() {
    try {
      return await ApiClient.delete(`${this.API_URL}/all`);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }

  /**
   * Erstelle eine neue Benachrichtigung (nur mit Admin-Rechten)
   * 
   * @param notification - Benachrichtigungsdaten
   * @returns API-Antwort mit erstellter Benachrichtigung
   */
  static async createNotification(notification: CreateNotificationDto) {
    try {
      return await ApiClient.post(this.API_URL, notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        data: null
      };
    }
  }
}
