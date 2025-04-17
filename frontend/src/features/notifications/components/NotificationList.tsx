'use client';

import { useState, useCallback, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Mail, Clock, Eye, Calendar, AlertCircle } from 'lucide-react';
import { NotificationResponseDto } from '@/domain/dtos/NotificationDtos';
import { BaseCard, BaseCardProps } from '@/shared/components/data/BaseCard';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { BaseListComponent, CardProps, ColumnDef } from '@/shared/components/data/BaseListComponent';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from './utils/date-utils';
import { DeleteConfirmationDialog } from '@/shared/components/DeleteConfirmationDialog';
import { EntityColors } from '@/shared/utils/entity-colors';

// Enhanced notification type with additional UI data
interface EnhancedNotificationDto extends NotificationResponseDto {
  formattedDate?: string;
}

// Card component for mobile view - defined outside the main component to ensure stable reference
const NotificationCard = ({ item, onActionClick }: BaseCardProps<EnhancedNotificationDto>) => {
  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (item.type) {
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <Bell className="h-4 w-4 text-blue-600" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format relative time
  const relativeTime = formatRelativeTime(new Date(item.createdAt));

  return (
    <BaseCard
      item={item}
      title={item.title}
      description={item.message || item.content || 'No content'}
      className={`border-l-4 ${!item.isRead ? EntityColors.notifications.border : 'border-l-gray-200 dark:border-l-gray-700'}`}
      badges={[
        {
          text: item.isRead ? 'Read' : 'Unread',
          className: item.isRead 
            ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }
      ]}
      fields={[
        {
          label: 'Type',
          value: item.type,
          icon: getNotificationIcon()
        },
        {
          label: 'Received',
          value: relativeTime,
          icon: <Clock className="h-4 w-4 text-gray-600" />
        }
      ]}
      actions={
        <div className="flex justify-between space-x-2">
          {!item.isRead && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onActionClick?.('mark-read', item)}
              className={EntityColors.notifications.text}
            >
              <Check className="h-4 w-4 mr-1.5" /> Mark as Read
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onActionClick?.('view', item)}
            className={EntityColors.notifications.text}
          >
            <Eye className="h-4 w-4 mr-1.5" /> View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onActionClick?.('delete', item)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/10"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        </div>
      }
    />
  );
};

interface NotificationListProps {
  limit?: number;
  compact?: boolean;
  onClose?: () => void;
}

/**
 * Notification list component using the unified list utilities
 */
export default function NotificationList({ 
  limit = 10, 
  compact = false,
  onClose
}: NotificationListProps) {
  const [notificationToDelete, setNotificationToDelete] = useState<{ id: number; title: string } | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use the notifications hook with the unified list utilities
  const { 
    notifications, 
    isLoading, 
    error, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refetch,
    setPage,
    pagination
  } = useNotifications({ 
    limit,
    // Pass the current page to hook
    page: currentPage
  });
  
  // Manual first-time fetch with error handling
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        if (isMounted) await refetch();
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        // Do not retry automatically on error
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [refetch]);
  
  // Toggle expanded state for a notification
  const toggleExpand = useCallback((id: number) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // Handle card action clicks
  const handleActionClick = useCallback((action: string, notification: EnhancedNotificationDto) => {
    switch (action) {
      case 'view':
        toggleExpand(notification.id);
        break;
      case 'mark-read':
        markAsRead(notification.id);
        break;
      case 'delete':
        setNotificationToDelete({ id: notification.id, title: notification.title });
        break;
    }
  }, [toggleExpand, markAsRead]);

  // Handle notification deletion
  const handleDeleteNotification = useCallback(async () => {
    if (!notificationToDelete) return;
    
    await deleteNotification(notificationToDelete.id);
    setNotificationToDelete(null);
  }, [notificationToDelete, deleteNotification]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setPage(page);
  }, [setPage]);

  // Define columns for the table view
  const columns: ColumnDef<EnhancedNotificationDto>[] = [
    {
      header: 'Notification',
      cell: (notification) => (
        <div className={`flex items-start ${!notification.isRead ? 'font-medium' : ''}`}>
          <div className="flex-shrink-0 mt-0.5 mr-3">
            {(() => {
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
            })()}
          </div>
          <div>
            <div className="font-medium">{notification.title}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">{notification.message || notification.content}</div>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (notification) => (
        <Badge variant="outline">
          {notification.type}
        </Badge>
      ),
      sortable: true
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (notification) => formatRelativeTime(new Date(notification.createdAt)),
      sortable: true
    },
    {
      header: 'Status',
      cell: (notification) => (
        <Badge className={!notification.isRead 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}>
          {notification.isRead ? 'Read' : 'Unread'}
        </Badge>
      ),
      sortable: true
    }
  ];

  // Define row actions for the table
  const rowActions = useCallback((notification: EnhancedNotificationDto) => (
    <div className="flex justify-end space-x-2">
      {!notification.isRead && (
        <Button 
          variant="outline" 
          size="icon" 
          title="Mark as Read"
          onClick={() => markAsRead(notification.id)}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
      <Button 
        variant="destructive" 
        size="icon" 
        title="Delete Notification"
        onClick={() => setNotificationToDelete({ 
          id: notification.id, 
          title: notification.title 
        })}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ), [markAsRead]);

  // Custom toolbar actions
  const toolbarActions = unreadCount > 0 ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => markAllAsRead()}
      className="h-8 whitespace-nowrap"
    >
      <CheckCheck className="h-4 w-4 mr-1.5" />
      Mark All Read
    </Button>
  ) : null;

  return (
    <>
      <BaseListComponent<EnhancedNotificationDto>
        // Data props
        items={notifications}
        isLoading={isLoading}
        error={error}
        totalItems={pagination?.total || notifications.length}
        currentPage={pagination?.page || currentPage}
        totalPages={pagination?.totalPages || Math.ceil(notifications.length / limit) || 1}
        pageSize={pagination?.limit || limit}
        
        // Configuration
        columns={columns}
        keyExtractor={(item) => item.id}
        cardComponent={NotificationCard as React.FC<CardProps<EnhancedNotificationDto>>}
        
        // UI elements
        title="Notifications"
        headerActions={unreadCount > 0 ? (
          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
            {unreadCount} unread
          </Badge>
        ) : undefined}
        toolbarActions={toolbarActions}
        searchPlaceholder="Search notifications..."
        emptyStateMessage="No notifications found"
        
        // Actions - add the onPageChange handler
        onPageChange={handlePageChange}
        onRefresh={() => refetch()}
        onActionClick={handleActionClick}
        
        // Row actions
        rowActions={rowActions}
        
        // Custom styles
        className={compact ? "max-h-96 overflow-y-auto" : undefined}
      />
      
      {/* Delete confirmation dialog */}
      {notificationToDelete && (
        <DeleteConfirmationDialog
          title="Delete Notification"
          description={`Are you sure you want to delete the notification "${notificationToDelete.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteNotification}
          onClose={() => setNotificationToDelete(null)}
          open={!!notificationToDelete}
        />
      )}
      
      {/* Close button if in popup mode */}
      {onClose && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm"
          >
            Close
          </Button>
        </div>
      )}
    </>
  );
}