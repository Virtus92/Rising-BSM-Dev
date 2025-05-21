'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { useNotificationContext } from '../providers/NotificationProvider';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { formatRelativeTime } from '@/features/notifications/utils/date-utils';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Bell, Check, Trash2, Calendar, AlertCircle, Info, Loader2, CheckCheck, RefreshCw } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { useToast } from '@/shared/hooks/useToast';

// Interface for confirmation dialog options
interface ConfirmationOptions {
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

// Simple confirmation dialog implementation
function useSimpleConfirmation() {
  const { toast } = useToast();
  
  const openConfirmDialog = useCallback((options: ConfirmationOptions) => {
    const { 
      title, 
      description, 
      onConfirm,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'default'
    } = options;
    const toastId = toast({
      title,
      description,
      variant: variant === 'destructive' ? 'destructive' : undefined,
      action: (
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 bg-primary text-primary-foreground rounded"
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmText}
          </button>
          <button 
            className="px-3 py-1 bg-muted text-muted-foreground rounded"
            onClick={() => {}}
          >
            {cancelText}
          </button>
        </div>
      )
    });
    
    return toastId;
  }, [toast]);
  
  return { openConfirmDialog };
}

interface NotificationCardProps {
  notification: NotificationResponseDto;
  onMarkAsRead: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function NotificationCard({ notification, onMarkAsRead, onDelete }: NotificationCardProps) {
  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'appointment':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <Card 
      className={cn(
        "mb-3 transition-all duration-200 hover:shadow-md", 
        !notification.isRead ? "border-l-4 border-l-primary" : ""
      )}
    >
      <CardContent className="p-4 flex items-start">
        <div className="mr-3 mt-0.5 flex-shrink-0">
          {getNotificationIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={cn("text-md", !notification.isRead && "font-medium")}>
            {notification.title}
          </div>
          
          <div className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <div>
              {formatRelativeTime(new Date(notification.createdAt))}
            </div>
            
            <div className="flex space-x-2">
              {!notification.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-7 px-2 text-primary"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  <span>Mark as Read</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="h-7 px-2 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationVirtualListProps {
  className?: string;
  showControls?: boolean;
  showHeader?: boolean;
  height?: string | number;
  limit?: number;
  onlyUnread?: boolean;
}

export function NotificationVirtualList({
  className,
  showControls = true,
  showHeader = true,
  height = 600,
  limit = 20,
  onlyUnread = false
}: NotificationVirtualListProps) {
  const { 
    state, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    fetchNotifications, 
    fetchMore,
    updateFilters 
  } = useNotificationContext();
  
  const { toast } = useToast();
  const { openConfirmDialog } = useSimpleConfirmation();
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Update filters based on props
  React.useEffect(() => {
    updateFilters({
      limit,
      unreadOnly: onlyUnread
    });
    // Don't include updateFilters in deps to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, onlyUnread]);
  
  // Set up virtualization for efficient rendering
  const virtualizer = useVirtualizer({
    count: state.notifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110, // Estimated row height
    overscan: 5,
  });
  
  // Handle marking as read
  const handleMarkAsRead = useCallback(async (id: number) => {
    await markAsRead(id);
  }, [markAsRead]);
  
  // Handle deleting notification with confirmation
  const handleDelete = useCallback(async (id: number) => {
    const notification = state.notifications.find(n => n.id === id);
    if (!notification) return;
    
    openConfirmDialog({
      title: 'Delete Notification',
      description: `Are you sure you want to delete this notification: "${notification.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        const success = await deleteNotification(id);
        if (success) {
          toast({
            title: 'Notification Deleted',
            description: 'The notification has been deleted successfully',
            variant: 'success'
          });
        }
      }
    });
  }, [state.notifications, deleteNotification, openConfirmDialog, toast]);
  
  // Handle mark all as read with confirmation
  const handleMarkAllAsRead = useCallback(async () => {
    openConfirmDialog({
      title: 'Mark All as Read',
      description: 'Are you sure you want to mark all notifications as read?',
      confirmText: 'Mark All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const success = await markAllAsRead();
        if (success) {
          toast({
            title: 'All Notifications Marked as Read',
            description: 'All your notifications have been marked as read',
            variant: 'success'
          });
        }
      }
    });
  }, [markAllAsRead, openConfirmDialog, toast]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await fetchNotifications(true);
    toast({
      title: 'Notifications Refreshed',
      description: 'Your notifications have been updated',
      variant: 'success'
    });
  }, [fetchNotifications, toast]);
  
  // Memoize empty state to avoid recreating on each render
  const emptyState = useMemo(() => {
    if (state.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-12 w-12 animate-spin mb-4" />
          <p>Loading notifications...</p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Bell className="h-12 w-12 mb-4" />
        <p className="font-medium text-lg mb-1">No notifications</p>
        <p>You don't have any notifications at the moment</p>
        <Button variant="outline" className="mt-4" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }, [state.isLoading, handleRefresh]);
  
  return (
    <div className={cn("w-full flex flex-col", className)}>
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">Notifications</h2>
            {state.unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {state.unreadCount} unread
              </Badge>
            )}
          </div>
          
          {showControls && (
            <div className="flex space-x-2">
              {state.unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All as Read
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={state.isLoading}
              >
                {state.isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Notification list with virtualization */}
      {state.notifications.length === 0 ? (
        emptyState
      ) : (
        <div 
          ref={parentRef} 
          className="w-full overflow-auto"
          style={{ height }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const notification = state.notifications[virtualRow.index];
              return (
                <div
                  key={notification.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <NotificationCard
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Load more button */}
      {state.hasMore && !state.isLoading && state.notifications.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => fetchMore()}
            className="w-full max-w-sm"
          >
            Load More
          </Button>
        </div>
      )}
      
      {/* Loading indicator */}
      {state.isLoading && state.notifications.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" disabled className="w-full max-w-sm">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading more...
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationVirtualList;
