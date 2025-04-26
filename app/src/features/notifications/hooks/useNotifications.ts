'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { NotificationClient } from '@/features/notifications/lib/clients';
import { NotificationResponseDto, NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { createBaseListUtility, BaseListUtility } from '@/shared/utils/list/baseListUtils';


/**
 * Extended interface for notification list operations
 */
export interface UseNotificationsResult extends BaseListUtility<NotificationResponseDto, NotificationFilterParamsDto> {
  // Alias for better semantics
  notifications: NotificationResponseDto[];
  
  // Notification-specific operations
  unreadCount: number;
  markAsRead: (id: number) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: number) => Promise<boolean>;
  fetchUnreadCount: () => Promise<number>;
  
  // Ensure pagination is exposed for direct access
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseNotificationsProps {
  limit?: number;
  unreadOnly?: boolean;
  page?: number;
  autoFetch?: boolean;
  pollInterval?: number;
}

/**
 * Hook for managing notification list with the unified list utilities
 */
export const useNotifications = ({ 
  limit = 10, 
  unreadOnly = false,
  page = 1,
  autoFetch = true,
  pollInterval
}: UseNotificationsProps = {}): UseNotificationsResult => {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const didInitialFetchRef = useRef(false);
  
  // Define the fetch function for notifications
  const fetchNotifications = useCallback(async (filters: NotificationFilterParamsDto) => {
    return await NotificationClient.getNotifications(filters);
  }, []);
  
  // Use the base list utility
  const baseList = createBaseListUtility<NotificationResponseDto, NotificationFilterParamsDto>({
    fetchFunction: fetchNotifications,
    initialFilters: {
      page,
      limit,
      unreadOnly,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    },
    defaultSortField: 'createdAt' as string,
    defaultSortDirection: 'desc',
    syncWithUrl: false,
    // Critical fix: Let the baseList handle auto-fetching properly
    autoFetch
  });
  
  // Calculate unread count from the actual items in the list
  const unreadCount = baseList.items.filter(notification => !notification.isRead).length;
  
  // Setup polling if pollInterval is provided
  useEffect(() => {
    // Clean up any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Don't setup polling if no interval specified
    if (!pollInterval) return;
    
    // Setup new polling interval
    intervalRef.current = setInterval(() => {
      // Use the refetch method from baseList to update data
      baseList.refetch();
    }, pollInterval);
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pollInterval, baseList]);
  
  // Handle initial fetch if autoFetch is true
  useEffect(() => {
    if (autoFetch && !didInitialFetchRef.current) {
      // Only fetch once to avoid duplicate fetching
      baseList.refetch();
      didInitialFetchRef.current = true;
    }
  }, [autoFetch, baseList]);
  
  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (id: number) => {
    try {
      const response = await NotificationClient.markAsRead(id);
      
      if (response.success) {
        // Update the item in the list
        const updatedItems = baseList.items.map(item => 
          item.id === id ? { ...item, isRead: true } : item
        );
        
        // Update the list
        baseList.setItems(updatedItems);
        
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to mark notification as read',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await NotificationClient.markAllAsRead();
      
      if (response.success) {
        // Update all items in the list
        const updatedItems = baseList.items.map(item => ({ ...item, isRead: true }));
        
        // Update the list
        baseList.setItems(updatedItems);
        
        toast?.({ 
          title: 'Success',
          description: 'All notifications marked as read',
          variant: 'success'
        });
        
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to mark all notifications as read',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (id: number) => {
    try {
      const response = await NotificationClient.deleteNotification(id);
      
      if (response.success) {
        // Remove the item from the list
        const updatedItems = baseList.items.filter(item => item.id !== id);
        
        // Update the list
        baseList.setItems(updatedItems);
        
        toast?.({ 
          title: 'Success',
          description: 'Notification deleted successfully',
          variant: 'success'
        });
        
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to delete notification',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Fetch just the unread count without loading all notifications
   * This method now properly uses the baseList's refetch mechanism
   */
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    try {
      // Instead of making a separate API call, use the baseList's refetch method
      // which will properly update the internal state
      await baseList.refetch();
      
      // Return the count from filtered items
      return baseList.items.filter(notification => !notification.isRead).length;
    } catch (err) {
      console.error('Error fetching unread notification count:', err);
      return 0;
    }
  }, [baseList]);

  return {
    ...baseList,
    // Alias items as notifications for better semantics
    notifications: baseList.items,
    
    // Notification-specific properties and methods
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchUnreadCount
  };
};

// Add default export for compatibility with import statements
export default useNotifications;
