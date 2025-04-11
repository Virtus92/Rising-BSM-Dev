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
    
    // Initialize API client only if not already initializing or initialized
    const apiConfig = configService.getApiConfig();
    await ApiClient.initialize({
      baseUrl: apiConfig.baseUrl,
      autoRefreshToken: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0'
      }
    });
    logger.debug('API client initialized with baseUrl', { baseUrl: apiConfig.baseUrl });

    // Initialize token manager
    await TokenManager.initialize();
    logger.debug('Token manager initialized');
    
    // Lazy-load factories to avoid circular dependencies
    const { getPrismaClient } = await import('./factories/databaseFactory');
    const { 
      getUserRepository, 
      getCustomerRepository,
      getAppointmentRepository,
      getRequestRepository,
      getActivityLogRepository,
      getNotificationRepository,
      getRefreshTokenRepository 
    } = await import('./factories/repositoryFactory');
    
    const { 
      getAuthService,
      getUserService,
      getCustomerService,
      getAppointmentService,
      getRequestService,
      getActivityLogService,
      getNotificationService,
      getRefreshTokenService 
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
    logger.debug('Repositories initialized');
    
    // Initialize services
    getAuthService();
    getUserService();
    getCustomerService();
    getAppointmentService();
    getRequestService();
    getActivityLogService();
    getNotificationService();
    getRefreshTokenService();
    logger.debug('Services initialized');
    
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

