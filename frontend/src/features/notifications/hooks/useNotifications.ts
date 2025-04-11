import { useState, useEffect, useCallback } from 'react';
import { NotificationClient } from '@/infrastructure/api/NotificationClient';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { useToast } from '@/shared/hooks/useToast';

type UseNotificationsOptions = {
  autoFetch?: boolean;
  limit?: number;
  unreadOnly?: boolean;
  pollInterval?: number | null;
};

/**
 * Hook zum Verwalten von Benachrichtigungen
 * 
 * Bietet Funktionen zum Laden, Markieren als gelesen und Filtern von Benachrichtigungen
 */
export function useNotifications({
  autoFetch = true,
  limit,
  unreadOnly,
  pollInterval = null,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Funktion zum Laden der Benachrichtigungen
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const options: { limit?: number; unreadOnly?: boolean } = {};
      if (limit) options.limit = limit;
      if (unreadOnly) options.unreadOnly = true;
      
      const response = await NotificationClient.getNotifications(options);
      
      if (response.success && response.data) {
        setNotifications(response.data);
        // Ungelesene Benachrichtigungen zählen
        const unreadCount = response.data.filter(n => !n.isRead).length;
        setUnreadCount(unreadCount);
      } else {
        setError(response.message || 'Fehler beim Laden der Benachrichtigungen');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungen:', error);
      setError('Fehler beim Laden der Benachrichtigungen');
    } finally {
      setLoading(false);
    }
  }, [limit, unreadOnly]);

  // Funktion zum Markieren einer Benachrichtigung als gelesen
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await NotificationClient.markNotificationAsRead(notificationId);
      
      if (response.success) {
        // Benachrichtigungsstatus in der UI aktualisieren
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Ungelesenen Zähler aktualisieren
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Fehler beim Markieren als gelesen:', error);
      toast({
        title: 'Fehler',
        description: 'Benachrichtigung konnte nicht als gelesen markiert werden',
        variant: 'error'
      });
      return false;
    }
  }, [toast]);

  // Funktion zum Markieren aller Benachrichtigungen als gelesen
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await NotificationClient.markAllNotificationsAsRead();
      
      if (response.success) {
        // Alle Benachrichtigungen in der UI als gelesen markieren
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Ungelesenen Zähler zurücksetzen
        setUnreadCount(0);
        
        toast({
          title: 'Erfolg',
          description: 'Alle Benachrichtigungen wurden als gelesen markiert',
          variant: 'success'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Fehler beim Markieren aller als gelesen:', error);
      toast({
        title: 'Fehler',
        description: 'Benachrichtigungen konnten nicht als gelesen markiert werden',
        variant: 'error'
      });
      return false;
    }
  }, [toast]);

  // Funktion zum Löschen einer Benachrichtigung
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await NotificationClient.deleteNotification(notificationId);
      
      if (response.success) {
        // Benachrichtigung aus der UI entfernen
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
        
        // Ungelesenen Zähler aktualisieren, falls die gelöschte Benachrichtigung ungelesen war
        const wasUnread = notifications.find(n => n.id === notificationId)?.isRead === false;
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        toast({
          title: 'Erfolg',
          description: 'Benachrichtigung wurde gelöscht',
          variant: 'success'
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Fehler beim Löschen der Benachrichtigung:', error);
      toast({
        title: 'Fehler',
        description: 'Benachrichtigung konnte nicht gelöscht werden',
        variant: 'error'
      });
      return false;
    }
  }, [notifications, toast]);

  // Funktion zum Ausführen einer Abfrage des ungelesenen Zählers
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await NotificationClient.getNotifications({ unreadOnly: true });
      if (response.success && response.data) {
        setUnreadCount(response.data.length);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen des ungelesenen Zählers:', error);
    }
  }, []);

  // Automatisches Laden beim ersten Render, wenn autoFetch aktiviert ist
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  // Polling für den ungelesenen Zähler, falls gewünscht
  useEffect(() => {
    if (!pollInterval) return;
    
    const intervalId = setInterval(() => {
      fetchUnreadCount();
    }, pollInterval);
    
    return () => clearInterval(intervalId);
  }, [pollInterval, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchUnreadCount
  };
}
