// This file should only be used in server contexts
import 'server-only';
import { PrismaClient } from '@prisma/client';
import { getLogger } from '@/core/logging';

/**
 * Prisma Client Singleton
 * 
 * This file provides a unified singleton instance of PrismaClient with 
 * connection pooling, error handling, and performance optimizations.
 */

const logger = getLogger();

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Connection pool configuration
const POOL_TIMEOUT = parseInt(process.env.DATABASE_POOL_TIMEOUT || '10', 10);
const CONNECTION_LIMIT = parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10', 10);
const IDLE_TIMEOUT = parseInt(process.env.DATABASE_IDLE_TIMEOUT || '300', 10); // 5 minutes

/**
 * Create and configure PrismaClient with proper error handling
 * and connection pooling for optimal performance
 */
function createPrismaClient(): PrismaClient {
  logger.info('Initializing PrismaClient with connection pooling');
  
  // Get database URL from environment with fallback
  let dbUrl = process.env.DATABASE_URL;
  
  // Add connection pooling parameters if not already present
  if (dbUrl && !dbUrl.includes('connection_limit')) {
    const separator = dbUrl.includes('?') ? '&' : '?';
    dbUrl = `${dbUrl}${separator}connection_limit=${CONNECTION_LIMIT}&pool_timeout=${POOL_TIMEOUT}&idle_timeout=${IDLE_TIMEOUT}`;
  }
  
  try {
    // Create new PrismaClient with optimized configuration
    const client = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      datasources: {
        db: {
          url: dbUrl
        },
      },
     });
    
    // Set up query performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      const slowQueryThreshold = 500; // ms
      
      client.$on('query', (e) => {
        const queryStart = performance.now();
        
        // Log query details after completion
        // We use setTimeout to ensure the query has finished before measuring duration
        setTimeout(() => {
          const duration = Math.round(performance.now() - queryStart);
          
          // Log slow queries
          if (duration > slowQueryThreshold) {
            logger.warn('Slow database query detected', {
              query: e.query.substring(0, 100) + (e.query.length > 100 ? '...' : ''),
              params: JSON.stringify(e.params).substring(0, 50),
              duration: `${duration}ms`
            });
          }
        }, 0);
      });
    }
    
    // Enable metrics
    logger.debug('PrismaClient initialized with connection pooling', {
      connectionLimit: CONNECTION_LIMIT,
      poolTimeout: POOL_TIMEOUT,
      idleTimeout: IDLE_TIMEOUT
    });
    
    return client;
  } catch (error) {
    logger.error('Failed to initialize PrismaClient', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw new Error('Database connection failed. Please check your database configuration.');
  }
}

// Use global instance in development to prevent too many connections
// Use a new instance in production for better isolation
let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaInstance = createPrismaClient();
} else {
  // In development, reuse the existing instance to avoid connection issues during hot reloading
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  prismaInstance = global.prisma;
}

// Register shutdown handler in non-Edge environments
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  try {
    process.on('beforeExit', async () => {
      logger.info('Closing database connections on shutdown');
      await prismaInstance.$disconnect();
    });
  } catch (error) {
    // Ignore if process.on is not available (e.g., in Edge runtime)
    logger.debug('Could not register process shutdown handler (likely running in Edge runtime)');
  }
}

export const prisma = prismaInstance;

/**
 * Returns the singleton instance of PrismaClient
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}
