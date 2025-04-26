'use client';

/**
 * Client-side bootstrap utilities
 * This bootstrap file is specifically for browser environments.
 * It avoids server-only dependencies like Prisma.
 */

import { getLogger as getLoggerInternal, resetLogger } from '../logging';
import { ErrorHandler, IErrorHandler } from '../errors';
import { IValidationService } from '../validation/IValidationService';
import { ValidationService } from '../validation/ValidationService';
import { ApiClient } from '../api/ApiClient';
import { configService } from '../config/ConfigService';
import { createApiErrorInterceptor } from '../errors/api-error-interceptor';

// Singleton instances
let errorHandler: IErrorHandler;
let validationService: IValidationService;

// Track bootstrap completion to prevent duplicate bootstrapping
let isBootstrapCompleted = false;

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
 * Initializes client-side services
 * This function is safe to call in browser environments
 * 
 * @returns Promise resolved after initialization
 */
export async function bootstrapClient(): Promise<void> {
  // Skip if already bootstrapped
  if (isBootstrapCompleted) {
    console.log('Client bootstrap already completed, skipping');
    return;
  }
  try {
    // Verify we're in a client environment
    if (typeof window === 'undefined') {
      throw new Error('Client bootstrap cannot be used in server context');
    }
    
    // Initialize logger
    const logger = getLogger();
    logger.info('Client-side application bootstrap started');
    
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
    
    // Import Auth initialization functionality from features module
    const { initializeAuth } = await import('@/features/auth/lib/initialization/AuthInitializer');
    
    // Initialize client-side services
    const apiConfig = configService.getApiConfig();
    
    // Initialize API client through auth initializer which handles token management
    await initializeAuth({
      forceApi: true,
      source: 'core-bootstrap-client'
    });
    
    logger.info('Client-side application bootstrap completed successfully');
    isBootstrapCompleted = true;
  } catch (error) {
    // Use the logger if it's already initialized
    const logger = getLogger();
    logger.error('Client bootstrap failed', error instanceof Error ? error : { message: String(error) });
    throw error;
  }
}

/**
 * Resets all singleton instances (mainly for testing)
 */
export function resetClientServices(): void {
  resetLogger();
  errorHandler = undefined as any;
  validationService = undefined as any;
  isBootstrapCompleted = false;
  
  // Optional: import and call auth reset to maintain consistency
  import('@/features/auth/lib/initialization/AuthInitializer').then(({ resetAuthInitialization }) => {
    resetAuthInitialization();
  }).catch(err => {
    console.warn('Error resetting auth initialization:', err);
  });
}

/**
 * Returns the logger service instance
 */
function getLogger() {
  return getLoggerInternal();
}
