'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/useToast';
import { PluginClient } from '../lib/clients/PluginClient';
import { PluginInstallationDto, InstallPluginDto } from '@/domain/dtos/PluginDtos';

/**
 * Hook for managing plugin installations
 */
export const usePluginInstallations = (userId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [heartbeatIntervals, setHeartbeatIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  
  // Fetch user's installations
  const {
    data: installations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['plugin-installations', userId],
    queryFn: async () => {
      const response = await PluginClient.getUserInstallations(userId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch installations');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Install plugin mutation
  const installPluginMutation = useMutation({
    mutationFn: async (data: InstallPluginDto) => {
      const response = await PluginClient.installPlugin(data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to install plugin');
    },
    onSuccess: (data) => {
      toast?.({
        title: 'Plugin installed',
        description: 'The plugin has been successfully installed',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['plugin-installations'] });
      
      // Start heartbeat for the new installation
      startHeartbeat(data.installationId);
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to install plugin',
        variant: 'destructive'
      });
    }
  });
  
  // Uninstall plugin mutation
  const uninstallPluginMutation = useMutation({
    mutationFn: async (installationId: string) => {
      const response = await PluginClient.uninstallPlugin(installationId);
      if (response.success) {
        return installationId;
      }
      throw new Error(response.message || 'Failed to uninstall plugin');
    },
    onSuccess: (installationId) => {
      toast?.({
        title: 'Plugin uninstalled',
        description: 'The plugin has been successfully uninstalled',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['plugin-installations'] });
      
      // Stop heartbeat for the uninstalled plugin
      stopHeartbeat(installationId);
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to uninstall plugin',
        variant: 'destructive'
      });
    }
  });
  
  // Update installation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      installationId, 
      status 
    }: { 
      installationId: string; 
      status: 'active' | 'inactive' 
    }) => {
      const response = await PluginClient.updateInstallationStatus(installationId, status);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update installation status');
    },
    onSuccess: (data) => {
      toast?.({
        title: 'Status updated',
        description: `Plugin is now ${data.status}`,
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['plugin-installations'] });
      
      // Manage heartbeat based on status
      if (data.status === 'active') {
        startHeartbeat(data.installationId);
      } else {
        stopHeartbeat(data.installationId);
      }
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive'
      });
    }
  });
  
  // Start heartbeat for an installation
  const startHeartbeat = useCallback((installationId: string) => {
    // Clear existing interval if any
    stopHeartbeat(installationId);
    
    // Send heartbeat every 5 minutes
    const interval = setInterval(async () => {
      try {
        await PluginClient.sendHeartbeat(installationId);
      } catch (error) {
        console.error(`Failed to send heartbeat for installation ${installationId}:`, error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    setHeartbeatIntervals(prev => new Map(prev).set(installationId, interval));
  }, []);
  
  // Stop heartbeat for an installation
  const stopHeartbeat = useCallback((installationId: string) => {
    const interval = heartbeatIntervals.get(installationId);
    if (interval) {
      clearInterval(interval);
      setHeartbeatIntervals(prev => {
        const newMap = new Map(prev);
        newMap.delete(installationId);
        return newMap;
      });
    }
  }, [heartbeatIntervals]);
  
  // Start heartbeats for active installations on mount
  useEffect(() => {
    if (installations) {
      installations
        .filter(inst => inst.status === 'active')
        .forEach(inst => startHeartbeat(inst.installationId));
    }
    
    // Cleanup on unmount
    return () => {
      heartbeatIntervals.forEach(interval => clearInterval(interval));
    };
  }, [installations]);
  
  // Get execution history for an installation
  const getExecutionHistory = useCallback(async (
    installationId: string,
    page: number = 1,
    limit: number = 20
  ) => {
    const response = await PluginClient.getExecutionHistory(installationId, { page, limit });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch execution history');
  }, []);
  
  return {
    installations: installations || [],
    isLoading,
    error,
    refetch,
    
    // Actions
    installPlugin: installPluginMutation.mutate,
    isInstallingPlugin: installPluginMutation.isPending,
    
    uninstallPlugin: uninstallPluginMutation.mutate,
    isUninstallingPlugin: uninstallPluginMutation.isPending,
    
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    
    getExecutionHistory,
    
    // Heartbeat management
    startHeartbeat,
    stopHeartbeat
  };
};