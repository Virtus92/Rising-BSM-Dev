'use client';

import React, { ReactNode, useMemo } from 'react';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { usePermissions, PermissionError } from '@/features/users/hooks/usePermissions';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { UserRole } from '@/domain/entities/User';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { PermissionDeniedMessage } from '@/shared/components/permissions/PermissionIndicator';
import { AuthErrorDisplay } from '@/shared/components/AuthErrorDisplay';
import { authErrorHandler, AuthErrorType } from '@/features/auth/utils/AuthErrorHandler';

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
  
  /**
   * Whether to show error details when permission check fails
   * @default true in development, false in production
   */
  showErrors?: boolean;
}

/**
 * Component that conditionally renders content based on user permissions
 * This implementation exposes all errors with proper error components
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
  showDeniedMessage = false,
  showErrors = process.env.NODE_ENV === 'development'
}) {
  // Generate a unique component ID for error reporting
  const componentId = useMemo(() => {
    const permStr = permission || '';
    const anyPermStr = anyPermission ? anyPermission.join(',') : '';
    const allPermStr = allPermissions ? allPermissions.join(',') : '';
    return `pg-${permStr}-${anyPermStr}-${allPermStr}-${userId || 'current'}`;
  }, [permission, anyPermission, allPermissions, userId]);

  // Use permissions hook - will throw errors when permissions aren't loaded
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, error, userRole } = usePermissions(userId);
  const { user } = useAuth();
  
  /* Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.debug(`PermissionGuard[${componentId}]:`, {
      permission,
      anyPermission,
      allPermissions,
      adminBypass,
      isAdmin: userRole === UserRole.ADMIN || user?.role === UserRole.ADMIN,
      isLoading,
      hasError: !!error
    });
  }*/
  
  // Handle errors in permission checking
  if (error) {
    // For critical permissions (like profile view), assume granted to avoid locking users out
    const isCriticalPermission = (
      (permission && [
        SystemPermission.PROFILE_VIEW,
        SystemPermission.DASHBOARD_VIEW,
        SystemPermission.SYSTEM_ACCESS
      ].includes(permission as SystemPermission)) ||
      (anyPermission && anyPermission.some(p => [
        SystemPermission.PROFILE_VIEW,
        SystemPermission.DASHBOARD_VIEW,
        SystemPermission.SYSTEM_ACCESS
      ].includes(p as SystemPermission)))
    );
    
    if (isCriticalPermission) {
      console.warn(`PermissionGuard: Allowing access to critical permission despite error: ${error.message}`);
      return <>{children}</>;
    }
    
    if (showErrors) {
      // Convert error to AuthError for consistent display
      const authError = authErrorHandler.normalizeError(error, {
        component: 'PermissionGuard',
        componentId,
        permission: permission || anyPermission || allPermissions
      });
      
      return <AuthErrorDisplay error={authError} />;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showDeniedMessage) {
      return <PermissionDeniedMessage 
        title="Permission Error" 
        message="An error occurred while checking permissions." 
      />;
    }
    
    // Default case: no error display
    return null;
  }
  
  // Handle loading state with a spinner or custom loading fallback
  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    } else if (showLoading) {
      return (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-muted-foreground">Checking permissions...</span>
          {process.env.NODE_ENV === 'development' && (
            <span className="ml-2 text-xs text-muted-foreground">
              (Permission: {permission || 
                (anyPermission ? anyPermission.join(',') : '') || 
                (allPermissions ? allPermissions.join(',') : '')})
            </span>
          )}
        </div>
      );
    }
    
    // Don't render anything during loading
    return null;
  }
  
  // Special case: admin bypass if enabled
  if (adminBypass) {
    // Check user role in a case-insensitive way to be consistent with server-side checks
    const isAdmin = 
      userRole === UserRole.ADMIN || 
      user?.role === UserRole.ADMIN || 
      (user?.role && typeof user.role === 'string' && user.role.toLowerCase() === 'admin');
    
    if (isAdmin) {
      return <>{children}</>;
    }
  }
  
  // If no permissions are specified, simply render the children
  if (!permission && !anyPermission && !allPermissions) {
    return <>{children}</>;
  }
  
  // Simplified permission check with built-in error handling from our updated hook
  // Check all specified permission types
  let hasAccess = false;
  
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
  
  // Render children if user has access
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Otherwise, render fallback or permission denied message
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showDeniedMessage) {
    // Get permission label for message
    const permissionLabel = permission 
      ? String(permission)
      : anyPermission 
        ? `any of (${anyPermission.join(', ')})`
        : `all of (${allPermissions?.join(', ')})`;
    
    return <AuthErrorDisplay 
      error={authErrorHandler.createPermissionError(
        `You don't have the required permission: ${permissionLabel}`,
        { permission: permissionLabel, component: 'PermissionGuard', componentId }
      )} 
      showDetails={false}
    />;
  }
  
  // Default case: no access, no fallback, no message
  return null;
});

export default PermissionGuard;
