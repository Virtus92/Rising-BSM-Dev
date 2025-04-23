/**
 * Server-only bootstrap utilities for initializing application services
 * This module is exclusively for server contexts and should never be imported in client code.
 */

// Mark as server-only to prevent client-side imports
import 'server-only';

import { getLogger as getLoggerInternal, resetLogger } from './logging/index';
import { ErrorHandler, IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { ValidationService } from '@/infrastructure/common/validation/ValidationService';
import { createApiErrorInterceptor } from '@/infrastructure/common/error/ApiErrorInterceptor';
import { configService } from '@/infrastructure/services/ConfigService';
import { UserStatus } from '@/domain';

// Singleton instances
let errorHandler: IErrorHandler;
let validationService: IValidationService;

/**
 * Returns a singleton instance of the ErrorHandler
 */
export function getErrorHandler(): IErrorHandler {
  if (!errorHandler) {
    errorHandler = new ErrorHandler(getLogger());
  }
  return errorHandler;
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
    
    // Lazy-load server-only factories to avoid circular dependencies
    const { 
      getAuthService,
      getUserService,
      getCustomerService,
      getAppointmentService,
      getRequestService,
      getActivityLogService,
      getNotificationService,
      getRefreshTokenService,
      getPermissionService 
    } = await import('./factories/serviceFactory.server');
    
    // Server-only initializations that use Node.js features
    const { getPrismaClient } = await import('./factories/databaseFactory.server');
    const { 
      getUserRepository, 
      getCustomerRepository,
      getAppointmentRepository,
      getRequestRepository,
      getActivityLogRepository,
      getNotificationRepository,
      getRefreshTokenRepository,
      getPermissionRepository
    } = await import('./factories/repositoryFactory.server');
    
    // Initialize Prisma
    getPrismaClient();
    logger.debug('Prisma client initialized');
    
    // Initialize repositories
    getUserRepository();
    getCustomerRepository();
    getAppointmentRepository();
    getRequestRepository();
    getActivityLogRepository();
    getNotificationRepository();
    getRefreshTokenRepository();
    const permissionRepo = getPermissionRepository();
    logger.debug('Repositories initialized');
    
    // Seed permissions if needed
    try {
      logger.info('Seeding permissions...');
      await permissionRepo.seedDefaultPermissions();
      logger.info('Permission seeding completed');
    } catch (error) {
      logger.error('Error seeding permissions', { error });
      // Don't block startup for permission seeding
    }
    
    // Initialize server-side services
    const userService = getUserService();
    getCustomerService();
    getAppointmentService();
    getRequestService();
    getActivityLogService();
    getNotificationService();
    getRefreshTokenService();
    const permissionService = getPermissionService();
    
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
  errorHandler = undefined as any;
  validationService = undefined as any;
  
  // Lazy-load reset functions to avoid circular dependencies
  import('./factories/databaseFactory.server').then(({ resetPrismaClient }) => {
    resetPrismaClient();
  });
  
  import('./factories/repositoryFactory.server').then(({ resetRepositories }) => {
    resetRepositories();
  });
  
  import('./factories/serviceFactory.server').then(({ resetServices }) => {
    resetServices();
  });
}

/**
 * Returns the logger service instance
 */
function getLogger(): import("./logging/ILoggingService").ILoggingService {
  return getLoggerInternal();
}
