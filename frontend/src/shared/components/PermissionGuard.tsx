'use client';

import React, { ReactNode, useMemo } from 'react';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { UserRole } from '@/domain/entities/User';

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
}

/**
 * Component that conditionally renders content based on user permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = React.memo(function PermissionGuard({
  permission,
  anyPermission,
  allPermissions,
  userId,
  children,
  fallback = null,
  adminBypass = true
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, error, userRole } = usePermissions(userId);
  const { user } = useAuth();
  let permissions = user?.permissions;
  
  // Calculate access in a memoized function to prevent unnecessary recalculations
  const accessState = useMemo(() => {
    // Log debug info
    console.debug('PermissionGuard check:', {
      permission,
      anyPermission,
      allPermissions,
      adminBypass,
      userRole,
      userPermissions: permissions,
      isLoading,
      error
    });
    
    // Admin bypass: If user is an admin and adminBypass is enabled, grant access
    if (adminBypass && (
      userRole === UserRole.ADMIN || 
      user?.role === UserRole.ADMIN ||
      (user?.role || '').toLowerCase() === 'admin' // Case-insensitive check
    )) {
      console.debug('Admin bypass granted');
      return { hasAccess: true, isLoading: false, error: null };
    }
    
    // If permissions are still loading, we don't know yet
    if (isLoading) {
      return { hasAccess: false, isLoading: true, error: null };
    }
    
    // If there was an error fetching permissions, deny access and propagate error
    if (error) {
      console.error('Permission check error:', error);
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
    
    console.debug('Permission check result:', hasAccess);
    return { hasAccess, isLoading: false, error: null };
  }, [permission, anyPermission, allPermissions, hasPermission, hasAnyPermission, 
      hasAllPermissions, isLoading, error, adminBypass, userRole, user?.role, permissions]);
  
  // While loading, show a loading indicator or nothing based on configuration
  if (accessState.isLoading) {
    return null; // Could return a loading spinner here instead
  }
  
  // If there was an error fetching permissions, deny access and optionally show error
  if (accessState.error) {
    console.error('Permission check error:', accessState.error);
    return fallback ? <>{fallback}</> : null;
  }
  
  // Render based on permission check
  return accessState.hasAccess ? <>{children}</> : <>{fallback}</>;
})
