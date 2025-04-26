/**
 * Auth Module Entities
 * 
 * This file exports domain entities specific to the auth feature module
 */

// Re-export domain entities used by the auth module
export type { User } from '@/domain/entities/User';
export type { RefreshToken } from '@/domain/entities/RefreshToken';

// Export auth-specific DTOs
export * from './auth-dtos';

