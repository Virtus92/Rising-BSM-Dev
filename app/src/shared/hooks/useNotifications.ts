import { useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

/**
 * Hook for showing notifications to the user
 * This is a simplified implementation that can be extended with a toast library
 */
export const useNotifications = () => {
  /**
   * Add a notification
   */
  const addNotification = useCallback((notification: Notification) => {
    // In a real implementation, this would send the notification to a toast system
    // For now, we'll just log it to the console
    console.log(`[${notification.type.toUpperCase()}] ${notification.title}: ${notification.message}`);

    // If we're in a browser environment, we can show an alert for better visibility
    if (typeof window !== 'undefined') {
      const icon = getNotificationIcon(notification.type);
      console.log(`%c${icon} ${notification.title}`, getConsoleStyle(notification.type), notification.message);
    }
  }, []);

  /**
   * Show a success notification
   */
  const showSuccess = useCallback((title: string, message: string) => {
    addNotification({ title, message, type: 'success' });
  }, [addNotification]);

  /**
   * Show an error notification
   */
  const showError = useCallback((title: string, message: string) => {
    addNotification({ title, message, type: 'error' });
  }, [addNotification]);

  /**
   * Show a warning notification
   */
  const showWarning = useCallback((title: string, message: string) => {
    addNotification({ title, message, type: 'warning' });
  }, [addNotification]);

  /**
   * Show an info notification
   */
  const showInfo = useCallback((title: string, message: string) => {
    addNotification({ title, message, type: 'info' });
  }, [addNotification]);

  return {
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Helper functions for console output styling
function getConsoleStyle(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'background-color: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
    case 'error':
      return 'background-color: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
    case 'warning':
      return 'background-color: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
    case 'info':
      return 'background-color: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;';
  }
}

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
  }
}
