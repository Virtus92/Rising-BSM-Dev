'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PermissionClient } from '@/features/permissions/lib/clients/PermissionClient';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/entities/User';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { subscribeToAuthEvent } from '@/features/auth/lib/initialization/AuthInitializer';

// Error class for permission-related failures
export class PermissionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

// Tracking ongoing permission fetches - for diagnostic purposes only
const ongoingPermissionsFetches = new Map<number, Promise<any>>();

/**
 * Hook for managing and checking user permissions
 * This implementation includes enhanced authentication state handling to prevent
 * premature permission requests before the auth system is ready
 * 
 * @param userId - User ID to get permissions for (defaults to current user)
 * @returns Permission-related state and utility functions
 */
export const usePermissions = (userId?: number) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const effectiveUserId = userId || user?.id;
  
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const permissionFetchAttempts = useRef(0);
  
  // Check if user is admin for optimizations
  const isAdmin = useMemo(() => {
    return userRole === UserRole.ADMIN || user?.role === UserRole.ADMIN;
  }, [userRole, user?.role]);

  // Set auth ready status when authentication loading completes
  useEffect(() => {
    if (!isAuthLoading) {
      // Auth loading is complete, whether successful or not
      setAuthReady(true);
    }
  }, [isAuthLoading]);

  // Fetch user permissions with improved error handling and auth awareness
  const fetchPermissions = useCallback(async (force: boolean = false) => {
    // Increment fetch attempt counter
    permissionFetchAttempts.current += 1;
    const currentAttempt = permissionFetchAttempts.current;
    
    // No userId means no permissions - handle gracefully with awareness of auth state
    if (!effectiveUserId) {
      // If auth is ready but no user ID, then the user is likely not authenticated
      const noUserError = new PermissionError(
        'No user ID available for permission check',
        'NO_USER_ID',
        { userId, userFromAuth: user?.id, authReady, attempt: currentAttempt }
      );
      
      // Log at debug level instead of warning to reduce noise for expected states
      console.debug('Unable to fetch permissions: No user ID available', {
        userId, 
        userFromAuth: user?.id,
        authReady
      });
      
      // Only set permissions if they aren't already empty - prevents infinite render loop
      if (permissions.length > 0) {
        setPermissions([]);
      }
      
      // Set minimum permissions based on user role from auth context
      if (user?.role) {
        setUserRole(user.role);
      }
      
      setIsLoading(false);
      setError(noUserError);
      return; // Return early without throwing
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Check if there's already an ongoing fetch for this user
      const existingFetch = ongoingPermissionsFetches.get(effectiveUserId);
      if (existingFetch && !force) {
        console.log(`Using existing permission fetch for user ID: ${effectiveUserId}`);
        
        try {
          // Wait for existing fetch
          const response = await existingFetch;
          
          // Process successful response
          if (response.success && response.data) {
            const perms = response.data.permissions || [];
            const role = response.data.role || null;
            
            setPermissions(perms);
            setUserRole(role);
            
            console.log(`Loaded ${perms.length} permissions for user ID: ${effectiveUserId} with role: ${role}`);
          } else {
            // API returned success: false - this is an error
            const apiError = new PermissionError(
              `Error loading permissions: ${response.message || 'Unknown error'}`,
              'API_ERROR',
              response
            );
            
            setError(apiError);
            throw apiError;
          }
        } catch (error) {
          // Remove from ongoing fetches
          ongoingPermissionsFetches.delete(effectiveUserId);
          
          // Set error state and rethrow
          const errorMessage = error instanceof Error ? error.message : String(error);
          const permissionError = error instanceof PermissionError 
            ? error 
            : new PermissionError(
                `Error fetching permissions: ${errorMessage}`,
                'FETCH_ERROR',
                error
              );
          
          setError(permissionError);
          throw permissionError;
        } finally {
          setIsLoading(false);
        }
        
        return;
      }
      
      // Make a fresh API call for permissions
      console.log(`Fetching permissions for user ID: ${effectiveUserId} (attempt: ${currentAttempt})`);
      
      try {
        // Create the API call and store the promise - BUT DON'T AWAIT IT YET
        const fetchPromise = PermissionClient.getUserPermissions(effectiveUserId);
        
        // Store in the tracking Map
        ongoingPermissionsFetches.set(effectiveUserId, fetchPromise);
        
        // Now await the promise
        const response = await fetchPromise;
        
        // Log response for debugging
        console.log(`Permission API response for user ${effectiveUserId}:`, {
          success: response?.success,
          statusCode: response?.statusCode,
          hasData: !!response?.data
        });
        
        // Validate response - throw explicit errors
        if (!response) {
          throw new PermissionError(
            `No response received from permissions API for user ${effectiveUserId}`,
            'NO_RESPONSE',
            { userId: effectiveUserId }
          );
        }
        
        if (!response.success) {
          throw new PermissionError(
            `Permission API error: ${response.message || 'Unknown error'}`,
            'API_ERROR',
            { 
              userId: effectiveUserId,
              statusCode: response.statusCode,
              message: response.message
            }
          );
        }
        
        if (!response.data || !response.data.permissions) {
          throw new PermissionError(
            `Permission API returned invalid data structure: missing permissions array`,
            'INVALID_RESPONSE',
            {
              userId: effectiveUserId,
              responseData: response.data
            }
          );
        }
        
        // Process valid response
        const perms = response.data.permissions || [];
        const role = response.data.role || null;
        
        setPermissions(perms);
        setUserRole(role);
        
        console.log(`Loaded ${perms.length} permissions for user ID: ${effectiveUserId} with role: ${role}`);
      } catch (error) {
        // Log error with detailed information but don't swallow it
        console.error('Permission fetch error:', {
          userId: effectiveUserId,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined
        });
        
        // Create a permission error if needed
        const permissionError = error instanceof PermissionError 
          ? error 
          : new PermissionError(
              `Error fetching permissions: ${error instanceof Error ? error.message : String(error)}`,
              'FETCH_ERROR',
              error
            );
        
        // Update state to reflect error
        // Only set permissions if they aren't already empty
        if (permissions.length > 0) {
          setPermissions([]);
        }
        setUserRole(null);
        setError(permissionError);
        
        // Explicitly throw the error to propagate it
        throw permissionError;
      } finally {
        setIsLoading(false);
        
        // Remove from ongoing fetches
        setTimeout(() => {
          ongoingPermissionsFetches.delete(effectiveUserId);
        }, 300);
      }
    } catch (err) {
      // This catch shouldn't be needed since we're propagating errors,
      // but it's here as a safety measure
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Unexpected error in permission fetch wrapper:', errorMessage);
      
      // Create a permission error if needed
      const permissionError = err instanceof PermissionError 
        ? err 
        : new PermissionError(
            `Unexpected error fetching permissions: ${errorMessage}`,
            'UNEXPECTED_ERROR',
            err
          );
      
      // Update state
      // Only set permissions if they aren't already empty
      if (permissions.length > 0) {
        setPermissions([]);
      }
      setUserRole(null);
      setError(permissionError);
      setIsLoading(false);
      
      // Clean up ongoing fetch on error
      setTimeout(() => {
        ongoingPermissionsFetches.delete(effectiveUserId);
      }, 300);
      
      // Rethrow the error
      throw permissionError;
    }
  }, [effectiveUserId, user, permissions.length, authReady]);

  // Subscribe to auth events instead of using a polling mechanism
  useEffect(() => {
    // If already authenticated and we have a user ID, fetch permissions immediately
    if (authReady && effectiveUserId) {
      // Use a small delay to ensure all systems are ready
      const initialFetchTimeout = setTimeout(() => {
        if (effectiveUserId) {
          fetchPermissions().catch(err => {
            console.error('Error loading permissions on initial fetch:', err);
          });
        }
      }, 500);
      
      return () => {
        clearTimeout(initialFetchTimeout);
      };
    }
    
    // If the auth system is still initializing, subscribe to the auth events
    console.log('Permissions system: Subscribing to auth initialization events');
    
    // Handler for authentication initialization completion
    const handleAuthInit = (status: any) => {
      console.log('Permissions system: Auth initialization completed', status);
      
      // Check if component is still mounted (through effectiveUserId dependency)
      if (status.isAuthenticated && status.userId) {
        console.log(`Permissions system: Auth ready and user authenticated (${status.userId}), fetching permissions`);
        // Small delay to ensure all systems are ready
        setTimeout(() => {
          if (effectiveUserId) {
            fetchPermissions().catch(err => {
              console.error('Error loading permissions after auth init:', err);
            });
          }
        }, 500);
      } else {
        // No authentication, set proper state
        console.log('Permissions system: Auth ready but user not authenticated');
        setIsLoading(false);
        setError(new PermissionError(
          'Authentication required for permissions',
          'AUTH_REQUIRED',
          { authStatus: status }
        ));
      }
    };
    
    // Subscribe to the initialization complete event
    const unsubscribe = subscribeToAuthEvent('init_complete', handleAuthInit);
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [effectiveUserId, authReady, fetchPermissions]);

  /**
   * Checks if the user has a specific permission
   * Handles authentication timing issues gracefully
   * 
   * @param permission - Permission to check for
   * @returns Whether the user has the permission
   */
  const hasPermission = useCallback((permission: SystemPermission | string): boolean => {
    // Quick validation - if no permission specified, default to deny
    if (!permission) {
      console.warn('hasPermission called with empty permission');
      return false;
    }
    
    // Admin users automatically have all permissions
    if (isAdmin) return true;
    
    // If permissions are still loading, we should deny but not throw
    if (isLoading) {
      console.debug(`Permission check for '${permission}' while still loading - temporarily denied`);
      return false;
    }
    
    // If there's no user ID but we're not loading, this is an auth timing issue
    // This happens during initial mount when auth isn't complete
    if (!effectiveUserId) {
      console.debug(`No user ID available for permission check '${permission}' - auth likely in progress`);
      // Return false instead of throwing since this could be temporary during auth
      return false;
    }
    
    // If there was an error loading permissions, we should fail closed without throwing
    if (error) {
      console.warn(`Cannot verify permission '${permission}' due to error: ${error.message}`);
      // During normal app operation, deny but don't throw to prevent unnecessary crashes
      return false;
    }
    
    // Check permissions directly once everything is properly loaded
    return permissions.includes(permission);
  }, [permissions, isAdmin, isLoading, error, effectiveUserId]);
  
  /**
   * Gets permissions for a role based on role defaults
   * This is used as a fallback when permission service fails
   * 
   * @param role - User role
   * @returns Array of permissions for the role
   */
  const getRoleBasedPermissions = useCallback((role?: string): SystemPermission[] => {
    if (!role) return [];
    
    // Use role-based permissions from PermissionEnums
    const normalizedRole = role.toLowerCase();
    
    switch (normalizedRole) {
      case 'admin':
        return Object.values(SystemPermission);
        
      case 'manager':
        return [
          SystemPermission.SYSTEM_ACCESS,
          SystemPermission.DASHBOARD_VIEW,
          SystemPermission.PROFILE_VIEW,
          SystemPermission.PROFILE_EDIT,
          SystemPermission.USERS_VIEW,
          SystemPermission.USERS_EDIT,
          SystemPermission.CUSTOMERS_VIEW, 
          SystemPermission.CUSTOMERS_CREATE,
          SystemPermission.CUSTOMERS_EDIT,
          SystemPermission.APPOINTMENTS_VIEW,
          SystemPermission.APPOINTMENTS_CREATE,
          SystemPermission.APPOINTMENTS_EDIT,
          SystemPermission.REQUESTS_VIEW,
          SystemPermission.REQUESTS_CREATE,
          SystemPermission.REQUESTS_EDIT,
          SystemPermission.REQUESTS_ASSIGN,
          SystemPermission.NOTIFICATIONS_VIEW,
          SystemPermission.NOTIFICATIONS_EDIT
        ];
        
      case 'employee':
        return [
          SystemPermission.SYSTEM_ACCESS,
          SystemPermission.DASHBOARD_VIEW,
          SystemPermission.PROFILE_VIEW,
          SystemPermission.PROFILE_EDIT,
          SystemPermission.CUSTOMERS_VIEW,
          SystemPermission.APPOINTMENTS_VIEW,
          SystemPermission.APPOINTMENTS_CREATE,
          SystemPermission.REQUESTS_VIEW,
          SystemPermission.NOTIFICATIONS_VIEW
        ];
        
      case 'user':
      default:
        return [
          SystemPermission.SYSTEM_ACCESS,
          SystemPermission.DASHBOARD_VIEW,
          SystemPermission.PROFILE_VIEW,
          SystemPermission.PROFILE_EDIT,
          SystemPermission.APPOINTMENTS_VIEW
        ];
    }
  }, []);

  /**
   * Checks if the user has any of the given permissions
   * Gracefully handles auth timing issues
   * 
   * @param permissionList - List of permissions to check
   * @returns Whether the user has any of the permissions
   */
  const hasAnyPermission = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    // Validate input
    if (!Array.isArray(permissionList) || permissionList.length === 0) {
      console.warn('hasAnyPermission called with invalid permission list');
      return false;
    }
    
    // Admin users automatically have all permissions
    if (isAdmin) return true;
    
    // Check if the user has any of the permissions
    // This will use hasPermission which handles loading/error states gracefully
    return permissionList.some(permission => hasPermission(permission));
  }, [hasPermission, isAdmin]);

  /**
   * Checks if the user has all of the given permissions
   * Strict implementation that doesn't use fallbacks
   * 
   * @param permissionList - List of permissions to check
   * @returns Whether the user has all of the permissions
   */
  const hasAllPermissions = useCallback((permissionList: (SystemPermission | string)[]): boolean => {
    // Validate input
    if (!Array.isArray(permissionList) || permissionList.length === 0) {
      console.warn('hasAllPermissions called with invalid permission list');
      return false;
    }
    
    // Admin users automatically have all permissions
    if (isAdmin) return true;
    
    // If we're loading or have an error, delegate to hasPermission which handles these cases
    if (isLoading || error) {
      try {
        return permissionList.every(permission => hasPermission(permission));
      } catch (err) {
        // If hasPermission throws, propagate the error
        throw err;
      }
    }
    
    // Check if the user has all of the permissions
    return permissionList.every(permission => permissions.includes(permission));
  }, [hasPermission, isAdmin, isLoading, error, permissions]);
  
  /**
   * Updates user permissions
   * No fallbacks - throws errors for all failures
   * 
   * @param newPermissions - New permissions to set
   * @returns Promise that resolves when update is complete
   * @throws PermissionError if update fails
   */
  const updatePermissions = async (newPermissions: string[]): Promise<boolean> => {
    if (!effectiveUserId) {
      throw new PermissionError(
        'Cannot update permissions: No user ID available',
        'NO_USER_ID',
        { newPermissions }
      );
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the API without error swallowing
      const response = await PermissionClient.updateUserPermissions({
        userId: effectiveUserId,
        permissions: newPermissions
      });
      
      // Handle API errors
      if (!response.success) {
        throw new PermissionError(
          `Failed to update user permissions: ${response.message || 'Unknown error'}`,
          'UPDATE_FAILED',
          { 
            userId: effectiveUserId,
            statusCode: response.statusCode,
            apiMessage: response.message
          }
        );
      }
      
      // Update state on success
      setPermissions(newPermissions);
      
      return true;
    } catch (error) {
      // Create a permission error if needed
      const permissionError = error instanceof PermissionError 
        ? error 
        : new PermissionError(
            `Error updating permissions: ${error instanceof Error ? error.message : String(error)}`,
            'UPDATE_ERROR',
            error
          );
      
      // Update error state
      setError(permissionError);
      
      // Rethrow the error
      throw permissionError;
    } finally {
      setIsLoading(false);
    }
  };

  // Return all permission-related state and functions
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
 * Strict implementation that requires proper permissions data
 * 
 * @param permission - Permission to check
 * @param userPermissions - List of user permissions
 * @param userRole - User role for admin check
 * @returns Whether the user has the permission
 * @throws PermissionError if input validation fails
 */
export const checkPermission = (
  permission: SystemPermission | string,
  userPermissions: string[],
  userRole?: string
): boolean => {
  // Validate inputs
  if (!permission) {
    throw new PermissionError(
      'Invalid permission: Permission cannot be empty',
      'INVALID_PERMISSION',
      { permission }
    );
  }
  
  if (!Array.isArray(userPermissions)) {
    throw new PermissionError(
      'Invalid permissions array',
      'INVALID_PERMISSIONS',
      { permissions: userPermissions }
    );
  }
  
  // Admin users automatically have all permissions
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Check if the permission is in the user's permissions
  return userPermissions.includes(permission);
};

/**
 * Utility to clear the permissions cache for a specific user
 * Call this after major permission changes or role updates
 * 
 * @param userId - User ID to clear from cache
 */
export const clearPermissionsCache = (userId: number): void => {
  // This function does nothing now since we've removed the cache
  console.log(`Permission caching has been disabled. Clearing cache for user ${userId} not needed.`);
  
  // Clear any ongoing fetch
  if (ongoingPermissionsFetches.has(userId)) {
    ongoingPermissionsFetches.delete(userId);
    console.debug(`Cleared ongoing permissions fetch for user ${userId}`);
  }
};

/**
 * Utility to clear the entire permissions cache
 * Call this after system-wide permission changes
 */
export const clearAllPermissionsCache = (): void => {
  // This function does nothing now since we've removed the cache
  console.log('Permission caching has been disabled. Clearing all caches not needed.');
  
  // Clear all ongoing fetches
  ongoingPermissionsFetches.clear();
  console.debug('Cleared all ongoing permission requests');
};

export default usePermissions;