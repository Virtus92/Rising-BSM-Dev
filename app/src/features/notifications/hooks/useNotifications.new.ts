'use client';

import { useCallback } from 'react';
import { useNotificationContext } from '../providers/NotificationProvider';
import { NotificationFilterParamsDto } from '@/domain/dtos/NotificationDtos';

/**
 * Modern hook for notifications that leverages the NotificationContext
 * This hook replaces the older useNotifications implementation
 */
export function useNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  const {
    state,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    fetchMore,
    updateFilters,
    resetFilters
  } = useNotificationContext();

  // Initialize with custom options if provided
  const initializeFilters = useCallback(() => {
    if (options) {
      updateFilters({
        limit: options.limit,
        unreadOnly: options.unreadOnly,
        sortField: options.sortField,
        sortDirection: options.sortDirection
      });
    }
  }, [options, updateFilters]);

  // Set up filters on first render
  if (options) {
    initializeFilters();
  }

  return {
    // Data
    notifications: state.notifications,
    isLoading: state.isLoading,
    error: state.error,
    unreadCount: state.unreadCount,
    hasMore: state.hasMore,
    filters: state.filters,

    // Pagination info
    pagination: {
      page: state.filters.page || 1,
      limit: state.filters.limit || 10,
      hasMore: state.hasMore,
      total: state.notifications.length // This is an estimation
    },

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: () => fetchNotifications(true),
    fetchMore,
    setFilters: updateFilters,
    resetFilters,

    // Backwards compatibility methods
    setPage: (page: number) => updateFilters({ page }),
    setLimit: (limit: number) => updateFilters({ limit }),
    setSearch: (search: string) => updateFilters({ search }),
    setSort: (field: string, direction: 'asc' | 'desc') => 
      updateFilters({ sortField: field, sortDirection: direction }),
    setFilter: (key: string, value: any) => {
      const update: Partial<NotificationFilterParamsDto> = {};
      update[key as keyof NotificationFilterParamsDto] = value;
      updateFilters(update);
    },
    clearFilter: (key: string) => {
      const update: Partial<NotificationFilterParamsDto> = {};
      update[key as keyof NotificationFilterParamsDto] = undefined;
      updateFilters(update);
    },
    clearAllFilters: resetFilters
  };
}

export default useNotifications;
