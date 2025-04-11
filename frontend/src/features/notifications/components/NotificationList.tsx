'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, ChevronDown, Trash } from 'lucide-react';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import NotificationItem from './NotificationItem';

interface NotificationListProps {
  limit?: number;
  showControls?: boolean;
  compact?: boolean;
  onClose?: () => void;
}

/**
 * Komponente zur Anzeige einer Liste von Benachrichtigungen
 * 
 * Kann kompakt oder mit voller Funktionalität angezeigt werden
 */
export default function NotificationList({ 
  limit = 10, 
  showControls = true, 
  compact = false,
  onClose
}: NotificationListProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    fetchNotifications 
  } = useNotifications({ 
    autoFetch: true, 
    limit 
  });

  // Erweitern oder Einklappen einer Benachrichtigung
  const toggleExpand = (id: number) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Eine Benachrichtigung als gelesen markieren
  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  // Eine Benachrichtigung löschen
  const handleDelete = async (id: number) => {
    await deleteNotification(id);
  };

  // Alle als gelesen markieren
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Aktualisieren der Benachrichtigungen
  const handleRefresh = () => {
    fetchNotifications();
  };

  // Leerer Zustand
  if (notifications.length === 0 && !loading && !error) {
    return (
      <div className="py-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 mb-2">
          <Bell className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-500 dark:text-gray-400">Keine neuen Benachrichtigungen</p>
      </div>
    );
  }

  // Lade-Zustand
  if (loading && notifications.length === 0) {
    return (
      <div className="py-4 space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse flex p-3">
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-8 w-8 mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fehler-Zustand
  if (error) {
    return (
      <div className="py-4 px-3 text-center text-red-500 dark:text-red-400">
        <p>Fehler beim Laden der Benachrichtigungen.</p>
        <button 
          onClick={handleRefresh} 
          className="text-sm underline mt-1 text-red-500 dark:text-red-400"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header mit Steuerungen */}
      {showControls && (
        <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Benachrichtigungen
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                {unreadCount} neu
              </span>
            )}
          </h3>
          <div className="flex space-x-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1 rounded text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Alle als gelesen markieren"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="p-1 rounded text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Aktualisieren"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Liste der Benachrichtigungen */}
      <div className={`max-h-${compact ? '60' : '96'} overflow-y-auto`}>
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            expanded={expanded[notification.id] || false}
            onToggleExpand={() => toggleExpand(notification.id)}
            onMarkAsRead={() => handleMarkAsRead(notification.id)}
            onDelete={() => handleDelete(notification.id)}
            compact={compact}
          />
        ))}
      </div>
      
      {/* Footer */}
      {showControls && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 text-center">
          <button
            className="text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  );
}