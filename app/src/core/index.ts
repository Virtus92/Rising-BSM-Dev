// Export core modules for easy access with explicit imports to avoid ambiguity

// DB exports
import { getPrismaClient, db } from './db';
export { getPrismaClient, db };
// Use proper alias for getPrismaClientServer
import { getPrismaClient as getPrismaClientServer } from './db';
export { getPrismaClient as getPrismaClientServer } from './db';

// Errors exports - Split into value exports and type exports
import { 
  formatResponse, formatError, formatSuccess, formatValidationError,
  createErrorInterceptor,
  ErrorHandler,
  AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, BadRequestError,
  handleApiError
} from './errors';

// Import types separately for isolatedModules compatibility
import type {
  ApiError, ApiResponse, ApiRequestError, ApiValidationError,
  IErrorHandler
} from './errors';

// Export values (non-type exports)
export { 
  formatResponse, formatError, formatSuccess, formatValidationError,
  createErrorInterceptor,
  ErrorHandler,
  handleApiError
};

// Export error classes 
export {
  AppError, ValidationError, NotFoundError, UnauthorizedError, 
  ForbiddenError, ConflictError, BadRequestError
};

// Export types with 'export type' syntax for isolatedModules compatibility
export type {
  ApiError, ApiResponse, ApiRequestError, ApiValidationError,
  IErrorHandler
};

// Security exports - import from the security module
import { 
  hashPassword,
  verifyPassword, 
  generateSecureToken,
  generateSecureString,
  createHash
} from './security';

// Re-export security functions
export {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateSecureString,
  createHash
};

// Logging exports - Split into value and type exports
import { getLogger } from './logging';
import type { ILoggingService } from './logging';
import { LoggingService, LogLevel, LogFormat } from './logging/LoggingService';

// Export logging functions
export { getLogger, LoggingService, LogLevel, LogFormat };

// Export logging types with 'export type' syntax
export type { ILoggingService };

// Validation exports - Split into value and type exports
import { ValidationService, validateUserUpdate, validateUserCreate } from './validation';
import type { IValidationService, ValidationResult, SchemaDefinition } from './validation';

// Create validation service getter function if it doesn't exist
export const getValidationService = (): IValidationService => {
  return new ValidationService();
};

// Export validation functions and classes
export { ValidationService, validateUserUpdate, validateUserCreate };

// Export validation types with 'export type' syntax
export type { IValidationService, ValidationResult, SchemaDefinition };

// Bootstrap exports
import { bootstrap, resetServices } from './bootstrap';
export { bootstrap, resetServices };

// Import factory functions and classes - using explicit imports for clarity
import { 
  getServiceFactory, 
  getRepositoryFactory, 
  getDatabaseFactory,
  ServiceFactory, 
  RepositoryFactory, 
  DatabaseFactory 
} from './factories';

// Export factory functions and classes
export { 
  getServiceFactory, 
  getRepositoryFactory, 
  getDatabaseFactory,
  ServiceFactory, 
  RepositoryFactory, 
  DatabaseFactory
};

// API module exports
import { ApiClient, routeHandler } from './api';
// Define the ApiClientOptions type ourselves to avoid import errors
export interface ApiClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  credentials?: 'include' | 'omit' | 'same-origin';
}

// Define ApiClientResponse type
export interface ApiClientResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

// Export API values
export { ApiClient, routeHandler };

// Repository exports
import { BaseRepository, PrismaRepository } from './repositories';
import type { QueryOptions } from './repositories/PrismaRepository';

// Export repository classes
export { BaseRepository, PrismaRepository };

// Export repository types
export type { QueryOptions };

// Config exports
import { configService, ConfigService } from './config';
// Define Config and LogLevel types
export interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  },
  auth: {
    tokenExpiration: number;
    refreshTokenExpiration: number;
  },
  // Other configuration properties
  [key: string]: any;
}

// Export config values
export { configService, ConfigService };

// Additional exports for simplified imports
export { getErrorHandler } from './bootstrap';
export { createApiErrorInterceptor } from './errors';