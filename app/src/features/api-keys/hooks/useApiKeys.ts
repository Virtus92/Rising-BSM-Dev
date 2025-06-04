'use client';

import { useState, useCallback } from 'react';
import { ApiClient } from '@/core/api/ApiClient';
import { 
  ApiKeyResponseDto, 
  CreateApiKeyDto, 
  CreateApiKeyResponseDto,
  ApiKeyFilterParamsDto,
  ApiKeyUsageStatsDto,
  UpdateApiKeyDto,
  RevokeApiKeyDto,
  UpdateApiKeyPermissionsDto
} from '@/domain/dtos/ApiKeyDtos';
import { formatResponse } from '@/core/errors';
import ApiKeyPermissionsDebugger from '../utils/ApiKeyPermissionsDebugger';

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKeyResponseDto[]>([]);
  const [stats, setStats] = useState<ApiKeyUsageStatsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async (filters?: ApiKeyFilterParamsDto) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const response = await ApiClient.get(`/api/api-keys?${params}`);
      
      console.log('📞 API Response for fetchApiKeys:', response);
      
      if (response.success) {
        const apiKeysData = response.data?.data || [];
        console.log('🔍 Raw API keys data from server:', apiKeysData);
        ApiKeyPermissionsDebugger.debugApiKeysList(apiKeysData, 'useApiKeys.fetchApiKeys');
        setApiKeys(apiKeysData);
      } else {
        throw new Error(response.message || 'Failed to fetch API keys');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch API keys';
      setError(errorMessage);
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);

      const response = await ApiClient.get('/api/api-keys/stats');
      
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(errorMessage);
      console.error('Error fetching stats:', err);
    }
  }, []);

  const createApiKey = useCallback(async (data: CreateApiKeyDto): Promise<CreateApiKeyResponseDto> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiClient.post('/api/api-keys', data);
      
      if (response.success) {
        // Refresh the list after creating
        await fetchApiKeys();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create API key');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create API key';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  const updateApiKey = useCallback(async (id: number, data: UpdateApiKeyDto): Promise<ApiKeyResponseDto> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiClient.put(`/api/api-keys/${id}`, data);
      
      if (response.success) {
        // Update the local state
        setApiKeys(prev => prev.map(key => 
          key.id === id ? response.data : key
        ));
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update API key');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update API key';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteApiKey = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiClient.delete(`/api/api-keys/${id}`);
      
      if (response.success) {
        // Remove from local state
        setApiKeys(prev => prev.filter(key => key.id !== id));
      } else {
        throw new Error(response.message || 'Failed to delete API key');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete API key';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeApiKey = useCallback(async (id: number, data: RevokeApiKeyDto): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiClient.post(`/api/api-keys/${id}/revoke`, data);
      
      if (response.success) {
        // Refresh the list to get updated status
        await fetchApiKeys();
      } else {
        throw new Error(response.message || 'Failed to revoke API key');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke API key';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  const updateApiKeyPermissions = useCallback(async (data: UpdateApiKeyPermissionsDto): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiClient.put(`/api/api-keys/${data.apiKeyId}/permissions`, {
        permissions: data.permissions
      });
      
      if (response.success) {
        // Refresh the list to get updated permissions
        await fetchApiKeys();
      } else {
        throw new Error(response.message || 'Failed to update API key permissions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update API key permissions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  const getApiKeyPermissions = useCallback(async (id: number): Promise<string[]> => {
    try {
      setError(null);

      const response = await ApiClient.get(`/api/api-keys/${id}/permissions`);
      
      if (response.success) {
        return response.data?.permissions || [];
      } else {
        throw new Error(response.message || 'Failed to get API key permissions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get API key permissions';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const activateApiKey = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiClient.patch(`/api/api-keys/${id}/activate`);
      
      if (response.success) {
        // Refresh the list to get updated status
        await fetchApiKeys();
      } else {
        throw new Error(response.message || 'Failed to activate API key');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate API key';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  const deactivateApiKey = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await ApiClient.patch(`/api/api-keys/${id}/deactivate`);
      
      if (response.success) {
        // Refresh the list to get updated status
        await fetchApiKeys();
      } else {
        throw new Error(response.message || 'Failed to deactivate API key');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate API key';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    apiKeys,
    stats,
    loading,
    error,

    // Actions
    fetchApiKeys,
    fetchStats,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    revokeApiKey,
    updateApiKeyPermissions,
    getApiKeyPermissions,
    activateApiKey,
    deactivateApiKey,
    clearError
  };
}
