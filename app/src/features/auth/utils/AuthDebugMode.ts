/**
 * Authentication Debug Mode
 * 
 * Enables detailed error reporting and disables all fallbacks
 * for the authentication and permissions system.
 */

import { getItem, setItem, removeItem } from '@/shared/utils/storage/cookieStorage';

/**
 * Debug mode configuration
 */
export interface AuthDebugConfig {
  /**
   * Whether debug mode is enabled
   */
  enabled: boolean;
  
  /**
   * Whether to show detailed errors in UI components
   */
  showDetailedErrors: boolean;
  
  /**
   * Whether to log detailed debug information to console
   */
  verboseLogging: boolean;
  
  /**
   * Whether to disable all token caching
   */
  disableTokenCaching: boolean;
  
  /**
   * Whether to disable permission caching
   */
  disablePermissionCaching: boolean;
  
  /**
   * Whether to throw errors immediately instead of handling them
   */
  throwImmediately: boolean;
  
  /**
   * Error types to include in detailed logging
   */
  includeErrorTypes: string[];
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AuthDebugConfig = {
  enabled: false,
  showDetailedErrors: process.env.NODE_ENV === 'development',
  verboseLogging: process.env.NODE_ENV === 'development',
  disableTokenCaching: false,
  disablePermissionCaching: false,
  throwImmediately: false,
  includeErrorTypes: [
    'AUTH_REQUIRED',
    'AUTH_FAILED',
    'PERMISSION_DENIED',
    'PERMISSION_CHECK_FAILED',
    'TOKEN_INVALID',
    'TOKEN_EXPIRED',
    'TOKEN_MISSING',
    'TOKEN_REFRESH_FAILED'
  ]
};

/**
 * Current debug configuration
 */
let currentConfig = { ...DEFAULT_CONFIG };

// Enable debug mode if query parameter is present
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('auth_debug') || getItem('auth_debug') === 'true') {
    currentConfig.enabled = true;
    currentConfig.showDetailedErrors = true;
    currentConfig.verboseLogging = true;
    
    // Save debug mode in localStorage
    setItem('auth_debug', 'true');
    
    // Disable caching if query parameter specifies it
    if (urlParams.has('disable_token_cache') || getItem('disable_token_cache') === 'true') {
      currentConfig.disableTokenCaching = true;
      setItem('disable_token_cache', 'true');
    }
    
    if (urlParams.has('disable_permission_cache') || getItem('disable_permission_cache') === 'true') {
      currentConfig.disablePermissionCaching = true;
      setItem('disable_permission_cache', 'true');
    }
    
    if (urlParams.has('throw_immediately') || getItem('throw_immediately') === 'true') {
      currentConfig.throwImmediately = true;
      setItem('throw_immediately', 'true');
    }
    
    // Log debug mode is enabled
    console.log('🔍 Authentication Debug Mode Enabled', currentConfig);
    
    // Add debug indicator to page
    setTimeout(() => {
      const debugIndicator = document.createElement('div');
      debugIndicator.style.position = 'fixed';
      debugIndicator.style.bottom = '10px';
      debugIndicator.style.right = '10px';
      debugIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
      debugIndicator.style.color = 'white';
      debugIndicator.style.padding = '5px 10px';
      debugIndicator.style.borderRadius = '5px';
      debugIndicator.style.fontSize = '12px';
      debugIndicator.style.fontWeight = 'bold';
      debugIndicator.style.zIndex = '9999';
      debugIndicator.textContent = '🔍 AUTH DEBUG';
      debugIndicator.title = 'Authentication Debug Mode Enabled';
      document.body.appendChild(debugIndicator);
      
      // Make indicator clickable to toggle settings
      debugIndicator.style.cursor = 'pointer';
      debugIndicator.onclick = () => {
        toggleDebugMode();
      };
    }, 1000);
  }
}

/**
 * Enable auth debug mode
 * @param config Configuration options
 */
export function enableAuthDebugMode(config: Partial<AuthDebugConfig> = {}): void {
  currentConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    enabled: true
  };
  
  // Save debug mode in localStorage
  if (typeof window !== 'undefined') {
    setItem('auth_debug', 'true');
    
    if (currentConfig.disableTokenCaching) {
      setItem('disable_token_cache', 'true');
    }
    
    if (currentConfig.disablePermissionCaching) {
      setItem('disable_permission_cache', 'true');
    }
    
    if (currentConfig.throwImmediately) {
      setItem('throw_immediately', 'true');
    }
    
    // Log debug mode is enabled
    console.log('🔍 Authentication Debug Mode Enabled', currentConfig);
  }
}

/**
 * Disable auth debug mode
 */
export function disableAuthDebugMode(): void {
  currentConfig = { ...DEFAULT_CONFIG, enabled: false };
  
  // Clear debug mode from localStorage
  if (typeof window !== 'undefined') {
    removeItem('auth_debug');
    removeItem('disable_token_cache');
    removeItem('disable_permission_cache');
    removeItem('throw_immediately');
    
    // Log debug mode is disabled
    console.log('Authentication Debug Mode Disabled');
    
    // Remove debug indicator from page
    const debugIndicator = document.querySelector('[data-auth-debug-indicator]');
    if (debugIndicator) {
      debugIndicator.remove();
    }
    
    // Reload page to apply changes
    window.location.reload();
  }
}

/**
 * Toggle auth debug mode
 */
export function toggleDebugMode(): void {
  if (currentConfig.enabled) {
    disableAuthDebugMode();
  } else {
    enableAuthDebugMode();
  }
}

/**
 * Get current debug configuration
 * @returns Current debug configuration
 */
export function getAuthDebugConfig(): AuthDebugConfig {
  return { ...currentConfig };
}

/**
 * Check if auth debug mode is enabled
 * @returns Whether debug mode is enabled
 */
export function isAuthDebugEnabled(): boolean {
  return currentConfig.enabled;
}

// Export the debug mode configuration and functions
export default {
  enable: enableAuthDebugMode,
  disable: disableAuthDebugMode,
  toggle: toggleDebugMode,
  getConfig: getAuthDebugConfig,
  isEnabled: isAuthDebugEnabled
};
