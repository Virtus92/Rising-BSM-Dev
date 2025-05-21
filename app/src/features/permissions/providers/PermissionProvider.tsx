'use client';

/**
 * PermissionProvider.tsx
 *
 * React context provider for application permissions that follows a clean, 
 * structured approach with proper loading, caching, and error handling.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { getLogger } from '@/core/logging';
import { useAuth } from '@/features/auth/providers/AuthProvider';

// Logger instance
const logger = getLogger();

// Permission interface defining shape of a permission
export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
}

// Context value interface
export interface PermissionContextValue {
  // State
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isInitialized: boolean;

  // Methods
  hasPermission: (permissionCode: string | string[]) => boolean;
  loadPermissions: () => Promise<boolean>;
  getPermission: (permissionCode: string) => Permission | null;
  hasAllPermissions: (permissionCodes: string[]) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
}

// Create permission context with default values
const PermissionContext = createContext<PermissionContextValue>({
  permissions: [],
  isLoading: true,
  error: null,
  lastUpdated: null,
  isInitialized: false,

  hasPermission: () => false,
  loadPermissions: async () => false,
  getPermission: () => null,
  hasAllPermissions: () => false,
  hasAnyPermission: () => false
});

// Provider props
interface PermissionProviderProps {
  children: React.ReactNode;
}

/**
 * Permission Provider Component
 * 
 * Manages permission state and loading logic throughout the application
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
  // Auth state from AuthProvider
  const { isAuthenticated, user } = useAuth();

  // State
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Permissions lookup map for efficient checking
  const permissionsMap = useMemo(() => {
    const map = new Map<string, Permission>();
    permissions.forEach(permission => {
      map.set(permission.code.toLowerCase(), permission);
    });
    return map;
  }, [permissions]);

  /**
   * Normalize permission code for consistent checking
   */
  const normalizePermissionCode = useCallback((code: string): string => {
    return code.trim().toLowerCase();
  }, []);

  /**
   * Check if user has permission
   */
  const hasPermission = useCallback((permissionCode: string | string[]): boolean => {
    // Handle array of permissions (check if user has any of them)
    if (Array.isArray(permissionCode)) {
      return permissionCode.some(code => hasPermission(code));
    }

    // If not authenticated, no permissions
    if (!isAuthenticated || !user) {
      return false;
    }

    // Normalize permission code
    const normalizedCode = normalizePermissionCode(permissionCode);

    // Admin users always have all permissions
    if (user.role === 'admin') {
      return true;
    }

    // Check if permission exists in map
    return permissionsMap.has(normalizedCode);
  }, [isAuthenticated, user, permissionsMap, normalizePermissionCode]);

  /**
   * Check if user has all permissions
   */
  const hasAllPermissions = useCallback((permissionCodes: string[]): boolean => {
    if (!isAuthenticated || !user || !permissionCodes.length) {
      return false;
    }

    return permissionCodes.every(code => hasPermission(code));
  }, [isAuthenticated, user, hasPermission]);

  /**
   * Check if user has any permission
   */
  const hasAnyPermission = useCallback((permissionCodes: string[]): boolean => {
    if (!isAuthenticated || !user || !permissionCodes.length) {
      return false;
    }

    return permissionCodes.some(code => hasPermission(code));
  }, [isAuthenticated, user, hasPermission]);

  /**
   * Get permission by code
   */
  const getPermission = useCallback((permissionCode: string): Permission | null => {
    const normalizedCode = normalizePermissionCode(permissionCode);
    return permissionsMap.get(normalizedCode) || null;
  }, [permissionsMap, normalizePermissionCode]);

  /**
   * Load user permissions following a structured approach:
   * 1. Load role-based permissions
   * 2. Load user-specific permissions
   * 3. Combine and cache both
   */
  const loadPermissions = useCallback(async (): Promise<boolean> => {
    // If not authenticated, no permissions
    if (!isAuthenticated || !user) {
      logger.debug('Not authenticated, skipping permission loading');
      setPermissions([]);
      setIsLoading(false);
      setError(null);
      setLastUpdated(new Date());
      setIsInitialized(true);
      return false;
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('Loading user permissions', { userId: user.id });

      // Initialize API client
      const { ApiClient } = await import('@/core/api');
      if (!ApiClient.isInitialized()) {
        await ApiClient.initialize();
      }

      // Step 1: Load role-based permissions
      logger.debug(`Loading role-based permissions for role: ${user.role}`);
      const roleResponse = await ApiClient.get(`/api/permissions/role-defaults/${user.role}`, {
        cache: 'no-store' as RequestCache
      });

      if (!roleResponse.success) {
        throw new Error(`Failed to load role permissions: ${roleResponse.message || 'Unknown error'}`);
      }

      // Extract role permissions
      let rolePermissions: string[] = [];
      if (Array.isArray(roleResponse.data)) {
        rolePermissions = roleResponse.data;
      } else if (roleResponse.data && typeof roleResponse.data === 'object' && 'permissions' in roleResponse.data) {
        rolePermissions = Array.isArray(roleResponse.data.permissions) ? roleResponse.data.permissions : [];
      }

      logger.info(`Loaded ${rolePermissions.length} role-based permissions for user ${user.id}`);

      // Step 2: Load user-specific permissions
      logger.debug(`Loading user-specific permissions for user: ${user.id}`);
      const userPermResponse = await ApiClient.get(`/api/users/permissions?userId=${user.id}`, {
        cache: 'no-store' as RequestCache
      });

      if (!userPermResponse.success) {
        throw new Error(`Failed to load user permissions: ${userPermResponse.message || 'Unknown error'}`);
      }

      // Extract user-specific permissions
      let userPermissions: string[] = [];
      if (userPermResponse.data && typeof userPermResponse.data === 'object') {
        if ('permissions' in userPermResponse.data && Array.isArray(userPermResponse.data.permissions)) {
          userPermissions = userPermResponse.data.permissions;
        } else if (Array.isArray(userPermResponse.data)) {
          userPermissions = userPermResponse.data;
        }
      }

      logger.info(`Loaded ${userPermissions.length} user-specific permissions for user ${user.id}`);

      // Step 3: Combine permissions (removing duplicates)
      const combinedPermissionCodes = new Set([...rolePermissions, ...userPermissions]);
      
      // Format permissions into consistent structure
      const formattedPermissions: Permission[] = Array.from(combinedPermissionCodes).map(code => ({
        id: 0,
        code,
        name: code,
        description: ''
      }));

      // Update state
      setPermissions(formattedPermissions);
      setLastUpdated(new Date());
      setIsLoading(false);
      setIsInitialized(true);

      logger.info(`Loaded total of ${formattedPermissions.length} permissions for user ${user.id}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error loading permissions:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        userId: user?.id
      });

      setError(errorMessage);
      setIsLoading(false);
      setIsInitialized(true);
      return false;
    }
  }, [isAuthenticated, user]);

  // Load permissions when authenticated
  useEffect(() => {
    // Skip if auth is not initialized
    if (!user || !isAuthenticated) {
      setPermissions([]);
      setError(null);
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }
    
    // Log auth state change
    logger.debug('Auth state changed in PermissionProvider', {
      isAuthenticated,
      userId: user?.id,
      permissionsCount: permissions.length,
      isInitialized,
    });
    
    // Set loading state
    setIsLoading(true);
    
    // Load permissions
    logger.info('Loading permissions for authenticated user', {
      userId: user?.id,
      isInitialized,
      permissionsCount: permissions.length
    });
    
    loadPermissions().catch(error => {
      logger.error('Failed to auto-load permissions', {
        error: error instanceof Error ? error.message : String(error),
        userId: user?.id
      });
      
      // Always mark as initialized
      setIsInitialized(true);
      setIsLoading(false);
    });
  }, [isAuthenticated, user, loadPermissions]);

  // Expose permission context value
  const contextValue: PermissionContextValue = {
    permissions,
    isLoading,
    error,
    lastUpdated,
    isInitialized,

    hasPermission,
    loadPermissions,
    getPermission,
    hasAllPermissions,
    hasAnyPermission
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook for using permission context
 */
export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }

  return context;
}

/**
 * Hook for checking a single permission
 */
export function usePermission(permissionCode: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permissionCode);
}

/**
 * Hook for checking multiple permissions (all)
 */
export function useAllPermissions(permissionCodes: string[]): boolean {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissionCodes);
}

/**
 * Hook for checking multiple permissions (any)
 */
export function useAnyPermission(permissionCodes: string[]): boolean {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissionCodes);
}

export default PermissionProvider;