/**
 * Permission Client Hook
 * 
 * Provides a hook to access permission-related API functions.
 */
import { useCallback } from 'react';
import { ApiClient } from '@/core/api/ApiClient';

/**
 * Hook for interacting with permission APIs
 */
export function usePermissionClient() {
  const apiClient = ApiClient;
  
  /**
   * Initializes the permission system
   * 
   * @param force - Whether to force overwrite existing permissions
   * @returns Promise with API response
   */
  const initializePermissions = useCallback(async (force: boolean = false) => {
    try {
      const response = await apiClient.post('/api/permissions/initialize', { force });
      return response.data;
    } catch (error) {
      console.error('Failed to initialize permissions', error);
      throw error;
    }
  }, [apiClient]);
  
  /**
   * Checks if a user has a specific permission
   * 
   * @param userId - User ID
   * @param permission - Permission code
   * @returns Promise with boolean
   */
  const hasPermission = useCallback(async (userId: number, permission: string) => {
    try {
      const response = await apiClient.get(`/api/permissions/check?userId=${userId}&permission=${permission}`);
      return response.data?.data?.hasPermission || false;
    } catch (error) {
      console.error('Failed to check permission', error);
      return false;
    }
  }, [apiClient]);
  
  /**
   * Gets all permission data from the API
   * 
   * @returns Promise with permission list
   */
  const getAllPermissions = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/permissions');
      return response.data;
    } catch (error) {
      console.error('Failed to get permissions', error);
      throw error;
    }
  }, [apiClient]);
  
  /**
   * Gets default permissions for a specific role
   * 
   * @param role - Role name
   * @returns Promise with permission list
   */
  const getRolePermissions = useCallback(async (role: string) => {
    try {
      const response = await apiClient.get(`/api/permissions/role-defaults/${role}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get permissions for role ${role}`, error);
      throw error;
    }
  }, [apiClient]);
  
  return {
    initializePermissions,
    hasPermission,
    getAllPermissions,
    getRolePermissions
  };
}
