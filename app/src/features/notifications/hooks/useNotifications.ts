'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { NotificationClient } from '@/features/notifications/lib/clients';
import { NotificationResponseDto, NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { createBaseListUtilityConfig, BaseListUtility } from '@/shared/utils/list/baseListUtils';
import { useAuth } from '@/features/auth/providers/AuthProvider';

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

// Global singleton to track active instances and API calls
const NOTIFICATIONS_STATE = {
  lastFetchTime: 0,
  activeInstanceIds: new Set<string>(),
  requestInProgress: false,
  cachedUnreadCount: 0
};

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
  // Always call hooks in the same order
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  
  // All refs first - helps maintain consistent hook order
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const didInitialFetchRef = useRef(false);
  const fetchAttemptsRef = useRef(0);
  const authReadyRef = useRef(false);
  const instanceId = useRef(`notification-instance-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  const baseListRef = useRef<BaseListUtility<NotificationResponseDto, NotificationFilterParamsDto> | null>(null);
  
  // Store the authentication state in a ref to avoid dependency issues
  const authStateRef = useRef({ isAuthenticated, user });
  
  // Update the auth state ref whenever auth changes
  useEffect(() => {
    authStateRef.current = { isAuthenticated, user };
    
    // Set auth ready flag when we have a definitive answer
    if (!authReadyRef.current && (isAuthenticated === true || isAuthenticated === false)) {
      authReadyRef.current = true;
    }
  }, [isAuthenticated, user]);
  
  // Define the fetch function for notifications with improved error handling
  const fetchNotifications = useCallback(async (filters: NotificationFilterParamsDto) => {
    // Use the ref for auth state to avoid dependency issues
    const { isAuthenticated, user } = authStateRef.current;
    
    // Skip API calls if not authenticated
    if (!authReadyRef.current || !isAuthenticated || !user) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Notifications] Skipping fetch - auth not ready. AuthReady: ${authReadyRef.current}, Authenticated: ${isAuthenticated}`);
      }
      return {
        success: false,
        message: 'Not authenticated',
        data: [],
        meta: {
          pagination: {
            page: 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0
          }
        }
      };
    }
    
    // If a request is already in progress, return cached data
    if (NOTIFICATIONS_STATE.requestInProgress) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Notifications] Request already in progress, returning cached data`);
      }
      return {
        success: true,
        message: 'Request in progress, using cached data',
        data: [],
        meta: {
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0
          }
        }
      };
    }
    
    // If last fetch was less than 5 seconds ago, throttle
    const now = Date.now();
    const timeSinceLastFetch = now - NOTIFICATIONS_STATE.lastFetchTime;
    if (NOTIFICATIONS_STATE.lastFetchTime > 0 && timeSinceLastFetch < 5000) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Notifications] Throttling, last fetch was ${timeSinceLastFetch}ms ago`);
      }
      return {
        success: true,
        message: 'Throttled - using cached data',
        data: [],
        meta: {
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0
          }
        }
      };
    }
    
    try {
      NOTIFICATIONS_STATE.requestInProgress = true;
      NOTIFICATIONS_STATE.lastFetchTime = now;
      fetchAttemptsRef.current += 1;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Notifications] Fetching from ${instanceId.current}`, filters);
      }
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Create the API call with signal parameter
      const fetchOptions = {
        signal: controller.signal
      };
      
      const apiCall = NotificationClient.getNotifications(filters, fetchOptions);
      
      // Clear timeout when done
      const cleanup = () => {
        clearTimeout(timeoutId);
        NOTIFICATIONS_STATE.requestInProgress = false;
      };
      
      // Await with timeout protection
      try {
        const result = await apiCall;
        cleanup();
        
        // If successful, update cached unread count
        if (result.success && result.data) {
          // Count unread items
          if (Array.isArray(result.data)) {
            NOTIFICATIONS_STATE.cachedUnreadCount = result.data.filter(
              item => !item.isRead
            ).length;
          }
        }
        
        return result;
      } catch (error) {
        cleanup();
        
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.warn('[Notifications] Request aborted due to timeout');
        } else {
          console.error('[Notifications] Error fetching:', error);
          
          // Don't show errors for the first few attempts or aborted requests
          if (fetchAttemptsRef.current > 3 && !(error instanceof DOMException && error.name === 'AbortError')) {
            toast?.({
              title: 'Notification Error',
              description: 'Failed to load notifications',
              variant: 'error'
            });
          }
        }
        
        // Return empty result on error
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          data: [],
          meta: {
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 10,
              total: 0,
              totalPages: 0
            }
          }
        };
      }
    } catch (err) {
      console.error('[Notifications] Error in fetchFunction:', err);
      NOTIFICATIONS_STATE.requestInProgress = false;
      
      // Return empty result instead of throwing
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
        data: [],
        meta: {
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: 0,
            totalPages: 0
          }
        }
      };
    }
  }, [toast]); // Only depend on toast, auth state is accessed via ref
  
  // Create the BaseListUtility outside of useEffect to avoid React hooks violations
  const createList = useMemo(() => {
    return () => createBaseListUtilityConfig<NotificationResponseDto, NotificationFilterParamsDto>({
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
      autoFetch: false // Never start with autoFetch enabled, we'll control this manually
    });
  }, [fetchNotifications, limit, page, unreadOnly]);
  
  // Initialize baseListRef during first render
  useEffect(() => {
    if (!baseListRef.current) {
      baseListRef.current = createList();
    }
  }, [createList]);
  
  // Always ensure we use the current fetch function
  useEffect(() => {
    if (baseListRef.current && typeof (baseListRef.current as any).setFetchFunction === 'function') {
      (baseListRef.current as any).setFetchFunction(fetchNotifications);
    }
  }, [fetchNotifications]);
  
  // Calculate unread count using useMemo to avoid direct property access
  const unreadCount = useMemo(() => {
    if (!baseListRef.current?.items) {
      return NOTIFICATIONS_STATE.cachedUnreadCount;
    }
    
    const count = baseListRef.current.items
      .filter(notification => !notification.isRead)
      .length;
      
    return count || NOTIFICATIONS_STATE.cachedUnreadCount;
  }, [baseListRef.current?.items]);
  
  // Handle auto-fetch based on authentication status
  useEffect(() => {
    // Skip if auth not ready
    if (!authReadyRef.current) return;
    
    // Clear any polling interval when authentication changes
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Don't set up fetching if not authenticated
    if (!isAuthenticated || !user) {
      didInitialFetchRef.current = false;
      return;
    }
    
    // Check if we should auto-fetch on mount
    if (autoFetch && !didInitialFetchRef.current) {
      // Delay initial fetch to avoid too many simultaneous requests
      const offset = 1000 + Math.random() * 2000; // Random delay between 1-3 seconds
      const timer = setTimeout(() => {
        if (authStateRef.current.isAuthenticated && authStateRef.current.user && baseListRef.current) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Notifications] Initial fetch for ${instanceId.current}`);
          }
          // Fix void promise return type by ignoring the result
          baseListRef.current.refetch().catch(err => {
            console.error('[Notifications] Refetch error:', err);
          });
          didInitialFetchRef.current = true;
        }
      }, offset);
      
      return () => clearTimeout(timer);
    }
    
    // Set up polling if requested
    if (pollInterval && pollInterval > 0) {
      // Stagger poll intervals to avoid all instances polling at the same time
      const randomOffset = Math.random() * 30000; // Random offset up to 30 seconds
      const effectivePollInterval = pollInterval + randomOffset;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Notifications] Setting up poll interval: ${Math.round(effectivePollInterval / 1000)}s for ${instanceId.current}`);
      }
      
      intervalRef.current = setInterval(() => {
        const { isAuthenticated, user } = authStateRef.current;
        if (isAuthenticated && user && baseListRef.current && !NOTIFICATIONS_STATE.requestInProgress) {
          // Only refetch if no request is in progress and we've waited at least 5 seconds since last fetch
          const now = Date.now();
          if (now - NOTIFICATIONS_STATE.lastFetchTime >= 5000) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Notifications] Poll interval triggered for ${instanceId.current}`);
            }
            // Fix void promise return type by ignoring the result
            baseListRef.current.refetch().catch(err => {
              console.error('[Notifications] Poll refetch error:', err);
            });
          }
        }
      }, effectivePollInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isAuthenticated, user, autoFetch, pollInterval]);
  
  // Track this hook instance for debugging - moved after other hooks for consistency
  useEffect(() => {
    if (!NOTIFICATIONS_STATE.activeInstanceIds.has(instanceId.current)) {
      NOTIFICATIONS_STATE.activeInstanceIds.add(instanceId.current);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Notifications] Instance ${instanceId.current} mounted. Total: ${NOTIFICATIONS_STATE.activeInstanceIds.size}`);
      }
    }
    
    return () => {
      NOTIFICATIONS_STATE.activeInstanceIds.delete(instanceId.current);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Notifications] Instance ${instanceId.current} unmounted. Remaining: ${NOTIFICATIONS_STATE.activeInstanceIds.size}`);
      }
    };
  }, []);
  
  // Mark notification as read - recreated to use authStateRef
  const markAsRead = useCallback(async (id: number): Promise<boolean> => {
    const { isAuthenticated, user } = authStateRef.current;
    
    try {
      if (!isAuthenticated || !user || !baseListRef.current) return false;
      
      const response = await NotificationClient.markAsRead(id);
      
      if (response.success) {
        // Update the item in the list
        const updatedItems = baseListRef.current.items.map(item => 
          item.id === id ? { ...item, isRead: true } : item
        );
        
        // Update the list
        baseListRef.current.setItems(updatedItems);
        
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
  }, [toast]); // Only depend on toast, auth state accessed via ref
  
  // Mark all notifications as read - recreated to use authStateRef
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    const { isAuthenticated, user } = authStateRef.current;
    
    try {
      if (!isAuthenticated || !user || !baseListRef.current) return false;
      
      const response = await NotificationClient.markAllAsRead();
      
      if (response.success) {
        // Update all items in the list
        const updatedItems = baseListRef.current.items.map(item => ({ ...item, isRead: true }));
        
        // Update the list
        baseListRef.current.setItems(updatedItems);
        
        // Update cached count
        NOTIFICATIONS_STATE.cachedUnreadCount = 0;
        
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
  }, [toast]); // Only depend on toast, auth state accessed via ref
  
  // Delete a notification - recreated to use authStateRef
  const deleteNotification = useCallback(async (id: number): Promise<boolean> => {
    const { isAuthenticated, user } = authStateRef.current;
    
    try {
      if (!isAuthenticated || !user || !baseListRef.current) return false;
      
      const response = await NotificationClient.deleteNotification(id);
      
      if (response.success) {
        // Remove the item from the list
        const updatedItems = baseListRef.current.items.filter(item => item.id !== id);
        
        // Update the list
        baseListRef.current.setItems(updatedItems);
        
        // Update cached unread count if needed
        if (baseListRef.current.items.find(item => item.id === id)?.isRead === false) {
          NOTIFICATIONS_STATE.cachedUnreadCount = Math.max(0, NOTIFICATIONS_STATE.cachedUnreadCount - 1);
        }
        
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
  }, [toast]); // Only depend on toast, auth state accessed via ref
  
  // Fetch just the unread count without loading all notifications - recreated to use authStateRef
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    const { isAuthenticated, user } = authStateRef.current;
    
    try {
      // Skip if not authenticated or baseListRef is not initialized
      if (!authReadyRef.current || !isAuthenticated || !user) {
        return NOTIFICATIONS_STATE.cachedUnreadCount;
      }
      
      // Make sure baseListRef.current exists
      if (!baseListRef.current) {
        return NOTIFICATIONS_STATE.cachedUnreadCount;
      }
      
      // Check if we should throttle
      const now = Date.now();
      if (now - NOTIFICATIONS_STATE.lastFetchTime < 5000) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Notifications] Throttling unread count fetch');
        }
        
        // Safely get the current unread count with defensive null checks
        const items = baseListRef.current.items || [];
        return items.filter(item => !item.isRead).length || NOTIFICATIONS_STATE.cachedUnreadCount;
      }
      
      // Use the baseList's refetch method which will properly update the internal state
      // Fix void promise by ignoring the result - we just need to update the state
      await baseListRef.current.refetch().catch(err => {
        console.error('[Notifications] Unread count fetch error:', err);
      });
      
      // Ensure items exists with a default empty array
      const items = baseListRef.current.items || [];
      const newCount = items.filter(item => !item.isRead).length;
      NOTIFICATIONS_STATE.cachedUnreadCount = newCount;
      return newCount;
    } catch (err) {
      console.error('Error fetching unread notification count:', err);
      return NOTIFICATIONS_STATE.cachedUnreadCount;
    }
  }, []);  // No dependencies - auth state accessed via ref
  
  // Create the result object to return - use useMemo to avoid recreating on every render
  const notificationResult = useMemo((): UseNotificationsResult => {
    // Create a safe default value
    const defaultValue: UseNotificationsResult = {
      items: [],
      notifications: [],
      unreadCount: NOTIFICATIONS_STATE.cachedUnreadCount,
      filters: {
        page,
        limit,
        unreadOnly,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      },
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      },
      isLoading: false, // Changed from loading to isLoading to match the BaseListUtility interface
      error: null,
      refetch: async () => { /* Return void instead of object */ },
      setFilters: () => {},
      setItems: () => {},
      markAsRead,
      markAllAsRead,
      deleteNotification,
      fetchUnreadCount,
      // Add missing methods required by BaseListUtility
      updateFilters: () => {},
      setPage: () => {},
      setLimit: () => {},
      resetFilters: () => {},
      setSort: () => {},
      setSearch: () => {},
      setFilter: () => {},
      clearFilter: () => {},
      clearAllFilters: () => {},
      data: []
    };
    
    // Use baseListRef if it exists
    if (!baseListRef.current) return defaultValue;
    
    return {
      ...baseListRef.current,
      notifications: baseListRef.current.items || [],
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      fetchUnreadCount
    };
  }, [
    markAsRead,
    markAllAsRead,
    deleteNotification, 
    fetchUnreadCount,
    unreadCount,
    page,
    limit,
    unreadOnly,
    baseListRef.current?.items,
    baseListRef.current?.isLoading, // Changed from loading to isLoading to match the BaseListUtility interface
    baseListRef.current?.error,
  ]);

  return notificationResult;
};

// Add default export for compatibility with import statements
export default useNotifications;
