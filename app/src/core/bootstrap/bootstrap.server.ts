/**
 * Server-only bootstrap utilities for initializing application services
 * This module is exclusively for server contexts and should never be imported in client code.
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { NextRequest } from 'next/server';
import { getLogger as getLoggerInternal, resetLogger } from '../logging';
import { errorHandler } from '../errors';
import { formatError } from '../errors';
import type { IErrorHandler } from '../errors/types/IErrorHandler';
import { AppError, ValidationError, NotFoundError, AuthenticationError, PermissionError, ConflictError, BadRequestError } from '../errors';
import { IValidationService } from '../validation/IValidationService';
import { ValidationService } from '../validation/ValidationService';
import { createApiErrorInterceptor } from '../errors/api-error-interceptor';
import { configService } from '../config/ConfigService';
import { UserStatus } from '@/domain/enums/UserEnums';

// Singleton instances
let errorHandlerInstance: IErrorHandler;
let validationService: IValidationService;


const logger = getLogger();

/**
 * Returns a singleton instance of the ErrorHandler
 */
export function getErrorHandler(): IErrorHandler {
  if (!errorHandlerInstance) {
    // Create the error handler with all required methods
    errorHandlerInstance = {
      createError: (message: string, statusCode = 500, errorCode?: string, details?: any) => {
        return new AppError(message, statusCode, errorCode || 'INTERNAL_ERROR', details);
      },
      
      createValidationError: (message: string, errors?: any, errorCode?: string) => {
        return new ValidationError(message, errorCode || 'VALIDATION_ERROR', { errors });
      },
      
      createNotFoundError: (message: string, errorCode?: string, details?: any) => {
        return new NotFoundError(message, errorCode || 'NOT_FOUND', details);
      },
      
      createUnauthorizedError: (message: string, errorCode?: string, details?: any) => {
        return new AuthenticationError(message, errorCode || 'UNAUTHORIZED', details);
      },
      
      createForbiddenError: (message: string, errorCode?: string, details?: any) => {
        return new PermissionError(message, errorCode || 'FORBIDDEN', details);
      },
      
      createConflictError: (message: string, errorCode?: string, details?: any) => {
        return new ConflictError(message, errorCode || 'CONFLICT', details);
      },
      
      createBadRequestError: (message: string, errorCode?: string, details?: any) => {
        return new BadRequestError(message, errorCode || 'BAD_REQUEST', details);
      },
      
      handleApiError: (error: unknown, request?: NextRequest) => {
        return formatError(error instanceof Error ? error.message : String(error), 500);
      },
      
      handleDatabaseError: (error: unknown) => {
        logger.error('Database error:', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : String(error)
        });
        
        // Map database-specific errors
        if (error && typeof error === 'object') {
          // Handle based on error codes or types
          if ('code' in error) {
            const code = (error as any).code;
            
            if (code === 'P2025') { // Prisma not found
              return new NotFoundError('Resource not found');
            }
            
            if (code === 'P2002') { // Prisma unique constraint
              return new ConflictError('Duplicate record');
            }
            
            if (code === 'P2003') { // Prisma foreign key constraint
              return new ConflictError('Referenced record not found');
            }
          }
          
          // If it's an Error instance with statusCode, assume it's already handled
          if (error instanceof Error && 'statusCode' in error) {
            return error as Error;
          }
        }
        
        // Default to internal error
        return new AppError(
          error instanceof Error ? error.message : 'Database operation failed',
          500,
          'DATABASE_ERROR'
        );
      },
      
      mapError: (error: unknown) => {
        logger.error('Mapping error:', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : String(error)
        });
        
        // If it's already an AppError, return it
        if (error instanceof AppError) {
          return error;
        }
        
        // Default to internal error
        return new AppError(
          error instanceof Error ? error.message : 'An error occurred',
          500,
          'INTERNAL_SERVER_ERROR'
        );
      },
      
    };
  }
  return errorHandlerInstance;
}

/**
 * Returns a singleton instance of the ValidationService
 */
export function getValidationService(): IValidationService {
  if (!validationService) {
    validationService = new ValidationService(getLogger());
  }
  return validationService;
}

/**
 * Initializes all server-side application services
 * This should only be called in true server environments (not Edge or Browser)
 * 
 * @returns Promise resolved after initialization
 */
export async function bootstrapServer(): Promise<void> {
  try {
    // Check that we're actually in a server environment
    if (typeof window !== 'undefined') {
      throw new Error('Server bootstrap cannot be used in browser context');
    }
    
    if (process.env.NEXT_RUNTIME === 'edge') {
      throw new Error('Server bootstrap cannot be used in Edge Runtime');
    }

    // Initialize logger
    const logger = getLogger();
    logger.info('Server-side application bootstrap started');
    
    // Log configuration information
    logger.info(`Bootstrapping application in ${configService.getEnvironment()} environment`);
    
    // Initialize error handler
    getErrorHandler();
    logger.debug('Error handler initialized');
    
    // Initialize validation service
    getValidationService();
    logger.debug('Validation service initialized');
    
    // Initialize API error interceptor
    const apiErrorInterceptor = createApiErrorInterceptor(logger, {
      verbose: configService.isDevelopment(),
      retry: {
        statusCodes: [408, 429, 500, 502, 503, 504],
        maxRetries: configService.getApiConfig().retries,
        delayMs: 1000,
        exponentialBackoff: true
      }
    });
    logger.debug('API error interceptor initialized');
    
    // Import factory functions explicitly with a modified approach
    // Using destructuring import to ensure we get the required functions
    // This is more reliable than dynamic imports in case of circular references
    let getServiceFactory, getRepositoryFactory, getDatabaseFactory;
    try {
      // Try standard import first
      const factories = await import('../factories');
      getServiceFactory = factories.getServiceFactory;
      getRepositoryFactory = factories.getRepositoryFactory;
      getDatabaseFactory = factories.getDatabaseFactory;
      
      // Verify we got all the required functions
      if (!getServiceFactory || !getRepositoryFactory || !getDatabaseFactory) {
        throw new Error('One or more factory functions not available');
      }
      
      logger.debug('Factory functions imported successfully');
    } catch (importError) {
      logger.error('Error importing factory functions', { error: importError });
      throw new Error('Failed to initialize application: Factory functions unavailable');
    }
    
    // Get service factory
    const serviceFactory = getServiceFactory();
    
    // Get repository factory
    const repositoryFactory = getRepositoryFactory();
    
    // Get database factory
    const databaseFactory = getDatabaseFactory();
    
    // Initialize Prisma
    const prismaClient = databaseFactory.getPrismaClient();
    logger.debug('Prisma client initialized');
    
    // Initialize repositories
    const userRepository = repositoryFactory.createUserRepository();
    repositoryFactory.createCustomerRepository();
    repositoryFactory.createAppointmentRepository();
    repositoryFactory.createRequestRepository();
    repositoryFactory.createActivityLogRepository();
    repositoryFactory.createNotificationRepository();
    repositoryFactory.createRefreshTokenRepository();
    const permissionRepository = repositoryFactory.createPermissionRepository();
    logger.debug('Repositories initialized');
    
    // Seed permissions if needed
    try {
      logger.info('Seeding permissions...');
      await permissionRepository.seedDefaultPermissions();
      logger.info('Permission seeding completed');
    } catch (error) {
      logger.error('Error seeding permissions', { error });
      // Don't block startup for permission seeding
    }
    
    // Initialize server-side services
    const userService = serviceFactory.createUserService();
    serviceFactory.createCustomerService();
    serviceFactory.createAppointmentService();
    serviceFactory.createRequestService();
    serviceFactory.createActivityLogService();
    serviceFactory.createNotificationService();
    serviceFactory.createRefreshTokenService();
    const permissionService = serviceFactory.createPermissionService();
    
    // Pre-warm caches on server only
    try {
      logger.info('Pre-warming permission cache...');
      // Get a limited number of active users to pre-warm the cache
      const activeUsers = await userService.findUsers({
        status: UserStatus.ACTIVE,
        limit: 20,
        page: 1
      });
      
      if (activeUsers.data?.length) {
        // Initialize permission cache for these users
        for (const user of activeUsers.data) {
          await permissionService.getUserPermissions(user.id);
        }
        logger.info(`Pre-warmed permission cache for ${activeUsers.data.length} active users`);
      }
    } catch (error) {
      logger.error('Error pre-warming permission cache', { error });
      // Don't block startup for cache warming
    }
    
    logger.debug('Server-side services initialized');
    logger.info('Server-side application bootstrap completed successfully');
  } catch (error) {
    // Use the logger if it's already initialized
    const logger = getLogger();
    logger.error('Server bootstrap failed', error instanceof Error ? error : { message: String(error) });
    throw error;
  }
}

/**
 * Resets all singleton instances (mainly for testing)
 */
export function resetServices(): void {
  resetLogger();
  errorHandlerInstance = undefined as any;
  validationService = undefined as any;
  
  // Import from core factories with improved error handling
  // This is critical for proper test cleanup
  try {
    const factories = require('../factories');
    if (factories) {
      // Use require instead of import to avoid any potential circular dependencies
      // This is more reliable for this specific use case
      if (factories.getDatabaseFactory) {
        const databaseFactory = factories.getDatabaseFactory();
        databaseFactory.resetPrismaClient();
      }
      
      if (factories.getRepositoryFactory) {
        const repositoryFactory = factories.getRepositoryFactory();
        repositoryFactory.resetRepositories();
      }
      
      if (factories.getServiceFactory) {
        const serviceFactory = factories.getServiceFactory();
        serviceFactory.resetServices();
      }
    }
  } catch (error) {
    console.error('Error resetting services:', error as Error);
  }
}

/**
 * Returns the logger service instance
 */
function getLogger() {
  return getLoggerInternal();
}
