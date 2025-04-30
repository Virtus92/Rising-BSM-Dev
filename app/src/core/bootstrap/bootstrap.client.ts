'use client';

/**
 * Client-side bootstrap utilities
 * This bootstrap file is specifically for browser environments.
 * It avoids server-only dependencies like Prisma.
 */

import { NextRequest } from 'next/server';
import { getLogger as getLoggerInternal, resetLogger } from '../logging';
import { formatError } from '../errors';
import type { IErrorHandler } from '../errors/types/IErrorHandler';
import { AppError, ValidationError, NotFoundError, AuthenticationError, PermissionError, ConflictError, BadRequestError } from '../errors';
import { IValidationService } from '../validation/IValidationService';
import { ValidationService } from '../validation/ValidationService';
import { configService } from '../config/ConfigService';
import { createApiErrorInterceptor } from '../errors/api-error-interceptor';

// Singleton instances
let errorHandlerInstance: IErrorHandler;
let validationService: IValidationService;

// Track bootstrap completion to prevent duplicate bootstrapping
let isBootstrapCompleted = false;

// Get logger instance for use in this file
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
      }
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
  errorHandlerInstance = undefined as any;
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
