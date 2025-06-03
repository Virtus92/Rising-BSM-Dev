'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { NotificationClient } from '@/features/notifications/lib/clients';
import { NotificationResponseDto, NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';
import { createBaseListUtility, BaseListUtility } from '@/shared/utils/list/baseListUtils';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { getLogger } from '@/core/logging';

const logger = getLogger();

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

// Use a singleton state object instead of global variables for better encapsulation
class NotificationsStateManager {
  private static instance: NotificationsStateManager;
  
  private lastFetchTime = 0;
  private activeInstanceIds = new Set<string>();
  private requestInProgress = false;
  private cachedUnreadCount = 0;
  private mainInstanceId: string | null = null;
  private hmrCount = 0;
  
  private constructor() {}
  
  public static getInstance(): NotificationsStateManager {
    if (!this.instance) {
      this.instance = new NotificationsStateManager();
    }
    return this.instance;
  }
  
  public getLastFetchTime(): number { return this.lastFetchTime; }
  public setLastFetchTime(time: number): void { this.lastFetchTime = time; }
  
  public isRequestInProgress(): boolean { return this.requestInProgress; }
  public setRequestInProgress(inProgress: boolean): void { this.requestInProgress = inProgress; }
  
  public getCachedUnreadCount(): number { return this.cachedUnreadCount; }
  public setCachedUnreadCount(count: number): void { this.cachedUnreadCount = count; }
  
  public addInstance(id: string): void {
    this.activeInstanceIds.add(id);
    // Set main instance if this is the first one
    if (!this.mainInstanceId) {
      this.mainInstanceId = id;
      logger.debug(`[Notifications] Set ${id} as main polling instance`);
    }
  }
  
  public removeInstance(id: string): void {
    this.activeInstanceIds.delete(id);
    
    // If the main instance was removed, select a new one
    if (this.mainInstanceId === id && this.activeInstanceIds.size > 0) {
      this.mainInstanceId = [...this.activeInstanceIds][0];
      logger.debug(`[Notifications] New main polling instance: ${this.mainInstanceId}`);
    } else if (this.activeInstanceIds.size === 0) {
      this.mainInstanceId = null;
    }
  }
  
  public isMainInstance(id: string): boolean {
    return this.mainInstanceId === id;
  }
  
  public getInstanceCount(): number {
    return this.activeInstanceIds.size;
  }
  
  public incrementHmrCount(): number {
    return ++this.hmrCount;
  }
  
  public getHmrCount(): number {
    return this.hmrCount;
  }
  
  public reset(): void {
    this.requestInProgress = false;
    this.lastFetchTime = 0;
    logger.debug('[Notifications] State manager reset');
  }
}

// Get the singleton instance
const notificationsState = NotificationsStateManager.getInstance();

/**
 * Hook for managing notification list with the unified list utilities
 */
export const useNotifications = ({ 
  limit = 10, 
  unreadOnly = false,
  page = 1,
  autoFetch = true,
  pollInterval = 300000 // Default to 5 minutes in milliseconds
}: UseNotificationsProps = {}): UseNotificationsResult => {
  // Always call hooks in the same order
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const logger = getLogger();
  
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
    if (notificationsState.isRequestInProgress()) {
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
    const timeSinceLastFetch = now - notificationsState.getLastFetchTime();
    if (notificationsState.getLastFetchTime() > 0 && timeSinceLastFetch < 5000) {
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
      notificationsState.setRequestInProgress(true);
      notificationsState.setLastFetchTime(now);
      fetchAttemptsRef.current += 1;
      
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
        notificationsState.setRequestInProgress(false);
      };
      
      // Await with timeout protection
      try {
        const result = await apiCall;
        cleanup();
        
        // If successful, update cached unread count
        if (result.success) {
          // Extract notifications from the response structure
          let notifications: NotificationResponseDto[] = [];
          
          if (result.data) {
            // Check for nested data structure
            if ('items' in result.data && Array.isArray(result.data.items)) {
              notifications = result.data.items;
            } else if ('data' in result.data && Array.isArray(result.data.data)) {
              notifications = result.data.data;
            } else if (Array.isArray(result.data)) {
              notifications = result.data;
            }
          }
          
          // Count unread items
          const unreadCount = notifications.filter((item: NotificationResponseDto) => !item.isRead).length;
          notificationsState.setCachedUnreadCount(unreadCount);
        }
        
        return result;
      } catch (error) {
        cleanup();
        
        if (error instanceof DOMException && error.name === 'AbortError') {
          logger.warn('[Notifications] Request aborted due to timeout');
        } else {
          logger.error('[Notifications] Error fetching:', error as Error);
          
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
      logger.error('[Notifications] Error in fetchFunction:', err as Error);
      notificationsState.setRequestInProgress(false);
      
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
  
  // Create the list configuration
  const listConfig = useMemo(() => ({
    fetchFunction: fetchNotifications,
    initialFilters: {
      page,
      limit,
      unreadOnly,
      sortBy: 'createdAt',
      sortDirection: 'desc' as 'desc' | 'asc'
    },
    defaultSortField: 'createdAt' as string,
    defaultSortDirection: 'desc' as 'desc' | 'asc',
    syncWithUrl: false,
    autoFetch: false // We'll control fetching manually
  }), [fetchNotifications, limit, page, unreadOnly]);
  
  // Directly create the BaseListUtility in the main body of the hook
  // This follows React's Rules of Hooks
  const baseList = createBaseListUtility<NotificationResponseDto, NotificationFilterParamsDto>(listConfig);
  
  // Store the list reference immediately
  baseListRef.current = baseList;
  
  // Calculate unread count using useMemo to avoid direct property access
  const unreadCount = useMemo(() => {
    if (!baseList?.items) {
      return notificationsState.getCachedUnreadCount();
    }
    
    const count = baseList.items
      .filter(notification => !notification.isRead)
      .length;
      
    return count || notificationsState.getCachedUnreadCount();
  }, [baseList?.items]);
  
  // Handle auto-fetch based on authentication status - simplified version
  useEffect(() => {
    // Skip if auth not ready or not authenticated
    if (!authReadyRef.current || !isAuthenticated || !user || !autoFetch) {
      return;
    }
    
    // Register this instance in the global state
    notificationsState.addInstance(instanceId.current);
    
    // Do initial fetch after a short delay
    if (!didInitialFetchRef.current && baseListRef.current) {
      const initialFetchTimer = setTimeout(() => {
        if (authStateRef.current.isAuthenticated && authStateRef.current.user && baseListRef.current) {
          didInitialFetchRef.current = true;
          baseListRef.current.refetch().catch(err => {
            logger.error('[Notifications] Initial fetch error:', err);
          });
        }
      }, 1000);
      
      // Set up polling only for the main instance
      if (pollInterval > 0 && notificationsState.isMainInstance(instanceId.current)) {
        intervalRef.current = setInterval(() => {
          if (authStateRef.current.isAuthenticated && authStateRef.current.user && baseListRef.current) {
            baseListRef.current.refetch().catch(err => {
              logger.error('[Notifications] Poll refetch error:', err);
            });
          }
        }, pollInterval);
      }
      
      return () => {
        clearTimeout(initialFetchTimer);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        notificationsState.removeInstance(instanceId.current);
      };
    }
    
    return () => {
      notificationsState.removeInstance(instanceId.current);
    };
  }, [isAuthenticated, user, autoFetch, pollInterval]);
  
  // Cleanup effect - simplified
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
      logger.error('Error marking notification as read:', err as Error);
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
        notificationsState.setCachedUnreadCount(0);
        
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
      logger.error('Error marking all notifications as read:', err as Error);
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
          const newCount = Math.max(0, notificationsState.getCachedUnreadCount() - 1);
          notificationsState.setCachedUnreadCount(newCount);
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
      logger.error('Error deleting notification:', err as Error);
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
        return notificationsState.getCachedUnreadCount();
      }
      
      // Make sure baseListRef.current exists
      if (!baseListRef.current) {
        return notificationsState.getCachedUnreadCount();
      }
      
      // Check if we should throttle
      const now = Date.now();
      if (now - notificationsState.getLastFetchTime() < 5000) {
        logger.debug('[Notifications] Throttling unread count fetch');
        
        // Safely get the current unread count with defensive null checks
        const items = baseListRef.current.items || [];
        return items.filter(item => !item.isRead).length || notificationsState.getCachedUnreadCount();
      }
      
      // Only the main instance should fetch
      if (!notificationsState.isMainInstance(instanceId.current)) {
        logger.debug('[Notifications] Delegating unread count fetch to main instance');
        return notificationsState.getCachedUnreadCount();
      }
      
      // Use the baseList's refetch method which will properly update the internal state
      await baseListRef.current.refetch().catch(err => {
        logger.error('[Notifications] Unread count fetch error:', err as Error);
      });
      
      // Ensure items exists with a default empty array
      const items = baseListRef.current.items || [];
      const newCount = items.filter(item => !item.isRead).length;
      notificationsState.setCachedUnreadCount(newCount);
      return newCount;
    } catch (err) {
      logger.error('Error fetching unread notification count:', err as Error);
      return notificationsState.getCachedUnreadCount();
    }
  }, []);  // No dependencies - auth state accessed via ref
  
  // Return the combined result
  return {
    ...baseList,
    notifications: baseList.items || [],
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchUnreadCount
  };
};

// Register HMR handler
if (typeof module !== 'undefined' && (module as any).hot) {
  (module as any).hot.dispose(() => {
    // Reset notification state during HMR
    notificationsState.reset();
    logger.debug('[Notifications] HMR dispose handler: Reset notification state');
  });
}

// Add default export for compatibility with import statements
export default useNotifications;