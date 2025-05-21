'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, useMemo } from 'react';
import { NotificationResponseDto, NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { NotificationClient } from '../lib/clients/NotificationClient';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { useToast } from '@/shared/hooks/useToast';
import { getLogger } from '@/core/logging';

const logger = getLogger();

// Define types for our state and actions
interface NotificationState {
  notifications: NotificationResponseDto[];
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  cursor: string | null;
  hasMore: boolean;
  filters: NotificationFilterParamsDto;
  pageSize: number;
}

type NotificationAction =
  | { type: 'FETCH_INIT' }
  | { type: 'FETCH_SUCCESS'; payload: { notifications: NotificationResponseDto[]; unreadCount: number; cursor: string | null; hasMore: boolean } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'MARK_AS_READ'; payload: number }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: number }
  | { type: 'UPDATE_FILTERS'; payload: Partial<NotificationFilterParamsDto> }
  | { type: 'RESET_NOTIFICATIONS' };

// Define the context type
interface NotificationContextType {
  state: NotificationState;
  markAsRead: (id: number) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: number) => Promise<boolean>;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchMore: () => Promise<boolean>;
  updateFilters: (newFilters: Partial<NotificationFilterParamsDto>) => void;
  resetFilters: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Initial state for the reducer
const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  error: null,
  unreadCount: 0,
  cursor: null,
  hasMore: false,
  filters: {
    page: 1,
    limit: 10,
    unreadOnly: false,
    sortField: 'createdAt',
    sortDirection: 'desc'
  },
  pageSize: 10
};

// Reducer function to handle state updates
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        cursor: action.payload.cursor,
        hasMore: action.payload.hasMore,
        error: null
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true
        })),
        unreadCount: 0
      };
    case 'DELETE_NOTIFICATION': {
      const notificationToDelete = state.notifications.find(n => n.id === action.payload);
      const isUnread = notificationToDelete && !notificationToDelete.isRead;
      
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
        unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    }
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    case 'RESET_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        cursor: null,
        hasMore: false
      };
    default:
      return state;
  }
}

// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Create a stable fetch function
  const fetchNotifications = useCallback(async (reset = false) => {
    // Skip if not authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Cancel any in-progress requests
    if (abortController) {
      abortController.abort();
    }

    // Create a new abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Reset notifications if needed
      if (reset) {
        dispatch({ type: 'RESET_NOTIFICATIONS' });
      }

      dispatch({ type: 'FETCH_INIT' });

      // Prepare filter parameters
      const params: Record<string, any> = {
        ...state.filters,
        // On reset, clear the cursor
        cursor: reset ? undefined : state.cursor
      };

      // If we're using client-side pagination, adjust the limit to load all needed pages
      if (!reset && state.notifications.length > 0) {
        // We're fetching more data, don't reset
        params.limit = state.pageSize;
      } else {
        // Initial fetch or reset
        params.page = 1;
      }

      // Make the API call with abort signal
      const response = await NotificationClient.getNotifications(params, { 
        signal: controller.signal 
      });

      if (response.success && response.data) {
        // Extract the data from the response
        let notifications: NotificationResponseDto[] = [];
        let pagination: any = { hasMore: false, nextCursor: null };

        // Handle different response formats
        if (Array.isArray(response.data)) {
          notifications = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          notifications = response.data.items;
          pagination = response.data.pagination || {};
        } else if (response.data.data && Array.isArray(response.data.data)) {
          notifications = response.data.data;
          pagination = response.data.pagination || {};
        }

        // Count unread notifications
        const unreadCount = notifications.filter(n => !n.isRead).length;

        // Update state with the new data
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            notifications: reset ? notifications : [...state.notifications, ...notifications],
            unreadCount,
            cursor: pagination.nextCursor || null,
            hasMore: pagination.hasMore || false
          }
        });
      } else {
        dispatch({
          type: 'FETCH_ERROR',
          payload: response.message || 'Failed to fetch notifications'
        });
      }
    } catch (error) {
      // Ignore aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.debug('Notification request was aborted');
        return;
      }

      logger.error('Error fetching notifications:', error as Error);
      dispatch({
        type: 'FETCH_ERROR',
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setAbortController(null);
    }
  }, [isAuthenticated, user, state.filters, state.cursor, state.notifications, state.pageSize]);

  // Fetch more notifications (for pagination)
  const fetchMore = useCallback(async (): Promise<boolean> => {
    if (state.isLoading || !state.hasMore) {
      return false;
    }

    await fetchNotifications(false);
    return true;
  }, [fetchNotifications, state.isLoading, state.hasMore]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await NotificationClient.markAsRead(id);
      
      if (response.success) {
        dispatch({ type: 'MARK_AS_READ', payload: id });
        return true;
      } else {
        toast?.({
          title: 'Error',
          description: response.message || 'Failed to mark notification as read',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error as Error);
      toast?.({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await NotificationClient.markAllAsRead();
      
      if (response.success) {
        dispatch({ type: 'MARK_ALL_AS_READ' });
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
    } catch (error) {
      logger.error('Error marking all notifications as read:', error as Error);
      toast?.({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await NotificationClient.deleteNotification(id);
      
      if (response.success) {
        dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
        toast?.({
          title: 'Success',
          description: 'Notification deleted',
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
    } catch (error) {
      logger.error('Error deleting notification:', error as Error);
      toast?.({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<NotificationFilterParamsDto>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: newFilters });
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    dispatch({
      type: 'UPDATE_FILTERS',
      payload: {
        page: 1,
        limit: state.pageSize,
        unreadOnly: false,
        sortField: 'createdAt',
        sortDirection: 'desc'
      }
    });
  }, [state.pageSize]);

  // Initial fetch when component mounts and auth changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications(true);
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Set up polling
  useEffect(() => {
    if (!isAuthenticated || !user || !pollingEnabled) {
      return;
    }

    // Poll every 5 minutes
    const interval = setInterval(() => {
      fetchNotifications(true).catch(error => {
        logger.error('Error during notification polling:', error as Error);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, pollingEnabled, fetchNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Create context value
  const contextValue = useMemo(() => ({
    state,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    fetchMore,
    updateFilters,
    resetFilters
  }), [
    state,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    fetchMore,
    updateFilters,
    resetFilters
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notifications context
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
}
