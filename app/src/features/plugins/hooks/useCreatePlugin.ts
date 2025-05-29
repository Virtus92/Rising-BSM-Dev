'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/useToast';
import { PluginClient } from '../lib/clients/PluginClient';
import { CreatePluginDto } from '@/domain/dtos/PluginDtos';

/**
 * Hook for creating a new plugin
 */
export const useCreatePlugin = () => {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create plugin mutation
  const createPluginMutation = useMutation({
    mutationFn: async (data: CreatePluginDto) => {
      const response = await PluginClient.createPlugin(data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to create plugin');
    },
    onSuccess: (data) => {
      toast?.({
        title: 'Plugin created',
        description: 'Your plugin has been successfully created',
        variant: 'success'
      });
      
      // Invalidate plugins list
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      
      // Navigate to the plugin detail page
      router.push(`/dashboard/plugins/${data.id}`);
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create plugin',
        variant: 'destructive'
      });
    }
  });
  
  return {
    createPlugin: createPluginMutation.mutate,
    isCreating: createPluginMutation.isPending,
    isSuccess: createPluginMutation.isSuccess,
    error: createPluginMutation.error
  };
};