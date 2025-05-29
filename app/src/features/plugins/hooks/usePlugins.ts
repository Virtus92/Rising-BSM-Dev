'use client';

import { useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';
import { PluginClient } from '../lib/clients/PluginClient';
import { PluginDto, PluginSearchDto } from '@/domain/dtos/PluginDtos';
import { createBaseListUtility, BaseListUtility } from '@/shared/utils/list/baseListUtils';

/**
 * Extended interface for plugin list operations
 */
export interface UsePluginsResult extends BaseListUtility<PluginDto, PluginSearchDto> {
  // Alias for better semantics
  plugins: PluginDto[];
  
  // Plugin-specific operations
  approvePlugin: (id: number) => Promise<boolean>;
  rejectPlugin: (id: number, reason: string) => Promise<boolean>;
  publishPlugin: (id: number) => Promise<boolean>;
  deletePlugin: (id: number) => Promise<boolean>;
  
  // Filtering operations
  filterByType: (type: 'ui' | 'api' | 'automation' | 'mixed' | undefined) => void;
  filterByCategory: (category: string | undefined) => void;
  filterByStatus: (status: 'pending' | 'approved' | 'rejected' | 'suspended' | undefined) => void;
  filterByRating: (minRating: number | undefined) => void;
  
  // Sort operations
  setSortField: (field: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
}

/**
 * Hook for managing plugin marketplace with unified list utilities
 */
export const usePlugins = (initialFilters?: Partial<PluginSearchDto>): UsePluginsResult => {
  const { toast } = useToast();
  
  // Map UI sort field to actual database column
  const mapSortFieldToColumn = (field: string): string => {
    const fieldMap: Record<string, string> = {
      'name': 'name',
      'displayName': 'displayName',
      'author': 'author',
      'type': 'type',
      'category': 'category',
      'status': 'status',
      'downloads': 'downloads',
      'rating': 'rating',
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      'version': 'version',
      'id': 'createdAt'
    };
    
    return fieldMap[field] || 'createdAt';
  };

  // Use the base list utility
  const baseList = createBaseListUtility<PluginDto, PluginSearchDto>({
    fetchFunction: async (filters) => {
      // Map the sortBy field to an actual database column before sending to API
      const mappedFilters = { ...filters };
      if (mappedFilters.sortBy) {
        mappedFilters.sortBy = mapSortFieldToColumn(mappedFilters.sortBy);
      }
      
      // Ensure we have valid sort direction
      if (mappedFilters.sortDirection && !['asc', 'desc'].includes(mappedFilters.sortDirection)) {
        mappedFilters.sortDirection = 'desc';
      }
      
      // Validate and fix pagination
      if (mappedFilters.page && mappedFilters.page < 1) {
        mappedFilters.page = 1;
      }
      if (mappedFilters.limit && (mappedFilters.limit < 1 || mappedFilters.limit > 100)) {
        mappedFilters.limit = 20; // Default to 20 for plugin marketplace
      }
      
      try {
        return await PluginClient.searchPlugins(mappedFilters);
      } catch (err) {
        console.error('Error in usePlugins fetchFunction:', err);
        throw err;
      }
    },
    initialFilters: {
      page: 1,
      limit: 20,
      sortBy: 'downloads',
      sortDirection: 'desc',
      ...initialFilters
    } as PluginSearchDto,
    defaultSortField: 'downloads',
    defaultSortDirection: 'desc',
    syncWithUrl: true,
    urlFilterConfig: {
      numeric: ['page', 'limit', 'minRating'] as Array<keyof PluginSearchDto>,
      boolean: [] as Array<keyof PluginSearchDto>,
      enum: {
        type: ['ui', 'api', 'automation', 'mixed'],
        status: ['pending', 'approved', 'rejected', 'suspended'],
        sortDirection: ['asc', 'desc']
      } as Record<keyof PluginSearchDto, any[]>
    }
  });
  
  /**
   * Approve a plugin for marketplace
   */
  const approvePlugin = useCallback(async (pluginId: number) => {
    try {
      const response = await PluginClient.approvePlugin(pluginId);
      
      if (response.success) {
        toast?.({ 
          title: 'Plugin approved',
          description: 'The plugin has been approved for the marketplace.',
          variant: 'success'
        });
        
        // Refresh the list
        baseList.refetch();
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to approve plugin',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error approving plugin:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Reject a plugin
   */
  const rejectPlugin = useCallback(async (pluginId: number, reason: string) => {
    try {
      const response = await PluginClient.rejectPlugin(pluginId, reason);
      
      if (response.success) {
        toast?.({ 
          title: 'Plugin rejected',
          description: 'The plugin has been rejected.',
          variant: 'success'
        });
        
        // Refresh the list
        baseList.refetch();
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to reject plugin',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error rejecting plugin:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Publish a plugin to marketplace
   */
  const publishPlugin = useCallback(async (pluginId: number) => {
    try {
      const response = await PluginClient.publishPlugin(pluginId);
      
      if (response.success) {
        toast?.({ 
          title: 'Plugin published',
          description: 'The plugin has been published to the marketplace.',
          variant: 'success'
        });
        
        // Refresh the list
        baseList.refetch();
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to publish plugin',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error publishing plugin:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Delete a plugin
   */
  const deletePlugin = useCallback(async (pluginId: number) => {
    try {
      const response = await PluginClient.deletePlugin(pluginId);
      
      if (response.success) {
        toast?.({ 
          title: 'Plugin deleted',
          description: 'The plugin has been successfully deleted.',
          variant: 'success'
        });
        
        // Refresh the list
        baseList.refetch();
        return true;
      } else {
        toast?.({ 
          title: 'Error',
          description: response.message || 'Failed to delete plugin',
          variant: 'destructive'
        });
        return false;
      }
    } catch (err) {
      console.error('Error deleting plugin:', err);
      toast?.({ 
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast, baseList]);
  
  /**
   * Filter plugins by type
   */
  const filterByType = useCallback((type: 'ui' | 'api' | 'automation' | 'mixed' | undefined) => {
    baseList.setFilter('type', type);
  }, [baseList]);
  
  /**
   * Filter plugins by category
   */
  const filterByCategory = useCallback((category: string | undefined) => {
    baseList.setFilter('category', category);
  }, [baseList]);
  
  /**
   * Filter plugins by status
   */
  const filterByStatus = useCallback((status: 'pending' | 'approved' | 'rejected' | 'suspended' | undefined) => {
    baseList.setFilter('status', status);
  }, [baseList]);
  
  /**
   * Filter plugins by minimum rating
   */
  const filterByRating = useCallback((minRating: number | undefined) => {
    baseList.setFilter('minRating', minRating);
  }, [baseList]);
  
  return {
    ...baseList,
    // Alias items as plugins for better semantics
    plugins: baseList.items,
    
    // Plugin-specific methods
    approvePlugin,
    rejectPlugin,
    publishPlugin,
    deletePlugin,
    filterByType,
    filterByCategory,
    filterByStatus,
    filterByRating,
    
    // Sort methods (aliases for baseList methods)
    setSortField: (field: string) => baseList.setSort(field, baseList.filters.sortDirection || 'desc'),
    setSortDirection: (direction: 'asc' | 'desc') => baseList.setSort(baseList.filters.sortBy || 'downloads', direction)
  };
};