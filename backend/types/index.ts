/**
 * Types Export
 * 
 * This file exports all types, interfaces, and enums from the types directory.
 */

// Common types
export * from './common/types.js';

// Model types directly matching Prisma schema
export * from './models/index.js';

// DTOs for entity operations
export * from './dtos/user.dto.js';
export * from './dtos/customer.dto.js';
export * from './dtos/project.dto.js';
export * from './dtos/appointment.dto.js';
export * from './dtos/service.dto.js';
export * from './dtos/contact-request.dto.js';
export * from './dtos/auth.dto.js';

// Make previous imports available for legacy code
export { AuthUser, AuthenticatedRequest } from './common/types.js';