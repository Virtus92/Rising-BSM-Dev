'use client';

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/entities/User';
import { useAuth } from '@/features/auth/providers/AuthProvider';
// Import the client-specific permission service directly to avoid server-only imports
import { permissionService as permissionServiceClient } from '@/features/permissions/lib/services/PermissionService.client';
// Import permission cache utilities
import { getPermissionFromCache, setPermissionInCache, clearPermissionCache } from '@/features/permissions/lib/utils/permissionCacheUtils';
// Import the user permissions response DTO type
import { UserPermissionsResponseDto } from '@/domain/dtos/PermissionDtos';


/**
 * Error class for permission-related failures
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

// Permission context interface
interface PermissionContextValue {
  permissions: SystemPermission[];
  userRole?: string;
  isLoading: boolean;
  error: Error | null;
  hasPermission: (permission: SystemPermission | string) => boolean;
  hasAnyPermission: (permissions: (SystemPermission | string)[]) => boolean;
  hasAllPermissions: (permissions: (SystemPermission | string)[]) => boolean;
  refreshPermissions: () => Promise<void>;
  cachedPermissions: Map<string, boolean>;
}

// Create context with default values
const PermissionContext = createContext<PermissionContextValue>({
  permissions: [],
  isLoading: true,
  error: null,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refreshPermissions: async () => {},
  cachedPermissions: new Map()
});

/**
 * Permission Provider Component
 * Provides centralized permission management for the entire application
 * This prevents multiple API calls for the same permissions
 */
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const userId = user?.id;
  
  // Store state in a single object for easier updates
  const [state, setState] = useState<{
    permissions: SystemPermission[];
    isLoading: boolean;
    error: Error | null;
    lastRefresh: number;
  }>({
    permissions: [],
    isLoading: true,
    error: null,
    lastRefresh: 0
  });

  // Cache for permissions to avoid redundant checks
  const permissionCacheRef = useRef<Map<string, boolean>>(new Map());
  
  // Check if user is admin for optimizations
  const isAdmin = useMemo(() => {
    return user?.role === UserRole.ADMIN;
  }, [user?.role]);

  // Fetch permissions once on mount or when user changes
  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, permissions: [], isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Create an AbortController for timeout management
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        console.log(`Fetching permissions for user ID: ${userId}`);
        const userPermissionsResponse = await Promise.race([
          permissionServiceClient.getUserPermissions(userId),
          new Promise<never>((_, reject) => {
            controller.signal.addEventListener('abort', () => {
              reject(new Error('Permission fetch timeout'));
            }); 
          })
        ]);
        
        // Clear timeout as request completed
        clearTimeout(timeoutId);
        
        // Log the raw response for debugging
        console.log('Raw permissions response:', JSON.stringify(userPermissionsResponse));
        
        // Type safety: cast only after checking structure exists
        const userPermissions = userPermissionsResponse as UserPermissionsResponseDto;
        
        if (userPermissions && Array.isArray(userPermissions.permissions)) {
          console.log(`Received ${userPermissions.permissions.length} permissions for user`);
          
          // Normalize permissions to lowercase strings
          const normalizedPermissions = userPermissions.permissions.map(p => String(p).toLowerCase());
          
          // No automatic injection of permissions not assigned to the user
          
          // Update local state with normalized permissions
          setState({
            permissions: normalizedPermissions as SystemPermission[],
            isLoading: false,
            error: null,
            lastRefresh: Date.now()
          });
          
          // Update the permission cache with the fresh data
          if (normalizedPermissions.length > 0) {
            // Clear existing cached permissions for this user
            permissionCacheRef.current.clear();
            
            // Cache all permissions
            normalizedPermissions.forEach((permission: string) => {
              // Cache in both storage systems
              setPermissionInCache(userId, permission, true, 600);
              permissionCacheRef.current.set(permission, true);
            });
            
            console.log(`Cached ${normalizedPermissions.length} permissions for user ${userId}`);
          }
        } else {
          console.warn('Received empty permissions from service', userPermissions);
          setState(prev => ({ ...prev, permissions: [], isLoading: false }));
        }
      } catch (apiError) {
        clearTimeout(timeoutId);
        console.error('API initialization or permission fetch failed:', apiError);
        throw apiError; // Propagate for proper handling
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Failed to fetch permissions'),
        isLoading: false 
      }));
    }
  }, [userId]);

  // Refresh permissions effect - run once when component mounts or user changes
  useEffect(() => {
    // Track if the effect is still mounted
    let isMounted = true;
    
    // Only run if we have a valid user and auth is initialized
    if (isInitialized && userId) {
      // Set initial loading state
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Execute fetch with proper error handling
      (async () => {
        try {
          await fetchPermissions();
        } catch (error) {
          console.error('Permission fetch failed in effect:', error);
          
          // Only update state if still mounted
          if (isMounted) {
            setState(prev => ({ 
              ...prev, 
              isLoading: false,
              error: error instanceof Error ? error : new Error('Failed to fetch permissions'),
              // Keep existing permissions if any
              permissions: prev.permissions.length > 0 ? prev.permissions : []
            }));
          }
        }
      })();
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [isInitialized, userId, fetchPermissions]);

  // Permission check function with caching using synchronous pattern
  // We must keep this synchronous for compatibility with the rest of the app
  const hasPermission = useCallback((permission: SystemPermission | string): boolean => {
    // Admin users automatically have all permissions
    if (isAdmin) return true;
    
    // If still loading permissions and we have a pending API call, 
    // assume permission is granted temporarily rather than blocking UI
    // This avoids UI flickering during initialization
    if (state.isLoading && !state.error) {
      console.log(`Permission check during loading for ${permission} - allowing temporarily`);
      // We should only do this during initial loading
      return true;
    }
    
    // Normalize permission string to lowercase for case-insensitive comparison
    const permissionStr = String(permission).toLowerCase();
    
    // First check in-memory cache (fastest and synchronous) with normalized key
    if (permissionCacheRef.current.has(permissionStr)) {
      const result = permissionCacheRef.current.get(permissionStr) || false;
      console.log(`Cache hit for ${permissionStr}: ${result}`);
      return result;
    }
    
    // Check in state - normalize both the permission being checked and the permissions in state
    const normalizedStatePermissions = state.permissions.map(p => String(p).toLowerCase());
    const hasPermissionInState = normalizedStatePermissions.includes(permissionStr);
    
    // Update memory cache with normalized key
    permissionCacheRef.current.set(permissionStr, hasPermissionInState);
    
    // Schedule async cache update without waiting for result
    if (userId && !state.isLoading && !state.error) {
      try {
        // Use a fire-and-forget approach for the persistent cache
        setPermissionInCache(userId, permissionStr, hasPermissionInState, 300);
      } catch (cacheError) {
        console.warn('Error updating permission cache:', cacheError);
      }
    }
    
    console.log(`Permission check: ${permissionStr}, result: ${hasPermissionInState}`);
    return hasPermissionInState;
  }, [state.permissions, state.isLoading, state.error, isAdmin, userId]);

  // Check if user has any of the given permissions
  const hasAnyPermission = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    if (isAdmin) return true;
    return permissionList.some(p => hasPermission(p));
  }, [hasPermission, isAdmin]);

  // Check if user has all of the given permissions
  const hasAllPermissions = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    if (isAdmin) return true;
    return permissionList.every(p => hasPermission(p));
  }, [hasPermission, isAdmin]);

  // Context value
  const contextValue = useMemo(() => ({
    permissions: state.permissions,
    userRole: user?.role,
    isLoading: state.isLoading,
    error: state.error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions: fetchPermissions,
    cachedPermissions: permissionCacheRef.current
  }), [state, user?.role, hasPermission, hasAnyPermission, hasAllPermissions, fetchPermissions]);

  return React.createElement(
    PermissionContext.Provider,
    { value: contextValue },
    children
  );
}

/**
 * Hook for accessing the permission context
 * @returns Permission context value
 */
export function usePermissionContext() {
  return useContext(PermissionContext);
}

/**
 * Hook for accessing permission data and capabilities
 * This version uses the global permission context to prevent duplicate API calls
 * 
 * @param userId - Optional user ID to get permissions for (defaults to current user)
 * @returns Permission-related state and utility functions
 */
export const usePermissions = (userId?: number) => {
  // Use the centralized permission context
  const context = usePermissionContext();
  const { user } = useAuth();
  
  // Determine if we're checking for a different user than the current
  const isCustomUserCheck = userId !== undefined && userId !== user?.id;
  
  // If checking for same user as current, use context for efficiency
  if (!isCustomUserCheck) {
    return {
      // Return all context values
      ...context,
      // Add legacy methods for backward compatibility
      grantPermission: async (permission: SystemPermission): Promise<void> => {
        // Call the API
        if (!user?.id) {
          throw new PermissionError('Cannot grant permission: No user ID available', 'NO_USER_ID');
        }
        
        try {
          await permissionServiceClient.addUserPermission(user.id, permission as string);
          // Refresh permissions
          await context.refreshPermissions();
        } catch (error) {
          throw new PermissionError(
            `Error granting permission: ${error instanceof Error ? error.message : String(error)}`,
            'GRANT_ERROR',
            error
          );
        }
      },
      revokePermission: async (permission: SystemPermission): Promise<void> => {
        if (!user?.id) {
          throw new PermissionError('Cannot revoke permission: No user ID available', 'NO_USER_ID');
        }
        
        try {
          await permissionServiceClient.removeUserPermission(user.id, permission as string);
          // Refresh permissions
          await context.refreshPermissions();
        } catch (error) {
          throw new PermissionError(
            `Error revoking permission: ${error instanceof Error ? error.message : String(error)}`,
            'REVOKE_ERROR',
            error
          );
        }
      },
      refetch: context.refreshPermissions
    };
  }
  
  // If checking for a different user, use a custom implementation
  // This is for when components need to check permissions for users other than the current
  const [customState, setCustomState] = useState<{
    permissions: SystemPermission[];
    isLoading: boolean;
    error: Error | null;
  }>({
    permissions: [],
    isLoading: true,
    error: null
  });
  
  // Custom fetch implementation for other users
  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setCustomState(prev => ({ ...prev, permissions: [], isLoading: false }));
      return;
    }
    
    try {
      setCustomState(prev => ({ ...prev, isLoading: true, error: null }));
      const userPermissionsResponse = await permissionServiceClient.getUserPermissions(userId);
      
      // Type safety: ensure we have the right structure before accessing properties
      const userPermissions = userPermissionsResponse as UserPermissionsResponseDto;
      
      if (userPermissions && Array.isArray(userPermissions.permissions)) {
        setCustomState({
          permissions: userPermissions.permissions as SystemPermission[],
          isLoading: false,
          error: null
        });
      } else {
        setCustomState({
          permissions: [],
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      setCustomState({
        permissions: [],
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch permissions')
      });
    }
  }, [userId]);
  
  // Fetch permissions on mount
  useEffect(() => {
    if (userId) {
      fetchPermissions();
    }
  }, [userId, fetchPermissions]);
  
  // Custom permission check for different users
  const hasPermission = useCallback((permission: SystemPermission | string): boolean => {
    // Normalize permission string to lowercase for case-insensitive comparison
    const permissionStr = String(permission).toLowerCase();
    
    // No special handling for specific permissions
    
    // Check permission cache first - use a synchronous pattern since this must return a boolean
    let cacheResult: boolean | undefined = undefined;
    if (userId) {
      try {
        // Get from cache but handle the fact that it might be a Promise
        const cachedValue = getPermissionFromCache(userId, permissionStr);
        // Since we need a synchronous result, only use the cache if it's already resolved
        if (typeof cachedValue === 'boolean') {
          cacheResult = cachedValue;
        }
      } catch (e) {
        console.warn('Error accessing permission cache:', e);
      }
      
      if (cacheResult !== undefined) {
        console.log(`Custom user check: Cache hit for ${permissionStr}: ${cacheResult}`);
        return cacheResult;
      }
    }
    
    // Check in memory - normalize permissions to lowercase strings
    const normalizedPermissions = customState.permissions.map(p => String(p).toLowerCase());
    const result = normalizedPermissions.includes(permissionStr);
    
    // Cache result for future checks
    if (userId && !customState.isLoading) {
      try {
        setPermissionInCache(userId, permissionStr, result, 300);
      } catch (cacheError) {
        console.warn('Error setting permission in cache:', cacheError);
      }
    }
    
    console.log(`Custom user check: Permission ${permissionStr}, result: ${result}`);
    return result;
  }, [userId, customState.permissions, customState.isLoading]);
  
  // Check for any permissions
  const hasAnyPermission = useCallback((permissions: (SystemPermission | string)[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);
  
  // Check for all permissions
  const hasAllPermissions = useCallback((permissions: (SystemPermission | string)[]): boolean => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);
  
  // Return custom implementation for other users
  return {
    permissions: customState.permissions,
    userRole: undefined, // We don't know the role for other users typically
    isLoading: customState.isLoading,
    error: customState.error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    grantPermission: async () => { throw new Error('Cannot grant permissions for other users'); },
    revokePermission: async () => { throw new Error('Cannot revoke permissions for other users'); },
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
  userPermissions: SystemPermission[],
  userRole?: string
): boolean => {
  // Admin users automatically have all permissions
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Check if the permission is in the user's permissions
  return userPermissions.includes(permission as SystemPermission);
};

export default usePermissions;
