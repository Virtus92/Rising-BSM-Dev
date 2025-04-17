'use client';

import { useState, useEffect, useCallback } from 'react';
import { PermissionClient } from '@/infrastructure/api/PermissionClient';
import { SystemPermission } from '@/domain/enums/PermissionEnums';

/**
 * Hook for managing and checking user permissions
 * 
 * @param userId - User ID to get permissions for
 * @returns Permission-related state and utility functions
 */
export const usePermissions = (userId?: number) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user permissions
  const fetchPermissions = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await PermissionClient.getUserPermissions(userId);
      
      if (response.success && response.data) {
        setPermissions(response.data.permissions || []);
        setUserRole(response.data.role || null);
      } else {
        setError(response.message || 'Failed to fetch user permissions');
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('An unexpected error occurred while fetching permissions');
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load permissions on component mount or userId change
  useEffect(() => {
    if (userId) {
      fetchPermissions();
    } else {
      setPermissions([]);
      setIsLoading(false);
    }
  }, [userId, fetchPermissions]);

  /**
   * Checks if the user has a specific permission
   * 
   * @param permission - Permission to check for
   * @returns Whether the user has the permission
   */
  const hasPermission = useCallback((permission: SystemPermission | string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  /**
   * Checks if the user has any of the given permissions
   * 
   * @param permissionList - List of permissions to check
   * @returns Whether the user has any of the permissions
   */
  const hasAnyPermission = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  }, [permissions]);

  /**
   * Checks if the user has all of the given permissions
   * 
   * @param permissionList - List of permissions to check
   * @returns Whether the user has all of the permissions
   */
  const hasAllPermissions = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission));
  }, [permissions]);
  
  /**
   * Updates user permissions
   * 
   * @param newPermissions - New permissions to set
   * @returns Promise with success status
   */
  const updatePermissions = async (newPermissions: string[]): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await PermissionClient.updateUserPermissions({
        userId,
        permissions: newPermissions
      });
      
      if (response.success) {
        setPermissions(newPermissions);
        return true;
      } else {
        setError(response.message || 'Failed to update user permissions');
        return false;
      }
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError('An unexpected error occurred while updating permissions');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permissions,
    userRole,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    updatePermissions,
    refetch: fetchPermissions
  };
};

/**
 * Permission check utility for functional components
 * 
 * @param permission - Permission to check
 * @param userPermissions - List of user permissions
 * @returns Whether the user has the permission
 */
export const checkPermission = (
  permission: SystemPermission | string,
  userPermissions: string[]
): boolean => {
  return userPermissions.includes(permission);
};
