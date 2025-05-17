'use client';

/**
 * PermissionProvider.tsx
 *
 * Clean implementation with no fallbacks or workarounds.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { getLogger } from '@/core/logging';
import { useAuth } from '@/features/auth/providers/AuthProvider';

// Logger
const logger = getLogger();

// Permission types
export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
}

// Context value type
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
 */
export function PermissionProvider({ children }: PermissionProviderProps) {
  // Get authentication state
  const { isAuthenticated, user } = useAuth();

  // State
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Memory cache for faster permission checking
  const permissionCache = useMemo(() => {
    const cache = new Map<string, boolean>();
    return cache;
  }, []);

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

    // Check cache first
    if (permissionCache.has(normalizedCode)) {
      return permissionCache.get(normalizedCode) || false;
    }

    // Check if permission exists in user's permissions
    const hasUserPermission = permissions.some(p =>
      normalizePermissionCode(p.code) === normalizedCode
    );

    // Cache result
    permissionCache.set(normalizedCode, hasUserPermission);

    return hasUserPermission;
  }, [isAuthenticated, user, permissions, permissionCache, normalizePermissionCode]);

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
    return permissions.find(p => normalizePermissionCode(p.code) === normalizedCode) || null;
  }, [permissions, normalizePermissionCode]);

  /**
   * Load user permissions directly - no fallbacks or workarounds
   */
  const loadPermissions = useCallback(async (): Promise<boolean> => {
    // If not authenticated, no permissions
    if (!isAuthenticated || !user) {
      logger.debug('Not authenticated, skipping permission loading');
      setPermissions([]);
      setIsLoading(false);
      setError(null);
      setLastUpdated(new Date());
      return false;
    }

    // Clean loading process
    setIsLoading(true);
    setError(null);

    try {
      logger.debug('Loading user permissions', { userId: user.id });

      // Clean caches - no reusing previous state
      permissionCache.clear();

      // Load permissions with a clean manager
      const PermissionRequestManager = (await import('../lib/utils/PermissionRequestManager')).default;
      const manager = PermissionRequestManager.getInstance();
      
      // Generate request ID for tracing
      const requestId = `user-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Get permissions - no retries, no fallbacks
      const permissionCodes = await manager.getPermissions(user.id, requestId);
      
      // Map to permission objects
      const mappedPermissions: Permission[] = permissionCodes.map(code => ({
        id: 0,
        code,
        name: code,
        description: ''
      }));

      // Update state
      setPermissions(mappedPermissions);
      setLastUpdated(new Date());
      setIsLoading(false);

      logger.info(`Loaded ${mappedPermissions.length} permissions for user ${user.id}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading permissions';
      logger.error('Error loading permissions:', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        userId: user?.id
      });

      setError(errorMessage);
      setIsLoading(false);
      setPermissions([]);
      return false;
    }
  }, [isAuthenticated, user, permissionCache]);

  // Only react to auth state changes, don't initialize proactively
  useEffect(() => {
    // Skip if auth is not initialized
    if (!user || !isAuthenticated) {
      setPermissions([]);
      permissionCache.clear();
      setError(null);
      setIsLoading(false);
      setIsInitialized(true); // Mark as initialized even with empty permissions
      return;
    }
    
    // Don't automatically load permissions - let AppInitializer handle that centrally
    // Just mark as initialized to prevent loading spinner
    setIsInitialized(true);
  }, [isAuthenticated, user, permissionCache]);

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

// Default export for easier imports
export default PermissionProvider;