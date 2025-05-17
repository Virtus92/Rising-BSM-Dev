/**
 * Clean Bootstrap System
 * 
 * Single source of truth for application initialization.
 * Follows strict order of operations with no circular dependencies.
 */
import { getLogger } from '../logging';

const logger = getLogger();

/**
 * Bootstrap options
 */
export interface BootstrapOptions {
  environment?: 'development' | 'production' | 'test';
  features?: {
    auth?: boolean;
    api?: boolean;
    database?: boolean;
    cache?: boolean;
  };
}

/**
 * Bootstrap result
 */
export interface BootstrapResult {
  success: boolean;
  error?: Error;
  timestamp: Date;
  duration: number;
}

/**
 * Main bootstrap function for the application
 * Coordinates initialization across client and server environments
 * 
 * @param options Bootstrap options
 */
export async function bootstrap(options?: BootstrapOptions): Promise<BootstrapResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Starting application bootstrap', options);
    
    // Determine environment
    if (typeof window === 'undefined') {
      // Server-side bootstrap
      return await bootstrapServer(options);
    } else {
      // Client-side bootstrap
      return await bootstrapClient(options);
    }
  } catch (error) {
    logger.error('Bootstrap failed:', error instanceof Error ? error : String(error));
    
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Server-side bootstrap
 * Initializes server-specific services
 * 
 * @param options Bootstrap options
 */
export async function bootstrapServer(options?: BootstrapOptions): Promise<BootstrapResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Starting server-side bootstrap');
    
    // 1. First, load environment and configuration
    const config = process.env;
    
    // Validate required configuration
    if (!config.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }
    
    if (options?.features?.database !== false && !config.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // 2. Initialize database connection
    if (options?.features?.database !== false) {
      const { db } = await import('../db');
      
      // Test connection
      try {
        await db.$queryRaw`SELECT 1`;
        logger.info('Database connection established');
      } catch (error) {
        throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 3. Initialize services sequentially to avoid circular dependencies
    // Get service factory (with no circular imports)
    const { getServiceFactory } = await import('../factories/serviceFactory.server');
    const serviceFactory = getServiceFactory();
    
    // Initialize core services first
    logger.debug('Initializing core services');
    
    // 4. Initialize auth if enabled
    if (options?.features?.auth !== false) {
      logger.debug('Initializing authentication services');
      // No need to explicitly initialize as services are created on-demand
    }
    
    // 5. Initialize permission system
    try {
      logger.info('Initializing permission system');
      const { initializePermissionSystem } = await import('@/features/permissions/lib/services/PermissionInitializer');
      await initializePermissionSystem();
      logger.info('Permission system initialized');
    } catch (error) {
      logger.warn('Permission system initialization warning:', error as Error);
      // Don't block bootstrap for permission initialization
    }
    
    // Success
    const duration = Date.now() - startTime;
    logger.info(`Server-side bootstrap completed in ${duration}ms`);
    
    return {
      success: true,
      timestamp: new Date(),
      duration
    };
  } catch (error) {
    logger.error('Server-side bootstrap failed:', error instanceof Error ? error : String(error));
    
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Client-side bootstrap
 * Initializes client-specific services
 * 
 * @param options Bootstrap options
 */
export async function bootstrapClient(options?: BootstrapOptions): Promise<BootstrapResult> {
  const startTime = Date.now();
  
  try {
    logger.info('Starting client-side bootstrap');
    
    /* 1. Initialize API client
    if (options?.features?.api !== false) {
      const { ApiClient } = await import('../api/ApiClient');
      await ApiClient.initialize();
      logger.debug('API client initialized');
    }
    
    // 2. Initialize auth service
    if (options?.features?.auth !== false) {
      const { default: AuthService } = await import('@/features/auth/core/AuthService');
      await AuthService.initialize();
      logger.debug('Auth service initialized');
    }*/
    
    // Success
    const duration = Date.now() - startTime;
    logger.info(`Client-side bootstrap completed in ${duration}ms`);
    
    return {
      success: true,
      timestamp: new Date(),
      duration
    };
  } catch (error) {
    logger.error('Client-side bootstrap failed:', error instanceof Error ? error : String(error));
    
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }
}

// Default export
export default bootstrap;
