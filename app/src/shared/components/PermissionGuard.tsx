'use client';

import React, { ReactNode, useMemo } from 'react';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { UserRole } from '@/domain/entities/User';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { PermissionDeniedMessage } from '@/shared/components/permissions/PermissionIndicator';

interface PermissionGuardProps {
  /**
   * Permission required to access content
   */
  permission?: SystemPermission | string;
  
  /**
   * Multiple permissions (any of these is required)
   */
  anyPermission?: (SystemPermission | string)[];
  
  /**
   * Multiple permissions (all are required)
   */
  allPermissions?: (SystemPermission | string)[];
  
  /**
   * User ID to check permissions for (defaults to current user)
   */
  userId?: number;
  
  /**
   * Content to render if user has permission
   */
  children: ReactNode;
  
  /**
   * Optional fallback content to render if user lacks permission
   */
  fallback?: ReactNode;
  
  /**
   * Skip permission check for admin users
   * @default true
   */
  adminBypass?: boolean;
  
  /**
   * Shows a loading indicator while permissions are being loaded
   * @default true
   */
  showLoading?: boolean;
  
  /**
   * Custom content to display while loading permissions
   */
  loadingFallback?: ReactNode;
  
  /**
   * Whether to show a permission denied message when user lacks permission
   * @default false
   */
  showDeniedMessage?: boolean;
}

/**
 * Component that conditionally renders content based on user permissions
 */
/**
 * PermissionGuard Component
 * 
 * Provides a way to conditionally render content based on user permissions.
 * Use this component to protect UI elements that require specific permissions.
 * 
 * @example
 * <PermissionGuard permission="system.access">
 *   <ProtectedContent />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = React.memo(function PermissionGuard({
  permission,
  anyPermission,
  allPermissions,
  userId,
  children,
  fallback = null,
  adminBypass = true,
  showLoading = true,
  loadingFallback = null,
  showDeniedMessage = false
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, error, userRole } = usePermissions(userId);
  const { user } = useAuth();
  let permissions = user?.permissions;
  
  // Generate a unique key for component identity to prevent excessive re-renders
  const componentId = useMemo(() => {
    // Create a semi-unique key from the permission props
    const permStr = permission || '';
    const anyPermStr = anyPermission ? anyPermission.join(',') : '';
    const allPermStr = allPermissions ? allPermissions.join(',') : '';
    return `pg-${permStr}-${anyPermStr}-${allPermStr}-${userId || 'current'}`;
  }, [permission, anyPermission, allPermissions, userId]);
  
  // Calculate access in a memoized function to prevent unnecessary recalculations
  const accessState = useMemo(() => {
    // Skip permission check if no login required for this route
    const skipPermissionsCheck = false; // Set to true for any special cases
    if (skipPermissionsCheck) {
      return { hasAccess: true, isLoading: false, error: null };
    }
    
    // Only log in development to avoid cluttering production logs
    if (process.env.NODE_ENV === 'development') {
      // Use reduced logging to prevent console spam
      console.debug(`PermissionGuard[${componentId}]:`, {
        hasPermission: !!permission,
        permissionCount: anyPermission?.length || allPermissions?.length || 0,
        adminBypass,
        isAdmin: userRole === UserRole.ADMIN || user?.role === UserRole.ADMIN,
        isLoading
      });
    }
    
    // Admin bypass: If user is an admin and adminBypass is enabled, grant access
    if (adminBypass) {
      // Check user role in a case-insensitive way to be consistent with server-side checks
      const isAdmin = 
        userRole === UserRole.ADMIN || 
        user?.role === UserRole.ADMIN || 
        (user?.role && typeof user.role === 'string' && user.role.toLowerCase() === 'admin');
      
      if (isAdmin) {
        return { hasAccess: true, isLoading: false, error: null };
      }
    }
    
    // If permissions are still loading or user data isn't fully loaded yet, show loading state
    if (isLoading || !permissions) {
      return { hasAccess: false, isLoading: true, error: null };
    }
    
    // If there was an error fetching permissions, deny access and propagate error
    if (error) {
      // Only log once to prevent spam
      console.error(`Permission check error for component ${componentId}:`, error);
      return { hasAccess: false, isLoading: false, error };
    }
    
    let hasAccess = true;
    
    // Only apply permission checks if at least one type of permission is specified
    if (permission || anyPermission || allPermissions) {
      // Start with false and set to true if any check passes
      hasAccess = false;
      
      // Check individual permission
      if (permission) {
        if (hasPermission(permission)) {
          hasAccess = true;
        }
      }
      
      // Check any permission
      if (anyPermission && !hasAccess) {
        if (hasAnyPermission(anyPermission)) {
          hasAccess = true;
        }
      }
      
      // Check all permissions
      if (allPermissions && !hasAccess) {
        if (hasAllPermissions(allPermissions)) {
          hasAccess = true;
        }
      }
    }
    
    return { hasAccess, isLoading: false, error: null };
  }, [componentId, permission, anyPermission, allPermissions, hasPermission, hasAnyPermission, 
      hasAllPermissions, isLoading, error, adminBypass, userRole, user?.role, permissions]);
  
  // Handle loading state with a spinner or custom loading fallback
  if (accessState.isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    } else if (showLoading) {
      return (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-muted-foreground">Checking permissions...</span>
          {process.env.NODE_ENV === 'development' && (
            <span className="ml-2 text-xs text-muted-foreground">(Permission: {permission || (anyPermission ? anyPermission.join(',') : '') || (allPermissions ? allPermissions.join(',') : '')})</span>
          )}
        </div>
      );
    }
    return null;
  }
  
  // If there was an error fetching permissions, deny access and optionally show error
  if (accessState.error) {
    console.error('Permission check error:', accessState.error);
    // If fallback is provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }
    // Otherwise show a permission error message if enabled
    if (showDeniedMessage) {
      return <PermissionDeniedMessage 
        title="Permission Error" 
        message={`An error occurred while checking permissions: ${accessState.error}`} 
      />;
    }
    return null;
  }
  
  // Optimize rendering logic with early returns
  // If user has access, render the children
  if (accessState.hasAccess) {
    return <>{children}</>;
  }
  
  // If still loading, show loading indicator
  if (accessState.isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    } else if (showLoading) {
      return (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-muted-foreground">Checking permissions...</span>
        </div>
      );
    }
    return null;
  }
  
  // If user doesn't have access, render the fallback or permission denied message
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showDeniedMessage) {
    return <PermissionDeniedMessage 
      title="Access Restricted" 
      message={`You don't have the required permissions to access this feature.`} 
    />;
  }
  
  // Default case: no access, no fallback, no message
  return null;
})
