'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PermissionClient } from '@/infrastructure/api/PermissionClient';
import { SystemPermission, getPermissionsForRole } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/entities/User';
import { useAuth } from '@/features/auth/providers/AuthProvider';

// Global cache for permissions to minimize API calls
const permissionsCache = new Map<number, {
  permissions: string[];
  role: string;
  timestamp: number;
}>();

// Cache timeout in milliseconds (5 minutes)
const PERMISSIONS_CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Hook for managing and checking user permissions
 * 
 * @param userId - User ID to get permissions for (defaults to current user)
 * @returns Permission-related state and utility functions
 */
export const usePermissions = (userId?: number) => {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Check if user is admin for optimizations
  const isAdmin = useMemo(() => {
    return userRole === UserRole.ADMIN || user?.role === UserRole.ADMIN;
  }, [userRole, user?.role]);

  // Fetch user permissions with caching
  const fetchPermissions = useCallback(async (force: boolean = false) => {
    if (!effectiveUserId) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first if not forcing refresh
      if (!force) {
        const cachedData = permissionsCache.get(effectiveUserId);
        if (cachedData && (Date.now() - cachedData.timestamp < PERMISSIONS_CACHE_TIMEOUT)) {
          if (process.env.NODE_ENV === 'development') {
            console.debug(`Using cached permissions for user ID: ${effectiveUserId}`);
          }
          setPermissions(cachedData.permissions);
          setUserRole(cachedData.role);
          setIsLoading(false);
          return;
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Fetching permissions for user ID: ${effectiveUserId}`);
      }
      
      const response = await PermissionClient.getUserPermissions(effectiveUserId);
      
      if (response.success && response.data) {
        const perms = response.data.permissions || [];
        const role = response.data.role || null;
        
        // Update state
        setPermissions(perms);
        setUserRole(role);
        
        // Update cache
        if (role) {
          permissionsCache.set(effectiveUserId, {
            permissions: perms,
            role,
            timestamp: Date.now()
          });
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Loaded ${perms.length} permissions for user ID: ${effectiveUserId} with role: ${role}`);
        }
      } else {
        console.error('Error in permission response:', response.message);
        setError(response.message || 'Failed to fetch user permissions');
        setPermissions([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error fetching permissions:', errorMessage);
      setError('An unexpected error occurred while fetching permissions');
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]); // Use effectiveUserId instead of userId to avoid dependency issues

  // Load permissions on component mount or userId change
  useEffect(() => {
    fetchPermissions();
    
    // Refresh permissions cache every 5 minutes for long-lived components
    const refreshInterval = setInterval(() => {
      if (effectiveUserId) {
        fetchPermissions(true); // Force refresh
      }
    }, PERMISSIONS_CACHE_TIMEOUT);
    
    return () => clearInterval(refreshInterval);
  }, [effectiveUserId, fetchPermissions]);

  /**
   * Checks if the user has a specific permission
   * 
   * @param permission - Permission to check for
   * @returns Whether the user has the permission
   */
  const hasPermission = useCallback((permission: SystemPermission | string): boolean => {
    // Admin users automatically have all permissions
    if (isAdmin) return true;
    
    return permissions.includes(permission);
  }, [permissions, isAdmin]);

  /**
   * Checks if the user has any of the given permissions
   * 
   * @param permissionList - List of permissions to check
   * @returns Whether the user has any of the permissions
   */
  const hasAnyPermission = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    // Admin users automatically have all permissions
    if (isAdmin) return true;
    
    return permissionList.some(permission => permissions.includes(permission));
  }, [permissions, isAdmin]);

  /**
   * Checks if the user has all of the given permissions
   * 
   * @param permissionList - List of permissions to check
   * @returns Whether the user has all of the permissions
   */
  const hasAllPermissions = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    // Admin users automatically have all permissions
    if (isAdmin) return true;
    
    return permissionList.every(permission => permissions.includes(permission));
  }, [permissions, isAdmin]);
  
  /**
   * Updates user permissions
   * 
   * @param newPermissions - New permissions to set
   * @returns Promise with success status
   */
  const updatePermissions = async (newPermissions: string[]): Promise<boolean> => {
    if (!effectiveUserId) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await PermissionClient.updateUserPermissions({
        userId: effectiveUserId,
        permissions: newPermissions
      });
      
      if (response.success) {
        // Update state and cache
        setPermissions(newPermissions);
        
        if (userRole) {
          permissionsCache.set(effectiveUserId, {
            permissions: newPermissions,
            role: userRole,
            timestamp: Date.now()
          });
        }
        
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
 * @param userRole - User role for admin check
 * @returns Whether the user has the permission
 */
export const checkPermission = (
  permission: SystemPermission | string,
  userPermissions: string[],
  userRole?: string
): boolean => {
  // Admin users automatically have all permissions
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  return userPermissions.includes(permission);
};

/**
 * Utility to clear the permissions cache for a specific user
 * Call this after major permission changes or role updates
 * 
 * @param userId - User ID to clear from cache
 */
export const clearPermissionsCache = (userId: number): void => {
  if (permissionsCache.has(userId)) {
    permissionsCache.delete(userId);
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Cleared permissions cache for user ${userId}`);
    }
  }
};

/**
 * Utility to clear the entire permissions cache
 * Call this after system-wide permission changes
 */
export const clearAllPermissionsCache = (): void => {
  permissionsCache.clear();
  if (process.env.NODE_ENV === 'development') {
    console.debug('Cleared all permissions cache');
  }
};
