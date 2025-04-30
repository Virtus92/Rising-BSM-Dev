/**
 * Users Services Module
 * 
 * This file exports all user-related service implementations.
 * It conditionally exports the appropriate service implementation based on the environment.
 */

// Static helpers and utility methods
export * from './UserService';

// Server-specific implementation 
export { UserService as UserServiceServer } from './UserService.server';

// Client-specific implementation
export { UserServiceClient } from './UserService.client';

// Adapter implementation - Export adapter functions directly for easier access
export { createUserService, getUserService, resetUserService } from './UserServiceAdapter';

// Export the adapter class itself for direct use
export { default as UserServiceAdapter } from './UserServiceAdapter';

// Default export for convenience
export { getUserService as default } from './UserServiceAdapter';

// Re-export IUserService from domain for convenience
export type { IUserService } from '@/domain/services/IUserService';

