'use client';

import { useState } from 'react';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { formatRelativeTime } from '@/shared/utils/date-utils';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { 
  Bell, 
  Check,
  CheckCheck, 
  Trash2,
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react';

/**
 * A simplified notification dropdown specifically for the header
 * Avoiding the use of BaseListComponent to prevent UI issues
 */
export default function NotificationDropdown({ 
  limit = 5,
  onClose
}: { 
  limit?: number;
  onClose: () => void;
}) {
  // Use the notifications hook with proper parameters - autoFetch:true will load data immediately
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refetch,
    isLoading
  } = useNotifications({
    limit,
    page: 1,
    autoFetch: true // The fixed hook will now handle this correctly
  });

  // Get notification icon based on type
  const getNotificationIcon = (notification: NotificationResponseDto) => {
    switch (notification.type) {
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-2 w-full">
      <div className="flex justify-between items-center p-2 border-b">
        <h3 className="font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="h-8 text-sm"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Mark All Read
          </Button>
        )}
      </div>
      
      <ScrollArea className="h-[250px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-1 p-2">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-2 rounded-md hover:bg-muted flex ${!notification.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className="mr-3 mt-0.5">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                    {notification.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {notification.message || notification.content}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(notification.createdAt))}
                    </div>
                    <div className="flex space-x-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-[200px] text-sm text-muted-foreground">
            No notifications
          </div>
        )}
      </ScrollArea>
      
      <div className="border-t mt-2 pt-2 flex justify-between">
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}