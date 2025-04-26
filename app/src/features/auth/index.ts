export * from './components';
export * from './hooks/useAuthManagement';
// Re-export specific items from AuthProvider to avoid ambiguity
export { AuthProvider, useAuth } from './providers/AuthProvider';
export type { AuthRole } from './providers/AuthProvider';
// Rename User to AuthUser to avoid conflict
export type{ AuthUser } from './providers/AuthProvider';
// Export authentication utility functions
export { 
  initializeAuth,
  isAuthInitialized,
  getAuthStatus,
  resetAuthInitialization,
  clearAuthState,
  setupAuth,
  isAuthenticated,
  getUserFromAuthToken
} from './utils/authUtils';
export * from './api';
export * from './lib';
