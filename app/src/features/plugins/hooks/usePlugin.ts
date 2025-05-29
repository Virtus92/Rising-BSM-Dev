'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/useToast';
import { PluginClient } from '../lib/clients/PluginClient';
import { UpdatePluginDto } from '@/domain/dtos/PluginDtos';

/**
 * Hook for managing a single plugin
 */
export const usePlugin = (pluginId: number | string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch plugin details
  const {
    data: plugin,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['plugin', pluginId],
    queryFn: async () => {
      const response = await PluginClient.getPlugin(pluginId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch plugin');
    },
    enabled: !!pluginId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Update plugin mutation
  const updatePluginMutation = useMutation({
    mutationFn: async (data: UpdatePluginDto) => {
      const response = await PluginClient.updatePlugin(pluginId, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update plugin');
    },
    onSuccess: (data) => {
      toast?.({
        title: 'Plugin updated',
        description: 'The plugin has been successfully updated',
        variant: 'success'
      });
      queryClient.setQueryData(['plugin', pluginId], data);
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update plugin',
        variant: 'destructive'
      });
    }
  });
  
  // Delete plugin mutation
  const deletePluginMutation = useMutation({
    mutationFn: async () => {
      const response = await PluginClient.deletePlugin(pluginId);
      if (response.success) {
        return true;
      }
      throw new Error(response.message || 'Failed to delete plugin');
    },
    onSuccess: () => {
      toast?.({
        title: 'Plugin deleted',
        description: 'The plugin has been successfully deleted',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      queryClient.removeQueries({ queryKey: ['plugin', pluginId] });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete plugin',
        variant: 'destructive'
      });
    }
  });
  
  // Approve plugin mutation
  const approvePluginMutation = useMutation({
    mutationFn: async () => {
      const response = await PluginClient.approvePlugin(pluginId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to approve plugin');
    },
    onSuccess: (data) => {
      toast?.({
        title: 'Plugin approved',
        description: 'The plugin has been approved for the marketplace',
        variant: 'success'
      });
      queryClient.setQueryData(['plugin', pluginId], data);
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve plugin',
        variant: 'destructive'
      });
    }
  });
  
  // Reject plugin mutation
  const rejectPluginMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await PluginClient.rejectPlugin(pluginId, reason);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to reject plugin');
    },
    onSuccess: (data) => {
      toast?.({
        title: 'Plugin rejected',
        description: 'The plugin has been rejected',
        variant: 'success'
      });
      queryClient.setQueryData(['plugin', pluginId], data);
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject plugin',
        variant: 'destructive'
      });
    }
  });
  
  // Publish plugin mutation
  const publishPluginMutation = useMutation({
    mutationFn: async () => {
      const response = await PluginClient.publishPlugin(pluginId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to publish plugin');
    },
    onSuccess: (data) => {
      toast?.({
        title: 'Plugin published',
        description: 'The plugin has been published to the marketplace',
        variant: 'success'
      });
      queryClient.setQueryData(['plugin', pluginId], data);
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to publish plugin',
        variant: 'destructive'
      });
    }
  });
  
  // Fetch plugin statistics
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['plugin-stats', pluginId],
    queryFn: async () => {
      const response = await PluginClient.getPluginStats(pluginId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch plugin statistics');
    },
    enabled: !!pluginId && !!plugin,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return {
    plugin,
    isLoading,
    error,
    refetch,
    
    // Statistics
    stats,
    isLoadingStats,
    refetchStats,
    
    // Actions
    updatePlugin: updatePluginMutation.mutate,
    isUpdatingPlugin: updatePluginMutation.isPending,
    
    deletePlugin: deletePluginMutation.mutate,
    isDeletingPlugin: deletePluginMutation.isPending,
    
    approvePlugin: approvePluginMutation.mutate,
    isApprovingPlugin: approvePluginMutation.isPending,
    
    rejectPlugin: rejectPluginMutation.mutate,
    isRejectingPlugin: rejectPluginMutation.isPending,
    
    publishPlugin: publishPluginMutation.mutate,
    isPublishingPlugin: publishPluginMutation.isPending
  };
};