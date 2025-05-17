/**
 * Auth middleware index
 */

// Export auth middleware functions with different names for backward compatibility
export { auth, auth as authMiddleware, auth as apiAuth } from './authMiddleware';
export type { AuthOptions, AuthResult } from './authMiddleware';
