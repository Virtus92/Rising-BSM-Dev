/**
 * Authentication Module
 * 
 * This file exports all authentication-related functionality for easy imports.
 * Uses the centralized AuthService for auth operations.
 */

// Core Auth Service
export { default as AuthService } from './core/AuthService';
export * from './core/AuthService';

// Auth Provider
export { AuthProvider, useAuth } from './providers/AuthProvider';

// Auth Middleware
export { 
  auth,
  auth as authMiddleware, 
  withAuth, 
  getUserFromRequest,
  extractAuthToken 
} from './api/middleware/authMiddleware';
export type { AuthOptions, AuthResult } from './api/middleware/authMiddleware';

// Auth Handlers
export { loginHandler } from './api/handlers/loginHandler';
export { logoutHandler } from './api/handlers/logoutHandler';
export { refreshHandler } from './api/handlers/refreshHandler';

// Types
export * from './types';
export type { LoginDto, RegisterDto, TokenResponseDto } from '@/domain/dtos/AuthDtos';
export type { UserDto } from '@/domain/dtos/UserDtos';
