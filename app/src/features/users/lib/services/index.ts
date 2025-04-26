/**
 * Users Services Module
 * 
 * This file exports all user-related service implementations.
 * It conditionally exports the appropriate service implementation based on the environment.
 */

// Static helpers and utility methods
export * from './UserService';

// Environment-specific implementations
export * from './UserService.server';
export * from './UserService.client';