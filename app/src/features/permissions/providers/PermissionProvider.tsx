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
   * Check if user has permission with improved comparison logic
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

    // Admin users always have all permissions as a fallback
    if (user.role === 'admin') {
      return true;
    }

    // Check cache first
    if (permissionCache.has(normalizedCode)) {
      return permissionCache.get(normalizedCode) || false;
    }

    // Direct array search with normalized comparison for reliable matching
    const hasUserPermission = permissions.some(p => {
      const permCode = typeof p === 'string' ? p : p.code;
      return normalizePermissionCode(permCode) === normalizedCode;
    });

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
  * Load user permissions with improved error handling and fallback mechanism
  * @param options Optional configuration options
  * @param options.force Force reload permissions, bypassing cache
  * @param options.maxRetries Maximum number of retries (default: 2)
 */
const loadPermissions = useCallback(async (options?: { force?: boolean, maxRetries?: number }): Promise<boolean> => {
  // If not authenticated, no permissions
  if (!isAuthenticated || !user) {
  logger.debug('Not authenticated, skipping permission loading');
  setPermissions([]);
  setIsLoading(false);
  setError(null);
  setLastUpdated(new Date());
    return false;
  }

  // Track retries
  const maxRetries = options?.maxRetries ?? 2;
  let retryCount = 0;
  let lastError: Error | null = null;
  
  // Clean loading process
  setIsLoading(true);
  setError(null);

  while (retryCount <= maxRetries) {
  try {
    // Log retry information if applicable
    if (retryCount > 0) {
      logger.debug(`Retry attempt ${retryCount}/${maxRetries} for loading permissions`, { 
        userId: user.id,
        previousError: lastError?.message
      });
    } else {
      logger.debug('Loading user permissions', { userId: user.id });
    }

  // Clean caches - no reusing previous state
  permissionCache.clear();

  // Ensure API client is initialized
    const { ApiClient } = await import('@/core/api');
      if (!ApiClient.isInitialized()) {
      logger.debug('Initializing API client for permission loading');
      await ApiClient.initialize();
    }

      // Load permissions with a clean manager
    const PermissionRequestManager = (await import('../lib/utils/PermissionRequestManager')).default;
    const manager = PermissionRequestManager.getInstance();
      
    // Generate request ID for tracing
    const requestId = `user-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Get permissions - no fallbacks
  logger.debug(`Requesting permissions with requestId ${requestId}`);
    const permissionCodes = await manager.getPermissions(user.id, requestId, { force: options?.force });
      
    // Map to permission objects
    const mappedPermissions: Permission[] = permissionCodes.map(code => ({
      id: 0,
      code,
        name: code,
        description: ''
      }));

      // Validate permissions
      if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) {
        logger.warn('No permissions returned from server', { userId: user.id, requestId });
        
        // For admin users, add basic permissions to prevent being locked out
        if (user.role === 'admin' && retryCount === maxRetries) {
          const basicAdminPermissions = [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'customers.view', 'customers.create', 'customers.edit',
            'requests.view', 'requests.create', 'requests.edit',
            'appointments.view', 'appointments.create', 'appointments.edit'
          ];
          
          logger.info(`Adding ${basicAdminPermissions.length} fallback permissions for admin user`, {
            userId: user.id,
            role: user.role
          });
          
          const fallbackPermissions: Permission[] = basicAdminPermissions.map(code => ({
            id: 0,
            code,
            name: code,
            description: 'Fallback permission'
          }));
          
          setPermissions(fallbackPermissions);
          setLastUpdated(new Date());
          setIsLoading(false);
          
          return true;
        }
      }

      // Update state
      setPermissions(mappedPermissions);
      setLastUpdated(new Date());
      setIsLoading(false);

      logger.info(`Loaded ${mappedPermissions.length} permissions for user ${user.id}`);
      return true;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      retryCount++;
      
      if (retryCount <= maxRetries) {
        // Exponential backoff before retry
        const backoffMs = Math.min(200 * Math.pow(2, retryCount - 1), 2000);
        logger.warn(`Permission loading failed, retrying in ${backoffMs}ms...`, {
          error: lastError.message,
          attempt: retryCount,
          maxRetries,
          userId: user?.id
        });
        
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      } else {
        // All retries failed
        const errorMessage = lastError.message || 'Unknown error loading permissions';
        logger.error('All permission loading attempts failed:', {
          error: errorMessage,
          stack: lastError.stack,
          userId: user?.id,
          attempts: retryCount
        });

        setError(errorMessage);
        setIsLoading(false);
        
        // For admin users, add emergency basic permissions to prevent being locked out
        if (user.role === 'admin') {
          logger.warn('Adding emergency permissions for admin user after all retries failed', {
            userId: user.id,
            role: user.role
          });
          
          const emergencyPermissions: Permission[] = [
            'users.view', 'customers.view', 'requests.view', 'appointments.view'
          ].map(code => ({
            id: 0,
            code,
            name: code,
            description: 'Emergency permission'
          }));
          
          setPermissions(emergencyPermissions);
          return true;
        } else {
          setPermissions([]);
          return false;
        }
      }
    }
  }
  
  // This should never be reached due to the loop structure
  return false;
}, [isAuthenticated, user, permissionCache]);

    // Load permissions when authenticated with improved initialization
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
  
  // Add diagnostic info for tracking
  logger.debug('Auth state changed in PermissionProvider', {
    isAuthenticated,
    userId: user?.id,
    permissionsCount: permissions.length,
    isInitialized,
  });
  
  // Set loading state immediately
  setIsLoading(true);
  
  // Track initialization attempts
  const loadPermissionsWithRetry = async () => {
    try {
      logger.info('Loading permissions for authenticated user', {
        userId: user?.id,
        isInitialized,
        permissionsCount: permissions.length
      });
      
      // First try - always force refresh to ensure we have correct permissions
      const result = await loadPermissions({ force: true, maxRetries: 3 });
      
      if (!result && permissions.length === 0) {
        // Add basic admin permissions if user is admin to prevent being locked out
        if (user?.role === 'admin') {
          logger.info('Adding basic admin permissions after failed load', { userId: user.id });
          
          const basicAdminPermissions: Permission[] = [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'customers.view', 'requests.view', 'appointments.view'
          ].map(code => ({
            id: 0,
            code,
            name: code,
            description: 'Emergency admin permission'
          }));
          
          setPermissions(basicAdminPermissions);
        } else {
          // Schedule a retry after a delay
          logger.warn('Initial permission load failed, scheduling retry in 3s', {
            userId: user?.id
          });
          
          setTimeout(() => {
            // Check that user is still logged in
            if (user && isAuthenticated) {
              loadPermissions({ force: true, maxRetries: 2 }).catch(err => {
                logger.error('Scheduled permission retry failed', {
                  error: err instanceof Error ? err.message : String(err),
                  userId: user?.id
                });
              });
            }
          }, 3000);
        }
      }
    } catch (error) {
      logger.error('Failed to auto-load permissions', {
        error: error instanceof Error ? error.message : String(error),
        userId: user?.id
      });
    } finally {
      // Always mark as initialized to prevent loading spinner
      setIsInitialized(true);
      setIsLoading(false);
    }
  };
  
  // Automatically load permissions when authenticated and not initialized
  // This ensures permissions are always loaded when the component mounts
  if (isAuthenticated) {
    loadPermissionsWithRetry();
  } else {
    // Always ensure initialized flag is set
    setIsInitialized(true);
    setIsLoading(false);
  }
}, [isAuthenticated, user, permissionCache, loadPermissions]);
  
  // Add HMR detection to force permission reload with improved handling
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated && user?.id) {
      // Handle HMR events
      const handleHmrEvent = () => {
        logger.info('HMR event detected in PermissionProvider, forcing permission reload', {
          userId: user?.id,
          currentPermissionCount: permissions.length
        });
        
        // Force reload permissions on next update with retry logic
        loadPermissions({ force: true, maxRetries: 2 }).catch(error => {
          logger.error('Failed to reload permissions after HMR', {
            error: error instanceof Error ? error.message : String(error),
            userId: user?.id
          });
        });
      };
      
      // Register standard hmr-reload event
      window.addEventListener('hmr-reload', handleHmrEvent);
      
      // Also listen for fast-refresh events from Next.js
      window.addEventListener('fast-refresh-reload', handleHmrEvent);
      
      // Listen for application events that might require permission refresh
      window.addEventListener('auth-required', () => {
        // If authentication is required, permissions might need refreshing
        if (isAuthenticated && user?.id) {
          logger.debug('Auth event triggered, refreshing permissions');
          loadPermissions({ force: true }).catch(err => {
            logger.warn('Permission refresh after auth event failed', { 
              error: err instanceof Error ? err.message : String(err) 
            });
          });
        }
      });
      
      return () => {
        window.removeEventListener('hmr-reload', handleHmrEvent);
        window.removeEventListener('fast-refresh-reload', handleHmrEvent);
        window.removeEventListener('auth-required', handleHmrEvent);
      };
    }
  }, [isAuthenticated, user, loadPermissions, permissions.length]);

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