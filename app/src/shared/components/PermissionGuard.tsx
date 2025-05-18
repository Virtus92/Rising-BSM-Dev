'use client';

/**
 * PermissionGuard.tsx
 * 
 * A component that conditionally renders its children based on user permissions.
 * Used to protect UI elements that require specific permissions.
 */

import React, { ReactNode, useMemo } from 'react';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { API_PERMISSIONS } from '@/features/permissions/constants/permissionConstants';
import { UserRole } from '@/domain/enums/UserEnums';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { PermissionDeniedMessage } from '@/shared/components/permissions/PermissionIndicator';
import { AuthErrorDisplay } from '@/shared/components/AuthErrorDisplay';
import { authErrorHandler } from '@/features/auth/utils/AuthErrorHandler';

interface PermissionGuardProps {
  /**
   * Permission required to access content
   */
  permission?: string;
  
  /**
   * Multiple permissions (any of these is required)
   */
  anyPermission?: string[];
  
  /**
   * Multiple permissions (all are required)
   */
  allPermissions?: string[];
  
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
* Modified PermissionGuard component to ensure admin users always have access
* and properly handle permissions in string or object format.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = React.memo(function PermissionGuard({
permission,
anyPermission,
allPermissions,
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
  return `pg-${permStr}-${anyPermStr}-${allPermStr}`;
  }, [permission, anyPermission, allPermissions]);

// Get current user from auth context
const { user, isAuthenticated } = useAuth();

// Get permission check utilities from permissions context
const { 
hasPermission, 
hasAllPermissions, 
hasAnyPermission, 
isLoading,
  isInitialized,
  permissions
} = usePermissions();

// Check if we need to show loading state
const showLoadingState = useMemo(() => {
  return isLoading && !isInitialized;
}, [isLoading, isInitialized]);

// Determine if user has access based on permissions with admin override
const hasAccess = useMemo(() => {
// Special case: admin bypass if enabled - this is our primary fallback
if (adminBypass && isAuthenticated && user?.role === 'admin') {
  return true;
}

// If no permissions are specified, always allow access
if (!permission && !anyPermission && !allPermissions) {
  return true;
}

// If permissions aren't loaded yet and user is authenticated, show loading state
if (isAuthenticated && (!isInitialized || permissions.length === 0)) {
  return false; // Return false to show loading state
}

// Check all specified permission types
let checkResult = false;

// Check individual permission
if (permission) {
  try {
    if (hasPermission(permission)) {
      checkResult = true;
    }
} catch (err) {
console.warn(`Error checking permission ${permission}:`, err);
}
}

// Check any permission
if (anyPermission && !checkResult) {
  try {
    // Check individually first for better error reporting
    for (const perm of anyPermission) {
      if (hasPermission(perm)) {
      checkResult = true;
    break;
}
}
  
// If still not granted, use the bulk check method
  if (!checkResult && hasAnyPermission(anyPermission)) {
      checkResult = true;
    }
  } catch (err) {
      console.warn(`Error checking any permissions:`, err);
  }
}

// Check all permissions
if (allPermissions && !checkResult) {
  try {
    if (hasAllPermissions(allPermissions)) {
      checkResult = true;
      }
    } catch (err) {
      console.warn(`Error checking all permissions:`, err);
    }
}

return checkResult;
}, [
permission, 
anyPermission, 
allPermissions, 
hasPermission, 
hasAnyPermission, 
hasAllPermissions, 
adminBypass, 
user?.role,
isAuthenticated,
isInitialized,
permissions.length
]);


// Handle loading states
if (showLoadingState || (isAuthenticated && !isInitialized)) {
// Show custom loading fallback if provided
if (loadingFallback) {
return <>{loadingFallback}</>;
} else if (showLoading) {
  // Show a loading indicator with contextual information
  return (
  <div className="flex flex-col justify-center items-center py-4">
    <div className="flex items-center">
        <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-muted-foreground">Checking permissions...</span>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <span className="mt-2 text-xs text-muted-foreground">
              (Permission: {permission || 
                (anyPermission ? anyPermission.join(',') : '') || 
                (allPermissions ? allPermissions.join(',') : '')})
            </span>
          )}
        </div>
      );
    }
    
    // Don't render anything during loading if no fallback specified
    return null;
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
    
    return <PermissionDeniedMessage 
      title="Access Denied" 
      message={`You don't have the required permission: ${permissionLabel}`} 
    />;
  }
  
  // Default case: no access, no fallback, no message
  return null;
});

export default PermissionGuard;