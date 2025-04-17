/**
 * Bootstrap utilities for initializing application services
 * 
 * Dieses Modul stellt zentrale Services bereit und initialisiert die Anwendung.
 */

import { getLogger as getLoggerInternal, resetLogger } from './logging/index';

/**
 * Exports the logger service
 */
export { getLogger as getLogger } from './logging/index';
import { ErrorHandler, IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { ValidationService } from '@/infrastructure/common/validation/ValidationService';
import { ApiClient } from '@/infrastructure/clients/ApiClient';
import { TokenManager } from '@/infrastructure/auth/TokenManager';
import { resetPrismaClient } from './factories/databaseFactory';
import { resetRepositories } from './factories/repositoryFactory';
import { resetServices as resetServiceInstances } from './factories/serviceFactory';
import { configService } from '@/infrastructure/services/ConfigService';
import { createApiErrorInterceptor } from '@/infrastructure/common/error/ApiErrorInterceptor';
import { User } from 'lucide-react';
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
 * Initializes all application services
 * 
 * @returns Promise der nach der Initialisierung aufgelöst wird
 */
export async function bootstrap(): Promise<void> {
  try {
    // Initialize logger
    const logger = getLogger();
    logger.info('Application bootstrap started');
    
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
    
    // Initialize API client only in client context
    const apiConfig = configService.getApiConfig();
    if (typeof window !== 'undefined') {
      // We're in a client context, safe to initialize ApiClient
      await ApiClient.initialize({
        baseUrl: apiConfig.baseUrl,
        autoRefreshToken: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '1.0.0'
        }
      });
      logger.debug('API client initialized with baseUrl', { baseUrl: apiConfig.baseUrl });

      // Initialize token manager (also client-only)
      await TokenManager.initialize();
      logger.debug('Token manager initialized');
    } else {
      // Server context - skip client-only initialization
      logger.debug('Skipping client-only API and token manager initialization in server context');
    }
    
    // Lazy-load factories to avoid circular dependencies
    const { getPrismaClient } = await import('./factories/databaseFactory');
    const { 
      getUserRepository, 
      getCustomerRepository,
      getAppointmentRepository,
      getRequestRepository,
      getActivityLogRepository,
      getNotificationRepository,
      getRefreshTokenRepository,
      getPermissionRepository
    } = await import('./factories/repositoryFactory');
    
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
    } = await import('./factories/serviceFactory');
    
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
    
    // Initialize services
    getAuthService();
    const userService = getUserService();
    getCustomerService();
    getAppointmentService();
    getRequestService();
    getActivityLogService();
    getNotificationService();
    getRefreshTokenService();
    const permissionService = getPermissionService();
    logger.debug('Services initialized');
    
    // Initialize permission cache for existing users
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
    
    logger.info('Application bootstrap completed successfully');
  } catch (error) {
    // Verwende den Logger, wenn er bereits initialisiert wurde
    const logger = getLogger();
    logger.error('Bootstrap failed', error instanceof Error ? error : { message: String(error) });
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
  resetPrismaClient();
  resetRepositories();
  resetServiceInstances();
}
/**
 * Returns the logger service instance
 */
function getLogger(): import("./logging/ILoggingService").ILoggingService {
  return getLoggerInternal();
}

