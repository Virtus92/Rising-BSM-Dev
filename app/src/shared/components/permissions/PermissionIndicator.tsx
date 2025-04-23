import React from 'react';
import { usePermissions } from '@/features/users/hooks/usePermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { LockIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { UserRole } from '@/domain/entities/User';
import { useAuth } from '@/features/auth/providers/AuthProvider';

type PermissionIndicatorProps = {
  /**
   * The permission required to access this feature
   */
  permission: string;
  
  /**
   * Array of permissions, any of which grants access
   */
  anyPermission?: string[];
  
  /**
   * Array of permissions, all of which are required for access
   */
  allPermissions?: string[];
  
  /**
   * Content to show when user has permission
   */
  children: React.ReactNode;
  
  /**
   * Optional content to show when user lacks permission
   * If not provided, the feature will be hidden completely
   */
  fallback?: React.ReactNode;
  
  /**
   * Whether to show a dimmed version of the UI when lacking permission
   */
  showDisabled?: boolean;
  
  /**
   * Whether to show a tooltip explaining the permission requirement
   */
  showTooltip?: boolean;
  
  /**
   * Custom tooltip message
   */
  tooltipMessage?: string;
  
  /**
   * Additional classes to apply to the container
   */
  className?: string;
};

/**
 * Permission Indicator component to handle conditional rendering based on user permissions
 * 
 * Use this component to wrap UI elements that require specific permissions.
 * It will automatically handle showing/hiding content based on user permissions.
 */
export const PermissionIndicator: React.FC<PermissionIndicatorProps> = ({
  permission,
  anyPermission,
  allPermissions,
  children,
  fallback,
  showDisabled = false,
  showTooltip = true,
  tooltipMessage,
  className
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();
  const { user } = useAuth();
  
  // Don't render anything while permissions are loading
  if (isLoading) return null;
  
  // Check if user has required permissions
  let hasAccess = true;
  
  if (permission && !hasPermission(permission)) {
    hasAccess = false;
  }
  
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    hasAccess = false;
  }
  
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    hasAccess = false;
  }
  
  // Always grant access to admins (as a safety fallback)
  if (user?.role === UserRole.ADMIN) {
    hasAccess = true;
  }
  
  // User has permission, render normally
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // User doesn't have permission
  if (fallback) {
    // Render fallback UI if provided
    return <>{fallback}</>;
  } else if (showDisabled) {
    // Show disabled version of the UI
    const defaultTooltip = `You don't have permission to access this feature`;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("opacity-50 cursor-not-allowed pointer-events-none", className)}>
              {children}
            </div>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent>
              <div className="flex items-center">
                <LockIcon className="h-3.5 w-3.5 mr-2" />
                <span>{tooltipMessage || defaultTooltip}</span>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Otherwise, don't render anything
  return null;
};

/**
 * Component to display a friendly message when user doesn't have permission
 */
export const PermissionDeniedMessage: React.FC<{
  title?: string;
  message?: string;
  showIcon?: boolean;
  className?: string;
}> = ({
  title = "Access Restricted",
  message = "You don't have permission to access this feature.",
  showIcon = true,
  className
}) => {
  return (
    <div className={cn("p-6 bg-yellow-50 dark:bg-yellow-900/10 rounded-md border border-yellow-200 dark:border-yellow-800", className)}>
      <div className="flex items-start">
        {showIcon && (
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
        )}
        <div>
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">{title}</h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">{message}</p>
        </div>
      </div>
    </div>
  );
};