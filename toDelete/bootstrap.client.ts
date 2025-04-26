'use client';

/**
 * Client-side bootstrap utilities
 * This bootstrap file is specifically for browser environments.
 * It avoids server-only dependencies like Prisma.
 */

import { getLogger as getLoggerInternal, resetLogger } from './logging/index';
import { ErrorHandler, IErrorHandler } from '@/infrastructure/common/error/ErrorHandler';
import { IValidationService } from '@/infrastructure/common/validation/IValidationService';
import { ValidationService } from '@/infrastructure/common/validation/ValidationService';
import { ApiClient } from '@/core/api/ApiClient';
import { TokenManager } from '@/infrastructure/auth/TokenManager';
import { configService } from '@/infrastructure/services/ConfigService';
import { createApiErrorInterceptor } from '@/infrastructure/common/error/ApiErrorInterceptor';

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
    
    // Initialize client-side services
    const apiConfig = configService.getApiConfig();
    
    // Initialize API client
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
}

/**
 * Returns the logger service instance
 */
function getLogger(): import("./logging/ILoggingService").ILoggingService {
  return getLoggerInternal();
}
