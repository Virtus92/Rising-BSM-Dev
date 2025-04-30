/**
 * Authentication Module
 * 
 * This file exports all authentication-related functionality for easy imports
 */

// Auth Middleware
export * from './api/middleware';

// Auth API Routes
export * from './api/routes';

// Auth Initialization
export * from './lib/initialization/AuthInitializer';

// Token Management
export * from './lib/clients/token';

// Auth Provider
export * from './providers/AuthProvider';

// Re-export AuthClient for API access
export { AuthClient } from './lib/clients/AuthClient';

// Default export for backward compatibility
import * as AuthModule from './api/middleware';
export default AuthModule;