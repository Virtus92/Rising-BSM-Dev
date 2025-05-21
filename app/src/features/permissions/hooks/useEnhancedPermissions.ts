'use client';

/**
 * useEnhancedPermissions.ts
 * 
 * A hook that provides efficient, deduplicated access to user permissions
 * by integrating the PermissionRequestManager.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import PermissionRequestManager from '../lib/utils/PermissionRequestManager';
import { getLogger } from '@/core/logging';

const logger = getLogger();

export function useEnhancedPermissions() {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the permission manager singleton
  const permissionManager = PermissionRequestManager.getInstance();
  
  /**
   * Check if the user has a specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!permission || !permissions.length) {
      return false;
    }
    
    return permissions.includes(permission);
  }, [permissions]);
  
  /**
   * Check if the user has any of the specified permissions
   */
  const hasAnyPermission = useCallback((requiredPermissions: string[]): boolean => {
    if (!requiredPermissions.length || !permissions.length) {
      return false;
    }
    
    return requiredPermissions.some(permission => permissions.includes(permission));
  }, [permissions]);
  
  /**
   * Check if the user has all of the specified permissions
   */
  const hasAllPermissions = useCallback((requiredPermissions: string[]): boolean => {
    if (!requiredPermissions.length) {
      return true;
    }
    
    if (!permissions.length) {
      return false;
    }
    
    return requiredPermissions.every(permission => permissions.includes(permission));
  }, [permissions]);
  
  /**
   * Load permissions for the current user
   */
  const loadPermissions = useCallback(async (options?: { force?: boolean }): Promise<string[]> => {
    // Skip if no user or not authenticated
    if (!user?.id || !isAuthenticated) {
      setPermissions([]);
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Generate a unique request ID
      const requestId = `user-permissions-${user.id}-${Date.now()}`;
      
      // Get permissions through the manager
      const userPermissions = await permissionManager.getAllPermissions(
        user.id, 
        user.role || 'user'
      );
      
      setPermissions(userPermissions);
      setLoading(false);
      
      return userPermissions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error loading permissions:', err as Error);
      
      setError(errorMessage);
      setLoading(false);
      
      // Return empty permissions on error
      return [];
    }
  }, [user, isAuthenticated, permissionManager]);
  
  /**
   * Load permissions on mount and when user changes
   */
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      loadPermissions();
    } else {
      setPermissions([]);
    }
  }, [user?.id, isAuthenticated, loadPermissions]);
  
  /**
   * Check if permissions are cached to avoid unnecessary loading
   */
  const hasCachedPermissions = useCallback((): boolean => {
    return !!user?.id && permissionManager.hasUserPermissionsCached(user.id);
  }, [user?.id, permissionManager]);
  
  /**
   * Clear the permission cache to force fresh fetching
   */
  const clearCache = useCallback((): void => {
    if (user?.id) {
      permissionManager.clearUserCache(user.id);
    }
  }, [user?.id, permissionManager]);
  
  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loadPermissions,
    hasCachedPermissions,
    clearCache,
    loading,
    error
  };
}

export default useEnhancedPermissions;