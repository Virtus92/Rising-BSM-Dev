'use client';

import { AlertTriangle, ShieldAlert, AlertOctagon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { SystemPermission } from '@/domain/enums/PermissionEnums';
import { UserRole } from '@/domain/enums/UserEnums';

interface AccessDeniedProps {
  resource?: string;
  action?: string;
  message?: string;
  permission?: SystemPermission | string;
  role?: UserRole | string;
  showBackButton?: boolean;
  icon?: 'triangle' | 'shield' | 'octagon';
  variant?: 'default' | 'subtle' | 'destructive';
}

/**
 * Component displayed when a user lacks necessary permissions
 */
export function AccessDenied({ 
  resource, 
  action, 
  message,
  permission,
  role,
  showBackButton = true,
  icon = 'triangle',
  variant = 'default'
}: AccessDeniedProps) {
  const router = useRouter();
  
  // Generate default message based on provided info
  let defaultMessage = '';
  if (resource && action) {
    defaultMessage = `You don't have permission to ${action} ${resource}.`;
  } else if (permission) {
    defaultMessage = `You don't have the required permission: ${permission}.`;
  } else if (role) {
    defaultMessage = `You need to have the ${role} role to access this feature.`;
  } else {
    defaultMessage = 'You don\'t have permission to access this resource.';
  }
  
  // Select icon based on variant
  const IconComponent = {
    'triangle': AlertTriangle,
    'shield': ShieldAlert,
    'octagon': AlertOctagon
  }[icon];
  
  // Select background color based on variant
  const bgClass = {
    'default': 'bg-white dark:bg-slate-800',
    'subtle': 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    'destructive': 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }[variant];
  
  // Select icon color based on variant
  const iconClass = {
    'default': 'text-amber-500 dark:text-amber-400',
    'subtle': 'text-amber-600 dark:text-amber-500',
    'destructive': 'text-red-600 dark:text-red-500'
  }[variant];
  
  return (
    <div className="flex justify-center items-center h-full p-6">
      <Card className={`w-full max-w-md ${variant !== 'default' ? bgClass : ''}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <IconComponent className={`h-12 w-12 ${iconClass}`} />
          </div>
          <CardTitle className="text-xl">Access Denied</CardTitle>
          <CardDescription>
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Please contact your administrator if you believe you should have access to this feature.
          </p>
        </CardContent>
        {showBackButton && (
          <CardFooter className="flex justify-center">
            <Button 
              variant="default" 
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}