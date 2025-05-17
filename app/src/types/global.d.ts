/**
 * Global type declarations for the Rising-BSM application
 * This file extends built-in interfaces with application-specific properties
 */

/**
 * Window interface extensions for global objects used throughout the application
 */
interface Window {
  // Auth testing functions (exported from test-auth-system.ts)
  __testAuth: typeof import('../features/auth/test-auth-system').testAuthSystem;
  __testPermissions: typeof import('../features/auth/test-auth-system').testPermissionSystem;
  
  // Permission system
  __PERMISSION_PROVIDER_DEBUG: {
    hasPermission: (permissionCode: string | string[]) => boolean;
    loadPermissions: () => Promise<boolean>;
    permissions: any[];
    hasAllPermissions?: (permissionCodes: string[]) => boolean;
    hasAnyPermission?: (permissionCodes: string[]) => boolean;
    [key: string]: any;
  };
  
  // API Client state
  __API_CLIENT_STATE?: {
    initialized: boolean;
    instance?: any;
    timestamp?: number;
    [key: string]: any;
  };
  
  // Authentication initialization state
  __AUTH_INITIALIZER_STATE?: {
    isInitializing: boolean;
    initPromise: Promise<any>;
    timestamp?: number;
  };
  
  // API initializers tracking
  __API_INITIALIZERS?: {
    inProgress: number;
    instances: Record<string, number>;
    lastInitTime: number;
  };
  
  // Toast registry for application-wide notifications
  __TOAST_REGISTRY__?: {
    toast: (props: {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive' | 'success';
      [key: string]: any;
    }) => void;
    [key: string]: any;
  };
}
