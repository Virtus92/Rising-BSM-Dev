/**
 * Auth Utilities
 * 
 * This file exports authentication helper functions and re-exports from the main initialization module
 */

// Re-export the initializeAuth implementation from the main module
export { 
  initializeAuth,
  isAuthInitialized,
  getAuthStatus,
  resetAuthInitialization,
  clearAuthState 
} from '../lib/initialization/AuthInitializer';

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/contact',
  '/about',
  '/services',
  '/api-docs', // If present
];

/**
 * Checks if a route is public and doesn't require authentication
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    path === route || 
    path.startsWith(route + '/') || 
    (route.endsWith('*') && path.startsWith(route.slice(0, -1)))
  );
}

/**
 * Extracts the redirect parameter from the URL
 */
export function getRedirectParam(searchParams?: URLSearchParams): string {
  const params = searchParams || new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  
  return params.get('redirect') || '/dashboard';
}

/**
 * Dispatches an auth status changed event
 */
export function dispatchAuthStatusEvent(isAuthenticated: boolean, user?: any | null): void {
  if (typeof window !== 'undefined') {
    try {
      const event = new CustomEvent('auth_status_changed', { 
        detail: { isAuthenticated, user } 
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error('Failed to dispatch auth event:', e);
    }
  }
}

/**
 * Checks if a user has the required role(s)
 */
export function hasRequiredRole(userRole: string | undefined, requiredRole: string | string[]): boolean {
  if (!userRole) {
    return false;
  }
  
  // Use simple role comparison
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
}
