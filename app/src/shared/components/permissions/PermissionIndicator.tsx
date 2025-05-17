import React from 'react';
import { usePermissions } from '@/features/permissions/providers/PermissionProvider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { LockIcon, AlertCircle, ShieldAlert, ChevronLeft, Mail } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { UserRole } from '@/domain/entities/User';
import { useAuth } from '@/features/auth/providers/AuthProvider';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
 * Enhanced component to display a friendly and helpful message when user doesn't have permission
 */
export const PermissionDeniedMessage: React.FC<{
  title?: string;
  message?: string;
  showIcon?: boolean;
  className?: string;
  permissionName?: string;
  showContactLink?: boolean;
  showBackButton?: boolean;
  contactEmail?: string;
  customAction?: React.ReactNode;
}> = ({
  title = "Access Restricted",
  message = "You don't have permission to access this feature.",
  showIcon = true,
  className,
  permissionName,
  showContactLink = true,
  showBackButton = true,
  contactEmail = "support@rising-bsm.com",
  customAction
}) => {
  const router = useRouter();
  const { user } = useAuth();
  
  const goBack = () => {
    router.back();
  };

  return (
    <div className={cn("p-8 max-w-3xl mx-auto", className)}>
      <div className="flex flex-col items-center text-center space-y-6">
        {showIcon && (
          <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        )}
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground max-w-md">{message}</p>
          
          {permissionName && (
            <div className="mt-2 inline-block bg-muted px-2 py-1 rounded-md text-sm">
              <code>{permissionName}</code>
            </div>
          )}
        </div>
        
        <div className="border-t border-border w-full max-w-xs my-2 pt-6"> </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {showBackButton && (
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Go Back
            </Button>
          )}
          
          {customAction}
          
          {showContactLink && (
            <Button asChild>
              <Link href={`mailto:${contactEmail}?subject=Permission request: ${permissionName || 'Additional access'}&body=Hello,%0D%0A%0D%0AI need access to the following feature: ${permissionName || 'Restricted feature'}%0D%0A%0D%0AUser details:%0D%0A- Name: ${user?.name || 'Not available'}%0D%0A- Email: ${user?.email || 'Not available'}%0D%0A- ID: ${user?.id || 'Not available'}%0D%0A%0D%0AThank you.`}>
                <Mail className="mr-1 h-4 w-4" />
                Request Access
              </Link>
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground mt-4">
          If you believe this is a mistake, please contact your system administrator.
        </div>
      </div>
    </div>
  );
};