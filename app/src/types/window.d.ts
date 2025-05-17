/**
 * Type definitions for window object extensions
 * This file augments the Window interface with custom properties used throughout the application
 */

// Import actual function types to ensure type consistency
import { testAuthSystem, testPermissionSystem } from '@/features/auth/test-auth-system';

interface Window {
  // Auth provider state
  __AUTH_PROVIDER_STATE_KEY: string;
  
  // Token refresh state
  __TOKEN_REFRESH_STATE: string | null;
  __TOKEN_REFRESH_IN_PROGRESS: boolean;
  
  // Permission provider state
  __PERMISSION_PROVIDER: Record<string, boolean>;
  __PERMISSION_PROVIDER_DEBUG: boolean;
  
  // API client state
  __API_CLIENT_STATE: Record<string, string>;
  __API_INITIALIZERS: Function[];
  __AUTH_INITIALIZER_STATE: Record<string, string>;
  
  // Toast notifications
  __TOAST_REGISTRY__: Record<string, Function>;
  
  // Test helpers
  __testAuth: typeof testAuthSystem;
  __testPermissions: typeof testPermissionSystem;
  
  // File system access
  fs: {
    readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
  };
}
