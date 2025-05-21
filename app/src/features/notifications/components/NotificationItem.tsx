'use client';

import { Check, Trash, ChevronDown, ChevronUp, Calendar, AlertCircle, Bell } from 'lucide-react';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { formatRelativeTime } from '@/features/notifications/utils/date-utils';

interface NotificationItemProps {
  notification: NotificationResponseDto;
  expanded: boolean;
  onToggleExpand: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
  compact?: boolean;
}

/**
 * Einzelnes Benachrichtigungselement
 * 
 * Zeigt Betreff, Datum, Inhalt und Aktionen für eine Benachrichtigung an
 */
export default function NotificationItem({
  notification,
  expanded,
  onToggleExpand,
  onMarkAsRead,
  onDelete,
  compact = false
}: NotificationItemProps) {
  // Relative Zeit (z.B. "vor 3 Stunden")
  const relativeTime = formatRelativeTime(new Date(notification.createdAt));

  // Icon basierend auf dem Typ der Benachrichtigung
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'appointment':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={`
      border-b border-gray-200 dark:border-gray-700 last:border-0
      ${notification.isRead ? 'bg-white dark:bg-slate-800' : 'bg-green-50 dark:bg-green-900/10'}
      hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors
    `}>
      <div className="p-3">
        {/* Benachrichtigungskopf mit Icon, Titel und Aktionen */}
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5 mr-3">
            {getNotificationIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <p className={`
                text-sm font-medium text-gray-900 dark:text-white truncate
                ${!notification.isRead && 'font-semibold'}
              `}>
                {notification.title}
              </p>
              
              <div className="ml-2 flex flex-shrink-0 items-center">
                {!compact && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand();
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
                
                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead();
                    }}
                    className="ml-1 p-1 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
                    title="Als gelesen markieren"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="ml-1 p-1 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                  title="Löschen"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {relativeTime}
            </p>
            
            {/* Benachrichtigungsinhalt */}
            {!compact && (
              <div className={`mt-2 ${expanded ? 'block' : 'hidden'}`}>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  { notification.message || ''}
                </p>
                
                {notification.link && (
                  <a
                    href={notification.link}
                    className="block mt-2 text-sm text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
                  >
                    Mehr anzeigen
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}