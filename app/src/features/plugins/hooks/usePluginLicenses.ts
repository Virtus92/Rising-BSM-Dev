'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/useToast';
import { PluginClient } from '../lib/clients/PluginClient';
import { PluginLicenseDto, GenerateLicenseDto, VerifyLicenseDto } from '@/domain/dtos/PluginDtos';

/**
 * Hook for managing plugin licenses
 */
export const usePluginLicenses = (userId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user's licenses
  const {
    data: licenses,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['plugin-licenses', userId],
    queryFn: async () => {
      const response = await PluginClient.getUserLicenses(userId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch licenses');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Generate license mutation
  const generateLicenseMutation = useMutation({
    mutationFn: async (data: GenerateLicenseDto) => {
      const response = await PluginClient.generateLicense(data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to generate license');
    },
    onSuccess: (data) => {
      toast?.({
        title: 'License generated',
        description: `License key: ${data.licenseKey}`,
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['plugin-licenses'] });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate license',
        variant: 'destructive'
      });
    }
  });
  
  // Verify license mutation
  const verifyLicenseMutation = useMutation({
    mutationFn: async (data: VerifyLicenseDto) => {
      const response = await PluginClient.verifyLicense(data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to verify license');
    },
    onSuccess: (data) => {
      toast?.({
        title: data.valid ? 'License valid' : 'License invalid',
        description: data.valid ? 'The license is valid and active' : 'The license is invalid or expired',
        variant: data.valid ? 'success' : 'destructive'
      });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify license',
        variant: 'destructive'
      });
    }
  });
  
  // Revoke license mutation
  const revokeLicenseMutation = useMutation({
    mutationFn: async ({ licenseKey, reason }: { licenseKey: string; reason: string }) => {
      const response = await PluginClient.revokeLicense(licenseKey, reason);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to revoke license');
    },
    onSuccess: () => {
      toast?.({
        title: 'License revoked',
        description: 'The license has been successfully revoked',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['plugin-licenses'] });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke license',
        variant: 'destructive'
      });
    }
  });
  
  // Transfer license mutation
  const transferLicenseMutation = useMutation({
    mutationFn: async ({ licenseKey, newUserId }: { licenseKey: string; newUserId: number }) => {
      const response = await PluginClient.transferLicense(licenseKey, newUserId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to transfer license');
    },
    onSuccess: () => {
      toast?.({
        title: 'License transferred',
        description: 'The license has been successfully transferred',
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['plugin-licenses'] });
    },
    onError: (error) => {
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to transfer license',
        variant: 'destructive'
      });
    }
  });
  
  return {
    licenses: licenses || [],
    isLoading,
    error,
    refetch,
    
    // Actions
    generateLicense: generateLicenseMutation.mutate,
    isGeneratingLicense: generateLicenseMutation.isPending,
    
    verifyLicense: verifyLicenseMutation.mutate,
    isVerifyingLicense: verifyLicenseMutation.isPending,
    
    revokeLicense: revokeLicenseMutation.mutate,
    isRevokingLicense: revokeLicenseMutation.isPending,
    
    transferLicense: transferLicenseMutation.mutate,
    isTransferringLicense: transferLicenseMutation.isPending
  };
};